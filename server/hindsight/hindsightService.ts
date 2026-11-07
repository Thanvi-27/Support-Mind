import { HindsightClient, recallResponseToPromptString, type RecallResult } from '@vectorize-io/hindsight-client';
import { db } from '../db/database.ts';

export interface MemoryItem {
  id?: string;
  type: 'fact' | 'preference' | 'complaint' | 'resolution' | 'hardware' | 'observation' | string;
  text: string;
  score?: number;
  confidence?: number;
  timestamp?: string;
  source: 'hindsight_live' | 'local_engine';
  metadata?: Record<string, unknown>;
}

export interface HindsightStatus {
  connected: boolean;
  baseUrl: string;
  hasApiKey: boolean;
  apiVersion?: string;
  features?: Record<string, unknown>;
  error?: string;
  lastChecked: string;
}

class HindsightService {
  private client: HindsightClient;
  private baseUrl: string;
  private apiKey?: string;
  private statusCache: HindsightStatus | null = null;
  private lastCheckedTimestamp = 0;

  constructor() {
    this.baseUrl = process.env.HINDSIGHT_API_URL || 'http://localhost:8888';
    this.apiKey = process.env.HINDSIGHT_API_KEY || undefined;

    this.client = new HindsightClient({
      baseUrl: this.baseUrl,
      apiKey: this.apiKey,
    });
  }

  public getBankId(customerId: string): string {
    // Sanitize customerId for Hindsight bank identifier
    const safeId = customerId.replace(/[^a-zA-Z0-9_-]/g, '_');
    return `supportmind-cust-${safeId}`;
  }

  public async getStatus(forceRefresh = false): Promise<HindsightStatus> {
    const now = Date.now();
    if (!forceRefresh && this.statusCache && now - this.lastCheckedTimestamp < 10000) {
      return this.statusCache;
    }

    try {
      // Set short timeout so UI is never blocked if container is offline
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 2000);

      const version = await this.client.getVersion({ signal: controller.signal });
      clearTimeout(timeoutId);

      this.statusCache = {
        connected: true,
        baseUrl: this.baseUrl,
        hasApiKey: Boolean(this.apiKey),
        apiVersion: version.api_version,
        features: version.features as Record<string, unknown>,
        lastChecked: new Date().toISOString(),
      };
      this.lastCheckedTimestamp = now;
      return this.statusCache;
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : String(err);
      this.statusCache = {
        connected: false,
        baseUrl: this.baseUrl,
        hasApiKey: Boolean(this.apiKey),
        error: errorMessage.includes('abort') ? 'Connection timed out (no Hindsight server responding at ' + this.baseUrl + ')' : errorMessage,
        lastChecked: new Date().toISOString(),
      };
      this.lastCheckedTimestamp = now;
      return this.statusCache;
    }
  }

  /**
   * Retain information into Hindsight with customer-specific bank isolation
   */
  public async retainMemory(params: {
    customerId: string;
    content: string;
    memoryType?: 'fact' | 'preference' | 'complaint' | 'resolution' | 'hardware';
    context?: string;
    source?: string;
    sourceId?: string;
  }): Promise<{ success: boolean; memoryId: string; source: 'hindsight_live' | 'local_engine'; error?: string }> {
    const { customerId, content, memoryType = 'fact', context = 'Customer Support Conversation', source = 'chat', sourceId } = params;
    const bankId = this.getBankId(customerId);
    const memoryId = `mem_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    const startTime = Date.now();

    let savedToHindsight = false;
    let hindsightError: string | undefined;

    // 1. Attempt official Hindsight retain
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 1200);
      await this.client.retain(bankId, content, {
        context,
        timestamp: new Date(),
        metadata: {
          customerId,
          memoryType,
          source,
          sourceId: sourceId || '',
        },
        signal: controller.signal,
      });
      clearTimeout(timeoutId);
      savedToHindsight = true;
    } catch (err: unknown) {
      hindsightError = err instanceof Error ? err.message : String(err);
      console.warn(`[Hindsight] Retain to ${bankId} failed:`, hindsightError);
    }

    // 2. Persist to local SQLite database (for reliable fast queries and local fallback)
    try {
      db.prepare(`
        INSERT INTO customer_memories (id, customer_id, memory_type, content, confidence, source, source_id, hindsight_sync_status, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, datetime('now'), datetime('now'))
      `).run(
        memoryId,
        customerId,
        memoryType,
        content,
        0.95,
        source,
        sourceId || null,
        savedToHindsight ? 'synced' : 'local_only'
      );

      // Audit log
      db.prepare(`
        INSERT INTO memory_audit_logs (id, customer_id, action, query_or_content, results_json, duration_ms, source, created_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, datetime('now'))
      `).run(
        `log_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
        customerId,
        'retain',
        content,
        JSON.stringify({ memoryId, bankId, memoryType, savedToHindsight }),
        Date.now() - startTime,
        savedToHindsight ? 'hindsight_live' : 'local_engine'
      );
    } catch (dbErr) {
      console.error('[Database] Failed to insert customer memory:', dbErr);
    }

    return {
      success: true,
      memoryId,
      source: savedToHindsight ? 'hindsight_live' : 'local_engine',
      error: hindsightError,
    };
  }

  /**
   * Recall memories from Hindsight using customer-specific bank isolation
   */
  public async recallMemories(params: {
    customerId: string;
    query: string;
    limit?: number;
  }): Promise<{
    memories: MemoryItem[];
    promptString: string;
    source: 'hindsight_live' | 'local_engine';
    rawRecall?: unknown;
    error?: string;
  }> {
    const { customerId, query, limit = 5 } = params;
    const bankId = this.getBankId(customerId);
    const startTime = Date.now();

    // 1. Try Live Hindsight Recall
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 1200);
      const response = await this.client.recall(bankId, query, {
        budget: 'mid',
        signal: controller.signal,
      });
      clearTimeout(timeoutId);

      if (response && response.results && response.results.length > 0) {
        const promptString = recallResponseToPromptString(response);
        const memories: MemoryItem[] = response.results.slice(0, limit).map((r: RecallResult) => ({
          text: r.text,
          type: (r as unknown as { type?: string }).type || 'fact',
          score: (r as unknown as { score?: number }).score ?? 0.95,
          timestamp: (r as unknown as { timestamp?: string }).timestamp,
          source: 'hindsight_live',
          metadata: (r as unknown as { metadata?: Record<string, unknown> }).metadata,
        }));

        // Log audit
        db.prepare(`
          INSERT INTO memory_audit_logs (id, customer_id, action, query_or_content, results_json, duration_ms, source, created_at)
          VALUES (?, ?, ?, ?, ?, ?, ?, datetime('now'))
        `).run(
          `log_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
          customerId,
          'recall',
          query,
          JSON.stringify(memories),
          Date.now() - startTime,
          'hindsight_live'
        );

        return {
          memories,
          promptString,
          source: 'hindsight_live',
          rawRecall: response,
        };
      }
    } catch (err: unknown) {
      console.warn(`[Hindsight] Live recall for ${bankId} failed or server offline:`, err);
    }

    // 2. High-fidelity Local Memory Engine fallback using customer's persisted memories in SQLite
    const localRows = db.prepare(`
      SELECT id, memory_type, content, confidence, created_at, source
      FROM customer_memories
      WHERE customer_id = ?
      ORDER BY created_at DESC
      LIMIT 20
    `).all(customerId) as Array<{
      id: string;
      memory_type: string;
      content: string;
      confidence: number;
      created_at: string;
      source: string;
    }>;

    // Filter and score by semantic/keyword relevance to query
    const queryTerms = query.toLowerCase().split(/\s+/).filter(w => w.length > 2);
    const scored = localRows.map(row => {
      let score = 0.5; // base score for customer's historical memory
      const lower = row.content.toLowerCase();
      for (const term of queryTerms) {
        if (lower.includes(term)) {
          score += 0.2;
        }
      }
      // Weight complaints and resolutions higher
      if (row.memory_type === 'complaint' || row.memory_type === 'resolution') {
        score += 0.15;
      }
      return {
        id: row.id,
        text: row.content,
        type: row.memory_type,
        score: Math.min(0.99, Number(score.toFixed(2))),
        timestamp: row.created_at,
        source: 'local_engine' as const,
      };
    });

    // Sort by relevance score descending
    scored.sort((a, b) => (b.score || 0) - (a.score || 0));
    const finalMemories = scored.slice(0, limit);

    const promptString = finalMemories.length > 0
      ? `FACTS & OBSERVATIONS FOR CUSTOMER:\n` + finalMemories.map(m => `- [${m.type.toUpperCase()}] ${m.text}`).join('\n')
      : 'No previous customer memories retrieved.';

    // Log audit
    db.prepare(`
      INSERT INTO memory_audit_logs (id, customer_id, action, query_or_content, results_json, duration_ms, source, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, datetime('now'))
    `).run(
      `log_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      customerId,
      'recall',
      query,
      JSON.stringify(finalMemories),
      Date.now() - startTime,
      'local_engine'
    );

    return {
      memories: finalMemories,
      promptString,
      source: 'local_engine',
    };
  }

  /**
   * List all stored memories for a specific customer
   */
  public getCustomerMemories(customerId: string): MemoryItem[] {
    const rows = db.prepare(`
      SELECT id, memory_type, content, confidence, created_at, hindsight_sync_status
      FROM customer_memories
      WHERE customer_id = ?
      ORDER BY created_at DESC
    `).all(customerId) as Array<{
      id: string;
      memory_type: string;
      content: string;
      confidence: number;
      created_at: string;
      hindsight_sync_status: string;
    }>;

    return rows.map(r => ({
      id: r.id,
      text: r.content,
      type: r.memory_type,
      score: r.confidence,
      timestamp: r.created_at,
      source: r.hindsight_sync_status === 'synced' ? 'hindsight_live' : 'local_engine',
    }));
  }

  /**
   * Delete a memory
   */
  public deleteMemory(memoryId: string): boolean {
    const res = db.prepare('DELETE FROM customer_memories WHERE id = ?').run(memoryId);
    return res.changes > 0;
  }
}

export const hindsightService = new HindsightService();
