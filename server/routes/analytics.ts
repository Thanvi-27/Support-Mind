import { Router } from 'express';
import { db } from '../db/database.ts';

const router = Router();

router.get('/', (_req, res) => {
  try {
    const totalCustomers = (db.prepare('SELECT COUNT(*) as count FROM customers').get() as { count: number }).count;
    const totalConversations = (db.prepare('SELECT COUNT(*) as count FROM conversations').get() as { count: number }).count;
    const totalMessages = (db.prepare('SELECT COUNT(*) as count FROM messages').get() as { count: number }).count;
    const totalMemories = (db.prepare('SELECT COUNT(*) as count FROM customer_memories').get() as { count: number }).count;

    const ticketsByStatus = db.prepare(`
      SELECT status, COUNT(*) as count 
      FROM tickets 
      GROUP BY status
    `).all() as Array<{ status: string; count: number }>;

    let openTickets = 0;
    let inProgressTickets = 0;
    let resolvedTickets = 0;

    for (const t of ticketsByStatus) {
      if (t.status === 'Open') openTickets += t.count;
      if (t.status === 'In Progress') inProgressTickets += t.count;
      if (t.status === 'Resolved' || t.status === 'Closed') resolvedTickets += t.count;
    }

    const ticketsByCategory = db.prepare(`
      SELECT category, COUNT(*) as count 
      FROM tickets 
      GROUP BY category 
      ORDER BY count DESC
    `).all();

    const ticketsByPriority = db.prepare(`
      SELECT priority, COUNT(*) as count 
      FROM tickets 
      GROUP BY priority
    `).all();

    const memoriesByType = db.prepare(`
      SELECT memory_type, COUNT(*) as count 
      FROM customer_memories 
      GROUP BY memory_type
    `).all();

    const frequentComplaints = db.prepare(`
      SELECT content, confidence, created_at, customer_id
      FROM customer_memories
      WHERE memory_type = 'complaint'
      ORDER BY created_at DESC
      LIMIT 5
    `).all();

    const recentAuditLogs = db.prepare(`
      SELECT action, duration_ms, source, created_at
      FROM memory_audit_logs
      ORDER BY created_at DESC
      LIMIT 10
    `).all();

    res.json({
      metrics: {
        totalCustomers,
        totalConversations,
        totalMessages,
        totalMemories,
        openTickets,
        inProgressTickets,
        resolvedTickets,
        totalTickets: openTickets + inProgressTickets + resolvedTickets,
        resolutionRatePercent: totalCustomers > 0 ? Math.round((resolvedTickets / Math.max(1, openTickets + inProgressTickets + resolvedTickets)) * 100) : 0,
        estimatedTimeSavedMinutes: totalMemories * 4.2,
      },
      breakdowns: {
        ticketsByCategory,
        ticketsByPriority,
        memoriesByType,
        frequentComplaints,
        recentAuditLogs,
      },
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    res.status(500).json({ error: message });
  }
});

export default router;
