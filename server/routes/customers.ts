import { Router } from 'express';
import { db } from '../db/database.ts';

const router = Router();

// GET all customers with stats
router.get('/', (_req, res) => {
  try {
    const customers = db.prepare(`
      SELECT 
        c.*,
        (SELECT COUNT(*) FROM customer_memories WHERE customer_id = c.id) as memory_count,
        (SELECT COUNT(*) FROM tickets WHERE customer_id = c.id AND status != 'Resolved' AND status != 'Closed') as open_tickets_count,
        (SELECT COUNT(*) FROM conversations WHERE customer_id = c.id) as conversation_count
      FROM customers c
      ORDER BY c.created_at DESC
    `).all();

    res.json({ customers });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    res.status(500).json({ error: message });
  }
});

// GET customer by ID with full profile
router.get('/:id', (req, res) => {
  try {
    const customer = db.prepare('SELECT * FROM customers WHERE id = ?').get(req.params.id) as Record<string, unknown> | undefined;
    if (!customer) {
      return res.status(404).json({ error: 'Customer not found' });
    }

    const memories = db.prepare(`
      SELECT * FROM customer_memories 
      WHERE customer_id = ? 
      ORDER BY created_at DESC
    `).all(req.params.id);

    const tickets = db.prepare(`
      SELECT * FROM tickets 
      WHERE customer_id = ? 
      ORDER BY created_at DESC
    `).all(req.params.id);

    const conversations = db.prepare(`
      SELECT c.*, 
        (SELECT content FROM messages WHERE conversation_id = c.id ORDER BY created_at DESC LIMIT 1) as last_message,
        (SELECT created_at FROM messages WHERE conversation_id = c.id ORDER BY created_at DESC LIMIT 1) as last_message_at
      FROM conversations c
      WHERE c.customer_id = ?
      ORDER BY c.created_at DESC
    `).all(req.params.id);

    res.json({
      customer,
      memories,
      tickets,
      conversations,
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    res.status(500).json({ error: message });
  }
});

// POST create customer
router.post('/', (req, res) => {
  try {
    const { name, email, company, plan, device_info, preferences, avatar } = req.body;
    if (!name || !email) {
      return res.status(400).json({ error: 'Name and email are required' });
    }

    const id = `cust_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
    db.prepare(`
      INSERT INTO customers (id, name, email, company, plan, device_info, preferences, avatar, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, datetime('now'), datetime('now'))
    `).run(
      id,
      name,
      email,
      company || 'Individual',
      plan || 'Standard',
      device_info || '',
      preferences || '',
      avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${name}`
    );

    const created = db.prepare('SELECT * FROM customers WHERE id = ?').get(id);
    res.status(201).json({ customer: created });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    res.status(500).json({ error: message });
  }
});

// PUT update customer
router.put('/:id', (req, res) => {
  try {
    const { name, email, company, plan, device_info, preferences } = req.body;
    db.prepare(`
      UPDATE customers 
      SET name = COALESCE(?, name),
          email = COALESCE(?, email),
          company = COALESCE(?, company),
          plan = COALESCE(?, plan),
          device_info = COALESCE(?, device_info),
          preferences = COALESCE(?, preferences),
          updated_at = datetime('now')
      WHERE id = ?
    `).run(name, email, company, plan, device_info, preferences, req.params.id);

    const updated = db.prepare('SELECT * FROM customers WHERE id = ?').get(req.params.id);
    res.json({ customer: updated });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    res.status(500).json({ error: message });
  }
});

export default router;
