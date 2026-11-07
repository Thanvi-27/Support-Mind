import { Router } from 'express';
import { db } from '../db/database.ts';
import { hindsightService } from '../hindsight/hindsightService.ts';
import { geminiService } from '../gemini/geminiService.ts';

const router = Router();

// POST run memory comparison
router.post('/', async (req, res) => {
  try {
    const { customerId, query } = req.body;
    if (!customerId || !query) {
      return res.status(400).json({ error: 'customerId and query are required' });
    }

    const customer = db.prepare('SELECT * FROM customers WHERE id = ?').get(customerId) as Record<string, unknown> | undefined;
    if (!customer) {
      return res.status(404).json({ error: 'Customer not found' });
    }

    // Recall real memories from Hindsight
    const recallResult = await hindsightService.recallMemories({
      customerId,
      query,
      limit: 4,
    });

    const customerObj = {
      id: customer.id as string,
      name: customer.name as string,
      company: customer.company as string,
      plan: customer.plan as string,
      device_info: customer.device_info as string,
      preferences: customer.preferences as string,
    };

    // Run comparison via Gemini
    const comparison = await geminiService.generateComparison({
      customer: customerObj,
      query,
      recalledMemories: recallResult.memories,
    });

    res.json({
      customer: customerObj,
      query,
      recalledMemories: recallResult.memories,
      memorySource: recallResult.source,
      comparison,
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    res.status(500).json({ error: message });
  }
});

export default router;
