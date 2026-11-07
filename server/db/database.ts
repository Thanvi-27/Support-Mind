import { DatabaseSync } from 'node:sqlite';
import path from 'node:path';
import fs from 'node:fs';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Ensure storage directory exists
const dbDir = path.resolve(__dirname, '../../data');
if (!fs.existsSync(dbDir)) {
  fs.mkdirSync(dbDir, { recursive: true });
}

const dbPath = path.join(dbDir, 'supportmind.db');
export const db = new DatabaseSync(dbPath);

// Initialize Tables
export function initDatabase() {
  db.exec(`
    CREATE TABLE IF NOT EXISTS customers (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      email TEXT NOT NULL UNIQUE,
      company TEXT,
      plan TEXT DEFAULT 'Standard',
      device_info TEXT,
      preferences TEXT,
      avatar TEXT,
      created_at TEXT DEFAULT (datetime('now')),
      updated_at TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS conversations (
      id TEXT PRIMARY KEY,
      customer_id TEXT NOT NULL,
      title TEXT NOT NULL,
      channel TEXT DEFAULT 'Web Chat',
      status TEXT DEFAULT 'active',
      created_at TEXT DEFAULT (datetime('now')),
      updated_at TEXT DEFAULT (datetime('now')),
      FOREIGN KEY(customer_id) REFERENCES customers(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS messages (
      id TEXT PRIMARY KEY,
      conversation_id TEXT NOT NULL,
      customer_id TEXT NOT NULL,
      sender TEXT NOT NULL, -- 'customer' | 'agent'
      content TEXT NOT NULL,
      retrieved_memories_json TEXT,
      metadata_json TEXT,
      created_at TEXT DEFAULT (datetime('now')),
      FOREIGN KEY(conversation_id) REFERENCES conversations(id) ON DELETE CASCADE,
      FOREIGN KEY(customer_id) REFERENCES customers(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS tickets (
      id TEXT PRIMARY KEY,
      ticket_number TEXT UNIQUE NOT NULL,
      customer_id TEXT NOT NULL,
      conversation_id TEXT,
      title TEXT NOT NULL,
      description TEXT NOT NULL,
      category TEXT NOT NULL, -- 'Hardware / Network' | 'Billing' | 'Delivery' | 'Software' | 'General'
      priority TEXT NOT NULL, -- 'Low' | 'Medium' | 'High' | 'Critical'
      status TEXT NOT NULL, -- 'Open' | 'In Progress' | 'Resolved' | 'Closed'
      resolution_notes TEXT,
      resolved_at TEXT,
      created_at TEXT DEFAULT (datetime('now')),
      updated_at TEXT DEFAULT (datetime('now')),
      FOREIGN KEY(customer_id) REFERENCES customers(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS customer_memories (
      id TEXT PRIMARY KEY,
      customer_id TEXT NOT NULL,
      memory_type TEXT NOT NULL, -- 'fact' | 'preference' | 'complaint' | 'resolution' | 'hardware'
      content TEXT NOT NULL,
      confidence REAL DEFAULT 0.95,
      source TEXT DEFAULT 'chat',
      source_id TEXT,
      hindsight_sync_status TEXT DEFAULT 'synced', -- 'synced' | 'pending' | 'local_only'
      created_at TEXT DEFAULT (datetime('now')),
      updated_at TEXT DEFAULT (datetime('now')),
      FOREIGN KEY(customer_id) REFERENCES customers(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS memory_audit_logs (
      id TEXT PRIMARY KEY,
      customer_id TEXT NOT NULL,
      action TEXT NOT NULL, -- 'retain' | 'recall' | 'reflect'
      query_or_content TEXT NOT NULL,
      results_json TEXT,
      duration_ms INTEGER,
      source TEXT NOT NULL, -- 'hindsight_live' | 'local_engine'
      created_at TEXT DEFAULT (datetime('now'))
    );
  `);

  // Seed initial realistic sample data if empty
  const customerCountRow = db.prepare('SELECT COUNT(*) as count FROM customers').get() as { count: number };
  if (customerCountRow.count === 0) {
    seedInitialData();
  }
}

export function seedInitialData() {
  const insertCustomer = db.prepare(`
    INSERT INTO customers (id, name, email, company, plan, device_info, preferences, avatar, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  const insertMemory = db.prepare(`
    INSERT INTO customer_memories (id, customer_id, memory_type, content, confidence, source, hindsight_sync_status, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `);

  const insertTicket = db.prepare(`
    INSERT INTO tickets (id, ticket_number, customer_id, conversation_id, title, description, category, priority, status, resolution_notes, resolved_at, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  const insertConversation = db.prepare(`
    INSERT INTO conversations (id, customer_id, title, channel, status, created_at)
    VALUES (?, ?, ?, ?, ?, ?)
  `);

  const insertMessage = db.prepare(`
    INSERT INTO messages (id, conversation_id, customer_id, sender, content, retrieved_memories_json, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `);

  // 1. Alex Rivera - Repeated Internet Disconnections (TP-Link Router)
  insertCustomer.run(
    'cust_alex_01',
    'Alex Rivera',
    'alex.rivera@acmestudios.io',
    'Acme Studios',
    'Enterprise',
    'TP-Link Archer AX50 Wi-Fi 6 Router (Firmware 1.0.8), macOS Sonoma, MacBook Pro M3',
    'Prefers direct troubleshooting bullet points. Does not want phone calls; prefers asynchronous chat.',
    'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
    '2026-10-15 09:30:00'
  );

  insertMemory.run(
    'mem_alex_01',
    'cust_alex_01',
    'hardware',
    'Customer Alex Rivera uses a TP-Link Archer AX50 Wi-Fi 6 Router on firmware 1.0.8.',
    0.98,
    'onboarding',
    'synced',
    '2026-10-15 09:35:00'
  );
  insertMemory.run(
    'mem_alex_02',
    'cust_alex_01',
    'complaint',
    'Reported repeated 5GHz Wi-Fi drops during scheduled Tuesday 10 AM Zoom client pitch meetings.',
    0.95,
    'chat',
    'synced',
    '2026-10-18 10:15:00'
  );
  insertMemory.run(
    'mem_alex_03',
    'cust_alex_01',
    'preference',
    'Customer prefers technical bullet points and direct commands over conversational filler.',
    0.92,
    'chat',
    'synced',
    '2026-10-18 10:20:00'
  );
  insertMemory.run(
    'mem_alex_04',
    'cust_alex_01',
    'resolution',
    'Temporary fix applied on Oct 18: Changed channel bandwidth to 80MHz and flushed macOS DNS cache.',
    0.90,
    'ticket',
    'synced',
    '2026-10-18 10:45:00'
  );

  insertTicket.run(
    'tick_01',
    'TICK-1024',
    'cust_alex_01',
    'conv_alex_01',
    'Intermittent 5GHz Wi-Fi dropouts on TP-Link Archer AX50',
    'Alex reported drops during high-bandwidth video streams. Temporarily mitigated by locking 5GHz channel.',
    'Hardware / Network',
    'High',
    'In Progress',
    'Applied DNS flush and channel lock to 44. Awaiting customer confirmation after next Tuesday peak.',
    null,
    '2026-10-18 10:10:00'
  );

  insertConversation.run(
    'conv_alex_01',
    'cust_alex_01',
    'Wi-Fi Disconnection & TP-Link Router Troubleshooting',
    'Web Chat',
    'active',
    '2026-10-18 10:00:00'
  );
  insertMessage.run(
    'msg_alex_01',
    'conv_alex_01',
    'cust_alex_01',
    'customer',
    'My internet connection keeps disconnecting every Tuesday morning. I am using a TP-Link Archer AX50 router.',
    '[]',
    '2026-10-18 10:01:00'
  );
  insertMessage.run(
    'msg_alex_02',
    'conv_alex_01',
    'cust_alex_01',
    'agent',
    'Hello Alex, thank you for reaching out. Let\'s fix the 5GHz drops on your TP-Link Archer AX50. Please lock the 5GHz channel to 44 (80MHz channel width) and test if the drops stop.',
    JSON.stringify([
      { text: 'Customer Alex Rivera uses a TP-Link Archer AX50 Wi-Fi 6 Router', type: 'hardware' }
    ]),
    '2026-10-18 10:03:00'
  );

  // 2. Elena Rostova - Billing & Payment Failures
  insertCustomer.run(
    'cust_elena_02',
    'Elena Rostova',
    'elena@apexretail.eu',
    'Apex Retail Europe',
    'Pro Annual',
    'Windows 11, Edge 128, Corporate Gateway',
    'Requires invoices in EUR with VAT ID NL849201948B01. Billing contact is finance@apexretail.eu.',
    'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150&auto=format&fit=crop&q=80',
    '2026-09-01 11:00:00'
  );
  insertMemory.run(
    'mem_elena_01',
    'cust_elena_02',
    'complaint',
    'Automatic credit card renewal failed on Nov 1 with Stripe error card_velocity_exceeded on Barclays Corporate Mastercard.',
    0.99,
    'billing_system',
    'synced',
    '2026-11-01 08:30:00'
  );
  insertMemory.run(
    'mem_elena_02',
    'cust_elena_02',
    'preference',
    'Elena requested all renewal invoices be forwarded directly to finance@apexretail.eu with VAT NL849201948B01.',
    0.97,
    'chat',
    'synced',
    '2026-11-01 09:00:00'
  );
  insertTicket.run(
    'tick_02',
    'TICK-1031',
    'cust_elena_02',
    null,
    'Subscription Renewal Payment Failure ($1,200 Pro Plan)',
    'Barclays card velocity block prevented automated charge. Sent direct SEPA wire transfer link.',
    'Billing',
    'High',
    'Open',
    null,
    null,
    '2026-11-01 09:15:00'
  );

  // 3. Marcus Chen - Delayed Hardware Deliveries
  insertCustomer.run(
    'cust_marcus_03',
    'Marcus Chen',
    'm.chen@velocitylogistics.com',
    'Velocity Logistics',
    'Business',
    'Dell Precision 5680, Ubuntu 22.04',
    'Always needs FedEx / courier tracking numbers immediately. Urgency level high due to SLA commitments.',
    'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
    '2026-08-20 14:00:00'
  );
  insertMemory.run(
    'mem_marcus_01',
    'cust_marcus_03',
    'complaint',
    'Critical hardware replacement shipment #VL-88291 (Fiber Optical Transceiver 10G) delayed at FedEx Memphis hub due to storm.',
    0.98,
    'chat',
    'synced',
    '2026-11-03 16:45:00'
  );
  insertMemory.run(
    'mem_marcus_02',
    'cust_marcus_03',
    'preference',
    'Customer requested proactive courier alerts and escalation if delivery slips beyond Thursday 5 PM.',
    0.94,
    'chat',
    'synced',
    '2026-11-03 17:00:00'
  );
  insertTicket.run(
    'tick_03',
    'TICK-1040',
    'cust_marcus_03',
    null,
    'Tracking Escalation: Hardware Shipment #VL-88291 Delayed',
    'Memphis hub delay on 10G transceivers. Courier rep assigned for manual status check.',
    'Delivery',
    'Critical',
    'In Progress',
    'FedEx flight grounded Nov 3. Rescheduled arrival estimate Friday 11 AM.',
    null,
    '2026-11-03 17:15:00'
  );

  // 4. Sarah Jenkins - Product Troubleshooting & Linux Environment
  insertCustomer.run(
    'cust_sarah_04',
    'Sarah Jenkins',
    's.jenkins@healthtechlabs.org',
    'HealthTech Labs',
    'Enterprise',
    'Ubuntu 24.04 LTS, Docker v27.1, Node.js 22.x, AWS us-east-1 VPC',
    'Strict requirement: CLI / cURL commands only; no web UI instructions. Enforces strict HIPAA compliance.',
    'https://images.unsplash.com/photo-1580489944761-15a19d654956?w=150&auto=format&fit=crop&q=80',
    '2026-07-12 10:00:00'
  );
  insertMemory.run(
    'mem_sarah_01',
    'cust_sarah_04',
    'hardware',
    'Production stack runs Ubuntu 24.04 LTS, Docker 27.1 in AWS us-east-1 with MTU set to 1420.',
    0.97,
    'chat',
    'synced',
    '2026-10-22 14:10:00'
  );
  insertMemory.run(
    'mem_sarah_02',
    'cust_sarah_04',
    'complaint',
    'Reported webhook timeouts when dispatching HL7 healthcare telemetry over TLS 1.3.',
    0.95,
    'chat',
    'synced',
    '2026-10-22 14:30:00'
  );
  insertMemory.run(
    'mem_sarah_03',
    'cust_sarah_04',
    'preference',
    'Never provide web dashboard steps. Sarah always requires copy-pasteable bash/cURL snippets with verbose flags.',
    0.99,
    'chat',
    'synced',
    '2026-10-22 14:40:00'
  );
  insertTicket.run(
    'tick_04',
    'TICK-1045',
    'cust_sarah_04',
    null,
    'Webhook timeout on HL7 payload dispatch (TLS 1.3 packet drop)',
    'MTU mismatch in AWS VPC causing fragmented TLS packets to drop silently.',
    'Software',
    'High',
    'Open',
    null,
    null,
    '2026-10-22 15:00:00'
  );

  // 5. David Okafor - Previously Resolved Inverter Complaint
  insertCustomer.run(
    'cust_david_05',
    'David Okafor',
    'david.okafor@solariasolar.co',
    'Solaria Solar',
    'Standard',
    'Solar Inverter Model S-400 (Firmware 4.9.1), Android 15 App',
    'Prefers WhatsApp or short email summaries. Likes quick verification steps.',
    'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80',
    '2026-06-10 08:00:00'
  );
  insertMemory.run(
    'mem_david_01',
    'cust_david_05',
    'hardware',
    'David operates Solar Inverter Model S-400 running firmware 4.9.1 on a 3-phase residential grid.',
    0.99,
    'ticket',
    'synced',
    '2026-10-26 11:00:00'
  );
  insertMemory.run(
    'mem_david_02',
    'cust_david_05',
    'complaint',
    'Customer experienced negative wattage readings (-4.2 kW) during midday sun peak.',
    0.96,
    'ticket',
    'synced',
    '2026-10-26 11:20:00'
  );
  insertMemory.run(
    'mem_david_03',
    'cust_david_05',
    'resolution',
    'SUCCESSFULLY RESOLVED on Oct 28: CT clamp on Phase 1 was reversed. Re-orienting arrow towards grid and updating to firmware 4.9.1 completely resolved negative readings. Customer rated 5/5 stars.',
    0.99,
    'ticket',
    'synced',
    '2026-10-28 16:30:00'
  );
  insertTicket.run(
    'tick_05',
    'TICK-1012',
    'cust_david_05',
    null,
    'Negative wattage reading on Solar Inverter Model S-400',
    'Grid consumption showing negative generation during peak irradiance.',
    'Hardware / Network',
    'Medium',
    'Resolved',
    'Customer re-oriented CT clamp on Phase 1 towards the utility meter and installed firmware 4.9.1. Telemetry verified normal.',
    '2026-10-28 16:30:00',
    '2026-10-26 11:15:00'
  );
}
