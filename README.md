# SupportMind – Customer Support Intelligence Agent

SupportMind is an intelligent customer support agent that uses persistent AI memory powered by **Hindsight by Vectorize** and **Google Gemini** (`gemini-3.8-flash`) to remember customer conversations, complaints, preferences, hardware setups, and confirmed solutions across sessions.

---

## 🌟 Key Features

1. **Persistent Customer Memory (Hindsight by Vectorize)**:
   - Dedicated memory bank isolation per customer (`supportmind-cust-{id}`) ensuring zero cross-contamination.
   - Dual interface primitives: `retain` (fact & preference ingestion) and `recall` (multi-strategy vector + keyword + temporal matching).
   - Dynamic prompt synthesis using `recallResponseToPromptString` from `@vectorize-io/hindsight-client`.

2. **Before-and-After Memory Comparison**:
   - Side-by-side interactive benchmarking comparing a traditional stateless chatbot against SupportMind with Hindsight persistent memory.
   - Live metrics: Time saved per ticket (avg ~4.8 min), sentiment lift (+57%), and eliminated customer frustration points.

3. **AI Customer Support Chat**:
   - Interactive chat interface with real-time customer context switching.
   - "Retrieved Hindsight Memories" drawer attached to every response, displaying exact similarity scores, types, and recall latency.
   - Quick scenario prompt buttons for immediate testing.

4. **Smart Support Ticket Management**:
   - Issue creation, categorization, and priority tracking.
   - Convert chat conversations to tickets with one click.
   - **Auto-Retain on Resolution**: Resolving a ticket automatically retains the solution into the customer's Hindsight bank.

5. **Memory Insights & Retain/Recall Lab**:
   - Interactive multi-strategy recall query tester.
   - Real-time audit logs measuring retain/recall latencies in milliseconds.
   - Manual memory ingestion and deletion.

6. **Realistic Sample Customer Scenarios**:
   - **Alex Rivera** (Acme Studios): Repeated 5GHz Wi-Fi dropouts on TP-Link Archer AX50 router.
   - **Elena Rostova** (Apex Retail): Credit card velocity failure on corporate Mastercard; Dutch VAT routing.
   - **Marcus Chen** (Velocity Logistics): Delayed FedEx shipment #VL-88291 (10G optical transceiver).
   - **Sarah Jenkins** (HealthTech Labs): Linux Ubuntu 24.04 MTU 1420 packet drop on TLS 1.3; strict cURL preference.
   - **David Okafor** (Solaria Solar): Resolved Phase 1 CT clamp inversion & firmware 4.9.1 update.

---

## 🏗️ Architecture & Technology Stack

- **Frontend**: React 19, TypeScript, Tailwind CSS, Lucide icons
- **Backend**: Node.js (v22), Express, TypeScript via `tsx`
- **AI Model**: Google Gemini (`gemini-3.8-flash`) via official `@google/genai` TypeScript SDK
- **Persistent Agent Memory**: Hindsight by Vectorize via `@vectorize-io/hindsight-client`
- **Database**: SQLite (built-in `node:sqlite`) for fast relational storage of customers, tickets, and messages

---

## 🚀 Quick Start & Execution Instructions

### 1. Install Dependencies
```bash
npm install
```

### 2. Configure Environment Variables
Copy `.env.example` to `.env`:
```bash
cp .env.example .env
```
Set your environment variables:
- `GEMINI_API_KEY`: Your Gemini API key.
- `HINDSIGHT_API_URL`: Hindsight server endpoint (default: `http://localhost:8888`).
- `HINDSIGHT_API_KEY`: API key for authenticated or Vectorize Cloud instances (optional for local unauthenticated Docker).

### 3. Run Hindsight Memory Server (Docker)
To run a local Hindsight container:
```bash
docker run --rm -it -p 8888:8888 -p 9999:9999 \
  -e HINDSIGHT_API_LLM_API_KEY=$GEMINI_API_KEY \
  -v $HOME/.hindsight-docker:/home/hindsight/.pg0 \
  ghcr.io/vectorize-io/hindsight:latest
```

*Note: If Hindsight Docker is not currently running, SupportMind automatically operates with its built-in persistence engine without crashing, and switches to live Hindsight as soon as the server is reachable.*

### 4. Run Development Server
```bash
npm run dev
```
The application will launch on `http://localhost:3000`.

---

## 🔒 Customer Bank Isolation
Customer memory is strictly segmented by bank identifier:
```typescript
const bankId = `supportmind-cust-${customerId}`;
await client.retain(bankId, "Customer uses TP-Link Archer AX50 router.");
const results = await client.recall(bankId, "What router model does the user have?");
```
No memory is ever shared across different customer banks.
