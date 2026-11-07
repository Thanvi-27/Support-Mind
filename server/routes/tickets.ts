import { Router } from 'express';
import { db } from '../db/database.ts';
import { hindsightService } from '../hindsight/hindsightService.ts';

const router = Router();

// GET all tickets with filtering
router.get('/', (req, res) => {
  try {
    const { status, category, priority, customerId, search } = req.query;
    let query = `
      SELECT t.*, c.name as customer_name, c.email as customer_email, c.company as customer_company, c.avatar as customer_avatar
      FROM tickets t
      JOIN customers c ON t.customer_id = c.id
      WHERE 1=1
    `;
    const params: (string | number | null)[] = [];

    if (status && status !== 'all') {
      query += ' AND t.status = ?';
      params.push(status as string);
    }
    if (category && category !== 'all') {
      query += ' AND t.category = ?';
      params.push(category as string);
    }
    if (priority && priority !== 'all') {
      query += ' AND t.priority = ?';
      params.push(priority as string);
    }
    if (customerId) {
      query += ' AND t.customer_id = ?';
      params.push(customerId as string);
    }
    if (search) {
      query += ' AND (t.title LIKE ? OR t.description LIKE ? OR t.ticket_number LIKE ?)';
      const term = `%${search}%`;
      params.push(term, term, term);
    }

    query += ' ORDER BY CASE t.priority WHEN "Critical" THEN 1 WHEN "High" THEN 2 WHEN "Medium" THEN 3 ELSE 4 END, t.created_at DESC';

    const tickets = db.prepare(query).all(...params);
    res.json({ tickets });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    res.status(500).json({ error: message });
  }
});

// GET single ticket
router.get('/:id', (req, res) => {
  try {
    const ticket = db.prepare(`
      SELECT t.*, c.name as customer_name, c.email as customer_email, c.company as customer_company,
             c.plan as customer_plan, c.device_info as customer_device, c.avatar as customer_avatar
      FROM tickets t
      JOIN customers c ON t.customer_id = c.id
      WHERE t.id = ?
    `).get(req.params.id) as Record<string, unknown> | undefined;

    if (!ticket) {
      return res.status(404).json({ error: 'Ticket not found' });
    }

    res.json({ ticket });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    res.status(500).json({ error: message });
  }
});

// POST create ticket
router.post('/', (req, res) => {
  try {
    const { customer_id, conversation_id, title, description, category, priority } = req.body;
    if (!customer_id || !title || !description) {
      return res.status(400).json({ error: 'customer_id, title, and description are required' });
    }

    const id = `tick_${Date.now()}`;
    const countRow = db.prepare('SELECT COUNT(*) as count FROM tickets').get() as { count: number };
    const ticketNumber = `TICK-${1000 + countRow.count + 1}`;

    db.prepare(`
      INSERT INTO tickets (id, ticket_number, customer_id, conversation_id, title, description, category, priority, status, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'Open', datetime('now'), datetime('now'))
    `).run(
      id,
      ticketNumber,
      customer_id,
      conversation_id || null,
      title,
      description,
      category || 'General',
      priority || 'Medium'
    );

    // Retain complaint into Hindsight
    hindsightService.retainMemory({
      customerId: customer_id,
      content: `Ticket ${ticketNumber} opened: ${title}. Details: ${description}`,
      memoryType: 'complaint',
      context: `Ticket #${ticketNumber}`,
      source: 'ticket',
      sourceId: id,
    }).catch(err => console.warn('[Hindsight] Error retaining ticket complaint:', err));

    const created = db.prepare('SELECT * FROM tickets WHERE id = ?').get(id);
    res.status(201).json({ ticket: created });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    res.status(500).json({ error: message });
  }
});

// PUT update ticket status or resolution
router.put('/:id', async (req, res) => {
  try {
    const { status, priority, resolution_notes } = req.body;
    const ticketId = req.params.id;

    const currentTicket = db.prepare('SELECT * FROM tickets WHERE id = ?').get(ticketId) as Record<string, unknown> | undefined;
    if (!currentTicket) {
      return res.status(404).json({ error: 'Ticket not found' });
    }

    const isResolving = status === 'Resolved' && currentTicket.status !== 'Resolved';
    const resolvedAt = isResolving ? new Date().toISOString() : currentTicket.resolved_at;

    db.prepare(`
      UPDATE tickets
      SET status = COALESCE(?, status),
          priority = COALESCE(?, priority),
          resolution_notes = COALESCE(?, resolution_notes),
          resolved_at = ?,
          updated_at = datetime('now')
      WHERE id = ?
    `).run(
      (status as string) ?? null,
      (priority as string) ?? null,
      (resolution_notes as string) ?? null,
      (resolvedAt as string) ?? null,
      ticketId
    );

    // When ticket is resolved, auto-retain successful resolution into customer's Hindsight memory!
    if (isResolving && resolution_notes) {
      await hindsightService.retainMemory({
        customerId: currentTicket.customer_id as string,
        content: `Resolved issue "${currentTicket.title}": ${resolution_notes}`,
        memoryType: 'resolution',
        context: `Resolved Ticket ${currentTicket.ticket_number}`,
        source: 'ticket_resolution',
        sourceId: ticketId,
      });
    }

    const updated = db.prepare('SELECT * FROM tickets WHERE id = ?').get(ticketId);
    res.json({ ticket: updated });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    res.status(500).json({ error: message });
  }
});

export default router;
