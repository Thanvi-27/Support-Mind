import { Router } from 'express';
import { db } from '../db/database.ts';
import { hindsightService } from '../hindsight/hindsightService.ts';
import { geminiService } from '../gemini/geminiService.ts';

const router = Router();

// GET conversations for customer or all
router.get('/', (req, res) => {
  try {
    const { customerId } = req.query;
    let query = `
      SELECT 
        c.*,
        cust.name as customer_name,
        cust.email as customer_email,
        cust.avatar as customer_avatar,
        (SELECT content FROM messages WHERE conversation_id = c.id ORDER BY created_at DESC LIMIT 1) as last_message,
        (SELECT created_at FROM messages WHERE conversation_id = c.id ORDER BY created_at DESC LIMIT 1) as last_message_at,
        (SELECT COUNT(*) FROM messages WHERE conversation_id = c.id) as message_count
      FROM conversations c
      JOIN customers cust ON c.customer_id = cust.id
    `;
    const params: (string | number | null)[] = [];

    if (customerId) {
      query += ' WHERE c.customer_id = ?';
      params.push(customerId as string);
    }
    query += ' ORDER BY c.updated_at DESC';

    const conversations = db.prepare(query).all(...params);
    res.json({ conversations });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    res.status(500).json({ error: message });
  }
});

// GET single conversation with full message history and metadata
router.get('/:id', (req, res) => {
  try {
    const conversation = db.prepare(`
      SELECT c.*, cust.name as customer_name, cust.email as customer_email, cust.company as customer_company,
             cust.plan as customer_plan, cust.device_info as customer_device, cust.preferences as customer_preferences,
             cust.avatar as customer_avatar
      FROM conversations c
      JOIN customers cust ON c.customer_id = cust.id
      WHERE c.id = ?
    `).get(req.params.id) as Record<string, unknown> | undefined;

    if (!conversation) {
      return res.status(404).json({ error: 'Conversation not found' });
    }

    const messages = db.prepare(`
      SELECT * FROM messages
      WHERE conversation_id = ?
      ORDER BY created_at ASC
    `).all(req.params.id) as Array<Record<string, unknown>>;

    const formattedMessages = messages.map(m => ({
      ...m,
      retrieved_memories: m.retrieved_memories_json ? JSON.parse(m.retrieved_memories_json as string) : [],
      metadata: m.metadata_json ? JSON.parse(m.metadata_json as string) : {},
    }));

    res.json({
      conversation,
      messages: formattedMessages,
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    res.status(500).json({ error: message });
  }
});

// POST create new conversation
router.post('/', (req, res) => {
  try {
    const { customerId, title, channel = 'Web Chat' } = req.body;
    if (!customerId) {
      return res.status(400).json({ error: 'customerId is required' });
    }

    const customer = db.prepare('SELECT * FROM customers WHERE id = ?').get(customerId);
    if (!customer) {
      return res.status(404).json({ error: 'Customer not found' });
    }

    const id = `conv_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
    const conversationTitle = title || `Support Session #${id.slice(-4)}`;

    db.prepare(`
      INSERT INTO conversations (id, customer_id, title, channel, status, created_at, updated_at)
      VALUES (?, ?, ?, ?, 'active', datetime('now'), datetime('now'))
    `).run(id, customerId, conversationTitle, channel);

    const created = db.prepare('SELECT * FROM conversations WHERE id = ?').get(id);
    res.status(201).json({ conversation: created });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    res.status(500).json({ error: message });
  }
});

/**
 * POST send customer message and execute SupportMind Hindsight + Gemini Workflow
 * Workflow steps:
 * 1. Store customer message in database
 * 2. Recall persistent memories for customer from Hindsight
 * 3. Invoke Gemini with memory context and recent conversation history
 * 4. Store agent response with recalled memory references
 * 5. Retain any extracted facts or new knowledge into Hindsight
 */
router.post('/:id/messages', async (req, res) => {
  const conversationId = req.params.id;
  const { content } = req.body;

  if (!content || typeof content !== 'string') {
    return res.status(400).json({ error: 'Message content is required' });
  }

  try {
    const conversation = db.prepare(`
      SELECT c.*, cust.id as customer_id, cust.name as customer_name, cust.email as customer_email,
             cust.company as customer_company, cust.plan as customer_plan, cust.device_info as customer_device,
             cust.preferences as customer_preferences
      FROM conversations c
      JOIN customers cust ON c.customer_id = cust.id
      WHERE c.id = ?
    `).get(conversationId) as Record<string, unknown> | undefined;

    if (!conversation) {
      return res.status(404).json({ error: 'Conversation not found' });
    }

    const customerId = conversation.customer_id as string;
    const customerObj = {
      id: customerId,
      name: conversation.customer_name as string,
      company: conversation.customer_company as string,
      plan: conversation.customer_plan as string,
      device_info: conversation.customer_device as string,
      preferences: conversation.customer_preferences as string,
    };

    // 1. Store Customer Message
    const customerMsgId = `msg_user_${Date.now()}`;
    db.prepare(`
      INSERT INTO messages (id, conversation_id, customer_id, sender, content, created_at)
      VALUES (?, ?, ?, 'customer', ?, datetime('now'))
    `).run(customerMsgId, conversationId, customerId, content);

    // 2. Step 2: Recall memories from Hindsight
    const recallStart = Date.now();
    const recallResult = await hindsightService.recallMemories({
      customerId,
      query: content,
      limit: 4,
    });
    const recallDurationMs = Date.now() - recallStart;

    // Fetch previous messages for context
    const recentRows = db.prepare(`
      SELECT sender, content FROM messages
      WHERE conversation_id = ?
      ORDER BY created_at ASC
    `).all(conversationId) as Array<{ sender: string; content: string }>;

    // 3. Step 3: Invoke Gemini with Recalled Hindsight Context
    const geminiStart = Date.now();
    const geminiResult = await geminiService.generateSupportResponse({
      customer: customerObj,
      currentMessage: content,
      chatHistory: recentRows,
      recalledMemories: recallResult.memories,
      promptString: recallResult.promptString,
    });
    const geminiDurationMs = Date.now() - geminiStart;

    // 4. Store Agent Response with Recalled Memories
    const agentMsgId = `msg_agent_${Date.now()}`;
    const agentMetadata = {
      hindsight_source: recallResult.source,
      recall_duration_ms: recallDurationMs,
      gemini_duration_ms: geminiDurationMs,
      memories_count: recallResult.memories.length,
      extracted_facts: geminiResult.extractedFactsToRetain || [],
    };

    db.prepare(`
      INSERT INTO messages (id, conversation_id, customer_id, sender, content, retrieved_memories_json, metadata_json, created_at)
      VALUES (?, ?, ?, 'agent', ?, ?, ?, datetime('now'))
    `).run(
      agentMsgId,
      conversationId,
      customerId,
      geminiResult.reply,
      JSON.stringify(recallResult.memories),
      JSON.stringify(agentMetadata)
    );

    // Update conversation timestamp
    db.prepare(`UPDATE conversations SET updated_at = datetime('now') WHERE id = ?`).run(conversationId);

    // 5. Step 5: Retain extracted facts into Hindsight
    if (geminiResult.extractedFactsToRetain && geminiResult.extractedFactsToRetain.length > 0) {
      for (const fact of geminiResult.extractedFactsToRetain) {
        hindsightService.retainMemory({
          customerId,
          content: fact,
          memoryType: 'fact',
          context: `Conversation: ${conversation.title}`,
          source: 'chat',
          sourceId: conversationId,
        }).catch(e => console.warn('[Hindsight] Background retain error:', e));
      }
    }

    res.json({
      customerMessage: {
        id: customerMsgId,
        conversation_id: conversationId,
        customer_id: customerId,
        sender: 'customer',
        content,
        created_at: new Date().toISOString(),
      },
      agentResponse: {
        id: agentMsgId,
        conversation_id: conversationId,
        customer_id: customerId,
        sender: 'agent',
        content: geminiResult.reply,
        retrieved_memories: recallResult.memories,
        metadata: agentMetadata,
        created_at: new Date().toISOString(),
      },
      timing: {
        recallDurationMs,
        geminiDurationMs,
      },
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    console.error('[Conversation API] Error:', err);
    res.status(500).json({ error: message });
  }
});

export default router;
