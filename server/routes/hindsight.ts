import { Router } from 'express';
import { hindsightService } from '../hindsight/hindsightService.ts';
import { seedInitialData, db } from '../db/database.ts';

const router = Router();

// GET Hindsight health and connection status
router.get('/status', async (req, res) => {
  try {
    const force = req.query.refresh === 'true';
    const status = await hindsightService.getStatus(force);

    const memoryCount = (db.prepare('SELECT COUNT(*) as count FROM customer_memories').get() as { count: number }).count;
    const syncedCount = (db.prepare("SELECT COUNT(*) as count FROM customer_memories WHERE hindsight_sync_status = 'synced'").get() as { count: number }).count;

    res.json({
      ...status,
      stats: {
        totalMemoriesStored: memoryCount,
        syncedToHindsight: syncedCount,
      },
      setupGuide: {
        dockerCommand: 'docker run --rm -it -p 8888:8888 -p 9999:9999 -e HINDSIGHT_API_LLM_API_KEY=$GEMINI_API_KEY -v $HOME/.hindsight-docker:/home/hindsight/.pg0 ghcr.io/vectorize-io/hindsight:latest',
        cloudUrl: 'https://api.hindsight.vectorize.io',
        envVars: {
          HINDSIGHT_API_URL: 'URL of the Hindsight server (e.g. http://localhost:8888 or Cloud URL)',
          HINDSIGHT_API_KEY: 'API key if using authenticated instance or Hindsight Cloud',
          GEMINI_API_KEY: 'Required for Gemini response generation and Hindsight fact extraction',
        },
      },
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    res.status(500).json({ error: message });
  }
});

// POST reset and re-seed sample scenarios
router.post('/seed-sample-data', (_req, res) => {
  try {
    // Clear existing data
    db.exec(`
      DELETE FROM memory_audit_logs;
      DELETE FROM messages;
      DELETE FROM conversations;
      DELETE FROM tickets;
      DELETE FROM customer_memories;
      DELETE FROM customers;
    `);

    // Re-seed all 5 comprehensive scenarios
    seedInitialData();

    res.json({
      success: true,
      message: 'Successfully re-seeded 5 realistic sample customer scenarios with persistent memories, tickets, and conversations.',
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    res.status(500).json({ error: message });
  }
});

export default router;
