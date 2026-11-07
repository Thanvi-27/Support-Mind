import React, { useState, useEffect } from 'react';
import {
  BrainCircuit,
  Search,
  Plus,
  Trash2,
  Sparkles,
  Activity,
  Terminal,
  Clock,
  Filter,
  CheckCircle2,
  AlertCircle,
  ExternalLink,
  Zap,
} from 'lucide-react';
import { api } from '../services/api';
import type { Customer, MemoryItem } from '../types';

interface MemoryInsightsProps {
  customers: Customer[];
  selectedCustomerId: string;
  onSelectCustomer: (id: string) => void;
  onOpenHindsightModal: () => void;
}

export const MemoryInsights: React.FC<MemoryInsightsProps> = ({
  customers,
  selectedCustomerId,
  onSelectCustomer,
  onOpenHindsightModal,
}) => {
  const [activeSubTab, setActiveSubTab] = useState<'memories' | 'recall_tester' | 'audit_logs'>('memories');
  const [memories, setMemories] = useState<MemoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [typeFilter, setTypeFilter] = useState('all');

  // Interactive recall tester state
  const [testQuery, setTestQuery] = useState('router Wi-Fi dropping');
  const [testResults, setTestResults] = useState<{
    query: string;
    bankId: string;
    resultsCount: number;
    memories: MemoryItem[];
    promptString: string;
    source: string;
    durationMs: number;
  } | null>(null);
  const [testingRecall, setTestingRecall] = useState(false);

  // Manual retain state
  const [showRetainModal, setShowRetainModal] = useState(false);
  const [newMemory, setNewMemory] = useState({
    customerId: selectedCustomerId,
    content: '',
    memoryType: 'fact',
  });
  const [isRetaining, setIsRetaining] = useState(false);

  // Audit logs state
  const [auditLogs, setAuditLogs] = useState<
    Array<{
      id: string;
      customer_id: string;
      customer_name: string;
      action: string;
      query_or_content: string;
      results: unknown;
      duration_ms: number;
      source: string;
      created_at: string;
    }>
  >([]);

  useEffect(() => {
    loadMemories();
    if (activeSubTab === 'audit_logs') {
      loadAuditLogs();
    }
  }, [selectedCustomerId, typeFilter, activeSubTab]);

  const loadMemories = async () => {
    try {
      setLoading(true);
      const res = await api.getMemories(selectedCustomerId, typeFilter);
      setMemories(res.memories);
    } catch (err) {
      console.error('Failed to load memories:', err);
    } finally {
      setLoading(false);
    }
  };

  const loadAuditLogs = async () => {
    try {
      const res = await api.getAuditLogs(selectedCustomerId);
      setAuditLogs(res.logs);
    } catch (err) {
      console.error('Failed to load audit logs:', err);
    }
  };

  const handleTestRecall = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!testQuery.trim() || !selectedCustomerId) return;

    setTestingRecall(true);
    try {
      const res = await api.testRecall(selectedCustomerId, testQuery);
      setTestResults(res);
    } catch (err) {
      console.error('Recall test error:', err);
    } finally {
      setTestingRecall(false);
    }
  };

  const handleRetainMemory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMemory.content.trim()) return;

    setIsRetaining(true);
    try {
      await api.retainMemory({
        customerId: newMemory.customerId,
        content: newMemory.content,
        memoryType: newMemory.memoryType,
      });
      setShowRetainModal(false);
      setNewMemory({
        customerId: selectedCustomerId,
        content: '',
        memoryType: 'fact',
      });
      loadMemories();
    } catch (err) {
      console.error('Failed to retain memory:', err);
    } finally {
      setIsRetaining(false);
    }
  };

  const handleDeleteMemory = async (id: string) => {
    if (!confirm('Are you sure you want to delete this memory?')) return;
    try {
      await api.deleteMemory(id);
      loadMemories();
    } catch (err) {
      console.error('Failed to delete memory:', err);
    }
  };

  const currentCustomer = customers.find(c => c.id === selectedCustomerId);

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
            Hindsight Memory Insights & Recall Lab
          </h1>
          <p className="text-xs text-slate-500">
            Inspect persistent memories, test multi-strategy recall queries, and audit low-latency operations
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => {
              setNewMemory({ ...newMemory, customerId: selectedCustomerId });
              setShowRetainModal(true);
            }}
            className="px-3.5 py-2 rounded-xl bg-purple-600 hover:bg-purple-700 text-white text-xs font-semibold flex items-center gap-1.5 shadow-sm transition-all"
          >
            <Plus className="w-4 h-4" />
            <span>Retain Memory</span>
          </button>
          <button
            onClick={onOpenHindsightModal}
            className="px-3.5 py-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold flex items-center gap-1.5 shadow-2xs transition-all"
          >
            <Terminal className="w-4 h-4 text-slate-500" />
            <span>Hindsight Diagnostics</span>
          </button>
        </div>
      </div>

      {/* Tabs Bar */}
      <div className="flex items-center gap-2 border-b border-slate-200 pb-1 text-xs font-semibold">
        <button
          onClick={() => setActiveSubTab('memories')}
          className={`px-4 py-2 rounded-lg transition-colors flex items-center gap-2 ${
            activeSubTab === 'memories'
              ? 'bg-purple-50 text-purple-700 font-bold border border-purple-200 shadow-2xs'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <BrainCircuit className="w-4 h-4" />
          <span>Retained Memory Explorer ({memories.length})</span>
        </button>

        <button
          onClick={() => {
            setActiveSubTab('recall_tester');
            if (!testResults) handleTestRecall();
          }}
          className={`px-4 py-2 rounded-lg transition-colors flex items-center gap-2 ${
            activeSubTab === 'recall_tester'
              ? 'bg-blue-50 text-blue-700 font-bold border border-blue-200 shadow-2xs'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <Zap className="w-4 h-4 text-blue-600" />
          <span>Multi-Strategy Recall Tester</span>
        </button>

        <button
          onClick={() => setActiveSubTab('audit_logs')}
          className={`px-4 py-2 rounded-lg transition-colors flex items-center gap-2 ${
            activeSubTab === 'audit_logs'
              ? 'bg-slate-100 text-slate-900 font-bold border border-slate-200 shadow-2xs'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <Activity className="w-4 h-4 text-emerald-600" />
          <span>Memory Audit Logs</span>
        </button>
      </div>

      {/* SUB-TAB 1: RETAINED MEMORY EXPLORER */}
      {activeSubTab === 'memories' && (
        <div className="space-y-4">
          {/* Filter Bar */}
          <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-2xs flex flex-wrap items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-2">
              <span className="text-slate-500 font-medium">Customer Bank:</span>
              <select
                value={selectedCustomerId}
                onChange={(e) => onSelectCustomer(e.target.value)}
                className="font-bold text-slate-900 bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1"
              >
                {customers.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name} (supportmind-cust-{c.id.replace('cust_', '')})
                  </option>
                ))}
              </select>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-slate-500 font-medium">Memory Type:</span>
              <select
                value={typeFilter}
                onChange={(e) => setTypeFilter(e.target.value)}
                className="bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1 text-slate-700 font-medium"
              >
                <option value="all">All Types</option>
                <option value="fact">Fact</option>
                <option value="hardware">Hardware / Environment</option>
                <option value="complaint">Complaint</option>
                <option value="preference">Preference</option>
                <option value="resolution">Confirmed Resolution</option>
              </select>
            </div>
          </div>

          {/* Memories Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {loading ? (
              <div className="col-span-2 p-12 text-center text-xs text-slate-400">Loading memories...</div>
            ) : memories.length === 0 ? (
              <div className="col-span-2 p-12 text-center text-xs text-slate-400">
                No memories found for this filter.
              </div>
            ) : (
              memories.map((m) => (
                <div
                  key={m.id}
                  className="p-4 rounded-2xl bg-white border border-slate-200 shadow-2xs hover:border-purple-300 transition-all flex flex-col justify-between"
                >
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-[11px]">
                      <span className="font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-purple-50 text-purple-700 border border-purple-200">
                        {m.memory_type || m.type}
                      </span>
                      <div className="flex items-center gap-2 text-slate-400 font-mono text-[10px]">
                        <span>Confidence: {Math.round((m.confidence ?? 0.95) * 100)}%</span>
                        <span>•</span>
                        <span>{new Date(m.created_at || '').toLocaleDateString()}</span>
                      </div>
                    </div>

                    <p className="text-xs text-slate-800 font-medium leading-relaxed">
                      {m.content || m.text}
                    </p>
                  </div>

                  <div className="mt-3 pt-3 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-400">
                    <span className="font-mono text-[10px] truncate max-w-xs">
                      Bank: supportmind-cust-{m.customer_id?.replace('cust_', '')}
                    </span>
                    <button
                      onClick={() => m.id && handleDeleteMemory(m.id)}
                      className="text-slate-400 hover:text-red-600 p-1 rounded transition-colors"
                      title="Delete memory"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* SUB-TAB 2: MULTI-STRATEGY RECALL TESTER */}
      {activeSubTab === 'recall_tester' && (
        <div className="space-y-6">
          <div className="p-6 rounded-2xl bg-white border border-slate-200 shadow-2xs space-y-4">
            <div>
              <h3 className="text-base font-bold text-slate-900">
                Test Hindsight Recall Retrieval Strategy
              </h3>
              <p className="text-xs text-slate-500">
                Execute a real query against bank{' '}
                <code className="text-purple-700 font-mono">
                  supportmind-cust-{currentCustomer?.id.replace('cust_', '')}
                </code>{' '}
                to observe multi-way search (semantic vector + keyword matching + temporal index).
              </p>
            </div>

            <form onSubmit={handleTestRecall} className="flex items-center gap-2">
              <input
                type="text"
                value={testQuery}
                onChange={(e) => setTestQuery(e.target.value)}
                placeholder="Enter search query (e.g. 'router Wi-Fi dropping', 'invoice failure', '10G transceiver')..."
                className="flex-1 px-4 py-2.5 rounded-xl border border-slate-300 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <button
                type="submit"
                disabled={testingRecall}
                className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs flex items-center gap-1.5 shadow-sm disabled:opacity-50"
              >
                <Zap className="w-3.5 h-3.5" />
                <span>{testingRecall ? 'Searching...' : 'Recall Memories'}</span>
              </button>
            </form>
          </div>

          {/* Results Box */}
          {testResults && (
            <div className="space-y-4">
              {/* Timing & Summary Pill */}
              <div className="p-3.5 rounded-xl bg-slate-900 text-white text-xs flex flex-wrap items-center justify-between gap-3 font-mono">
                <div className="flex items-center gap-3">
                  <span className="text-emerald-400 font-bold">✓ Recall Complete</span>
                  <span>Matched: {testResults.resultsCount} Facts</span>
                  <span>Latency: {testResults.durationMs}ms</span>
                </div>
                <div className="text-slate-400">
                  Bank: {testResults.bankId} ({testResults.source})
                </div>
              </div>

              {/* Recalled Facts List */}
              <div className="space-y-3">
                <span className="text-xs font-bold text-slate-700 uppercase tracking-wider block">
                  Top Relevant Memories Retrieved:
                </span>

                {testResults.memories.map((m, idx) => (
                  <div
                    key={idx}
                    className="p-4 rounded-xl bg-white border border-slate-200 shadow-2xs space-y-1.5 text-xs"
                  >
                    <div className="flex items-center justify-between text-[11px]">
                      <div className="flex items-center gap-2">
                        <span className="w-5 h-5 rounded-full bg-purple-100 text-purple-700 flex items-center justify-center font-bold text-[10px]">
                          #{idx + 1}
                        </span>
                        <span className="font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-slate-100 text-slate-700">
                          {m.type}
                        </span>
                      </div>
                      <span className="font-mono text-purple-700 font-bold">
                        Relevance Score: {Math.round((m.score ?? 0.95) * 100)}%
                      </span>
                    </div>
                    <p className="text-slate-800 font-medium leading-relaxed pl-7">{m.text}</p>
                  </div>
                ))}
              </div>

              {/* Formatted Prompt String for LLM Injection */}
              <div className="space-y-2">
                <span className="text-xs font-bold text-slate-700 uppercase tracking-wider block">
                  Generated Prompt String for Gemini (via <code>recallResponseToPromptString</code>):
                </span>
                <pre className="p-4 rounded-xl bg-slate-100 text-slate-800 font-mono text-[11px] overflow-x-auto border border-slate-200 whitespace-pre-wrap leading-relaxed">
                  {testResults.promptString}
                </pre>
              </div>
            </div>
          )}
        </div>
      )}

      {/* SUB-TAB 3: MEMORY AUDIT LOGS */}
      {activeSubTab === 'audit_logs' && (
        <div className="rounded-2xl bg-white border border-slate-200 shadow-2xs overflow-hidden text-xs">
          <div className="p-4 border-b border-slate-100 bg-slate-50 flex items-center justify-between">
            <span className="font-bold text-slate-800">Recent Retain & Recall Audit Trail</span>
            <span className="text-slate-400">Real-time performance measurements</span>
          </div>

          <div className="divide-y divide-slate-100">
            {auditLogs.length === 0 ? (
              <div className="p-8 text-center text-slate-400">No memory audit logs recorded yet.</div>
            ) : (
              auditLogs.map((log) => (
                <div key={log.id} className="p-4 flex items-center justify-between hover:bg-slate-50/60">
                  <div className="space-y-1 max-w-xl">
                    <div className="flex items-center gap-2">
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                          log.action === 'retain'
                            ? 'bg-purple-100 text-purple-800'
                            : 'bg-blue-100 text-blue-800'
                        }`}
                      >
                        {log.action}
                      </span>
                      <span className="font-semibold text-slate-800">{log.customer_name}</span>
                      <span className="text-slate-400 font-mono text-[10px]">
                        {new Date(log.created_at).toLocaleTimeString()}
                      </span>
                    </div>
                    <p className="text-slate-600 truncate">{log.query_or_content}</p>
                  </div>

                  <div className="text-right font-mono text-[11px] text-slate-500">
                    <div className="font-bold text-slate-800">{log.duration_ms}ms</div>
                    <div className="text-[10px] text-slate-400">{log.source}</div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* Manual Retain Modal */}
      {showRetainModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
          <form
            onSubmit={handleRetainMemory}
            className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-lg overflow-hidden"
          >
            <div className="p-5 border-b border-slate-100 bg-slate-50 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <BrainCircuit className="w-5 h-5 text-purple-600" />
                <h3 className="font-bold text-slate-900 text-base">Retain New Customer Memory</h3>
              </div>
              <button
                type="button"
                onClick={() => setShowRetainModal(false)}
                className="text-slate-400 hover:text-slate-600 font-bold p-1 text-sm"
              >
                ✕
              </button>
            </div>

            <div className="p-6 space-y-4 text-xs">
              <div>
                <label className="font-semibold text-slate-700 block mb-1">Target Customer Bank</label>
                <select
                  value={newMemory.customerId}
                  onChange={(e) => setNewMemory({ ...newMemory, customerId: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 focus:ring-2 focus:ring-purple-500 focus:outline-none bg-white"
                >
                  {customers.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name} (supportmind-cust-{c.id.replace('cust_', '')})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="font-semibold text-slate-700 block mb-1">Memory Type</label>
                <select
                  value={newMemory.memoryType}
                  onChange={(e) => setNewMemory({ ...newMemory, memoryType: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 focus:ring-2 focus:ring-purple-500 focus:outline-none bg-white"
                >
                  <option value="fact">Fact</option>
                  <option value="hardware">Hardware / Environment</option>
                  <option value="complaint">Complaint</option>
                  <option value="preference">Preference</option>
                  <option value="resolution">Confirmed Resolution</option>
                </select>
              </div>

              <div>
                <label className="font-semibold text-slate-700 block mb-1">
                  Memory Content (To Retain in Hindsight)
                </label>
                <textarea
                  rows={3}
                  required
                  value={newMemory.content}
                  onChange={(e) => setNewMemory({ ...newMemory, content: e.target.value })}
                  placeholder="e.g. Customer upgraded to Netgear firmware v2.1.0 on Nov 4."
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 focus:ring-2 focus:ring-purple-500 focus:outline-none text-xs text-slate-800"
                />
              </div>
            </div>

            <div className="p-4 border-t border-slate-100 bg-slate-50 flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setShowRetainModal(false)}
                className="px-4 py-2 rounded-xl border border-slate-200 text-slate-700 font-semibold text-xs hover:bg-slate-100"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isRetaining || !newMemory.content.trim()}
                className="px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-semibold text-xs shadow-sm disabled:opacity-50"
              >
                {isRetaining ? 'Retaining...' : 'Retain Memory'}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};
