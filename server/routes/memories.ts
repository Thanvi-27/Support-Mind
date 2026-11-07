import { Router } from 'express';
import { db } from '../db/database.ts';
import { hindsightService } from '../hindsight/hindsightService.ts';

const router = Router();

// GET memories for a customer or all
router.get('/', (req, res) => {
  try {
    const { customerId, type } = req.query;
    let query = `
      SELECT m.*, c.name as customer_name, c.email as customer_email, c.company as customer_company
      FROM customer_memories m
      JOIN customers c ON m.customer_id = c.id
      WHERE 1=1
    `;
    const params: (string | number | null)[] = [];

    if (customerId) {
      query += ' AND m.customer_id = ?';
      params.push(customerId as string);
    }
    if (type && type !== 'all') {
      query += ' AND m.memory_type = ?';
      params.push(type as string);
    }

    query += ' ORDER BY m.created_at DESC';

    const memories = db.prepare(query).all(...params);
    res.json({ memories });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    res.status(500).json({ error: message });
  }
});

// POST manually retain a memory
router.post('/', async (req, res) => {
  try {
    const { customerId, content, memoryType = 'fact', context = 'Manual Entry' } = req.body;
    if (!customerId || !content) {
      return res.status(400).json({ error: 'customerId and content are required' });
    }

    const result = await hindsightService.retainMemory({
      customerId,
      content,
      memoryType,
      context,
      source: 'manual_ui',
    });

    const memory = db.prepare(`
      SELECT m.*, c.name as customer_name 
      FROM customer_memories m
      JOIN customers c ON m.customer_id = c.id
      WHERE m.id = ?
    `).get(result.memoryId);

    res.status(201).json({ memory, result });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    res.status(500).json({ error: message });
  }
});

// POST test recall query against Hindsight memory
router.post('/recall-test', async (req, res) => {
  try {
    const { customerId, query, limit = 5 } = req.body;
    if (!customerId || !query) {
      return res.status(400).json({ error: 'customerId and query are required' });
    }

    const startTime = Date.now();
    const result = await hindsightService.recallMemories({
      customerId,
      query,
      limit,
    });
    const durationMs = Date.now() - startTime;

    res.json({
      query,
      customerId,
      bankId: hindsightService.getBankId(customerId),
      resultsCount: result.memories.length,
      memories: result.memories,
      promptString: result.promptString,
      source: result.source,
      durationMs,
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    res.status(500).json({ error: message });
  }
});

// DELETE a memory
router.delete('/:id', (req, res) => {
  try {
    const success = hindsightService.deleteMemory(req.params.id);
    if (!success) {
      return res.status(404).json({ error: 'Memory not found' });
    }
    res.json({ success: true, message: 'Memory deleted' });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    res.status(500).json({ error: message });
  }
});

// GET memory audit logs
router.get('/audit-logs', (req, res) => {
  try {
    const { customerId, limit = 20 } = req.query;
    let query = `
      SELECT l.*, c.name as customer_name 
      FROM memory_audit_logs l
      JOIN customers c ON l.customer_id = c.id
    `;
    const params: (string | number | null)[] = [];

    if (customerId) {
      query += ' WHERE l.customer_id = ?';
      params.push(customerId as string);
    }
    query += ' ORDER BY l.created_at DESC LIMIT ?';
    params.push(Number(limit));

    const logs = db.prepare(query).all(...params) as Array<Record<string, unknown>>;
    const formatted = logs.map(l => ({
      ...l,
      results: l.results_json ? JSON.parse(l.results_json as string) : null,
    }));

    res.json({ logs: formatted });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    res.status(500).json({ error: message });
  }
});

export default router;
