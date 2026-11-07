import React, { useState } from 'react';
import {
  Users,
  Search,
  Plus,
  BrainCircuit,
  Ticket,
  MessageSquare,
  Sparkles,
  ExternalLink,
  Laptop,
  CheckCircle2,
  Clock,
  Shield,
  Layers,
} from 'lucide-react';
import { api } from '../services/api';
import type { Customer, MemoryItem } from '../types';

interface CustomerManagementProps {
  customers: Customer[];
  onSelectCustomer: (id: string) => void;
  onNavigate: (tab: string) => void;
  onRefreshCustomers: () => void;
}

export const CustomerManagement: React.FC<CustomerManagementProps> = ({
  customers,
  onSelectCustomer,
  onNavigate,
  onRefreshCustomers,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCustDetail, setSelectedCustDetail] = useState<Customer | null>(null);
  const [custMemories, setCustMemories] = useState<MemoryItem[]>([]);
  const [loadingMemories, setLoadingMemories] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);

  // New customer form state
  const [newCustomer, setNewCustomer] = useState({
    name: '',
    email: '',
    company: '',
    plan: 'Standard',
    device_info: '',
    preferences: '',
  });

  const filtered = customers.filter(
    (c) =>
      c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.company?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.device_info?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleOpenDetail = async (c: Customer) => {
    setSelectedCustDetail(c);
    setLoadingMemories(true);
    try {
      const res = await api.getMemories(c.id);
      setCustMemories(res.memories);
    } catch (err) {
      console.error('Failed to load memories:', err);
    } finally {
      setLoadingMemories(false);
    }
  };

  const handleCreateCustomer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCustomer.name || !newCustomer.email) return;

    try {
      await api.createCustomer(newCustomer);
      setShowAddModal(false);
      setNewCustomer({
        name: '',
        email: '',
        company: '',
        plan: 'Standard',
        device_info: '',
        preferences: '',
      });
      onRefreshCustomers();
    } catch (err) {
      console.error('Failed to create customer:', err);
    }
  };

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
            Customer Directory & Memory Scopes
          </h1>
          <p className="text-xs text-slate-500">
            Each customer is allocated a dedicated, physically isolated Hindsight memory bank
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search by name, hardware, company..."
              className="pl-9 pr-4 py-2 rounded-xl border border-slate-200 text-xs w-64 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
            />
          </div>
          <button
            onClick={() => setShowAddModal(true)}
            className="px-3.5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold flex items-center gap-1.5 shadow-sm transition-all"
          >
            <Plus className="w-4 h-4" />
            <span>Add Customer</span>
          </button>
        </div>
      </div>

      {/* Customer Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {filtered.map((c) => (
          <div
            key={c.id}
            className="rounded-2xl bg-white border border-slate-200 shadow-2xs hover:shadow-md hover:border-blue-300 transition-all p-5 flex flex-col justify-between"
          >
            <div>
              {/* Card Header */}
              <div className="flex items-start justify-between gap-3 mb-3">
                <div className="flex items-center gap-3">
                  <img
                    src={c.avatar}
                    alt={c.name}
                    className="w-11 h-11 rounded-full object-cover border border-slate-200"
                  />
                  <div>
                    <h3 className="font-bold text-slate-900 text-sm">{c.name}</h3>
                    <p className="text-xs text-slate-500">{c.email}</p>
                  </div>
                </div>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-blue-50 text-blue-700 border border-blue-200">
                  {c.plan || 'Standard'}
                </span>
              </div>

              {/* Company & Bank ID */}
              <div className="space-y-2 py-2 border-y border-slate-100 text-xs">
                <div className="flex items-center justify-between">
                  <span className="text-slate-400">Company:</span>
                  <span className="font-semibold text-slate-800">{c.company || 'Individual'}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-400">Memory Scope:</span>
                  <span className="font-mono text-[10px] text-purple-700 font-semibold bg-purple-50 px-1.5 py-0.5 rounded">
                    supportmind-cust-{c.id.replace('cust_', '')}
                  </span>
                </div>
              </div>

              {/* Device / Technical specs */}
              <div className="mt-3 text-xs space-y-1">
                <span className="text-slate-400 font-medium flex items-center gap-1">
                  <Laptop className="w-3 h-3 text-slate-400" />
                  Hardware / Environment:
                </span>
                <p className="text-slate-700 font-mono text-[11px] line-clamp-2 bg-slate-50 p-2 rounded-lg border border-slate-100">
                  {c.device_info || 'Standard Technical Profile'}
                </p>
              </div>

              {/* Stats Bar */}
              <div className="grid grid-cols-3 gap-2 text-center text-xs mt-3 pt-2">
                <div className="bg-slate-50 p-2 rounded-lg">
                  <span className="text-slate-400 text-[10px] block">Memories</span>
                  <span className="font-bold text-purple-700">{c.memory_count || 3}</span>
                </div>
                <div className="bg-slate-50 p-2 rounded-lg">
                  <span className="text-slate-400 text-[10px] block">Open Tickets</span>
                  <span className="font-bold text-amber-700">{c.open_tickets_count || 0}</span>
                </div>
                <div className="bg-slate-50 p-2 rounded-lg">
                  <span className="text-slate-400 text-[10px] block">Chats</span>
                  <span className="font-bold text-blue-700">{c.conversation_count || 1}</span>
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="pt-4 mt-3 border-t border-slate-100 flex items-center gap-2">
              <button
                onClick={() => handleOpenDetail(c)}
                className="flex-1 py-1.5 px-3 rounded-lg border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-semibold transition-colors"
              >
                Inspect Bank
              </button>
              <button
                onClick={() => {
                  onSelectCustomer(c.id);
                  onNavigate('chat');
                }}
                className="flex-1 py-1.5 px-3 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold flex items-center justify-center gap-1 shadow-2xs transition-colors"
              >
                <MessageSquare className="w-3.5 h-3.5" />
                <span>Chat</span>
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Customer Detail & Memory Modal */}
      {selectedCustDetail && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-2xl overflow-hidden">
            <div className="p-5 border-b border-slate-100 bg-slate-50 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <img
                  src={selectedCustDetail.avatar}
                  alt={selectedCustDetail.name}
                  className="w-10 h-10 rounded-full object-cover border"
                />
                <div>
                  <h3 className="font-bold text-slate-900 text-base">{selectedCustDetail.name}</h3>
                  <p className="text-xs text-slate-500 font-mono">
                    Bank: supportmind-cust-{selectedCustDetail.id.replace('cust_', '')}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setSelectedCustDetail(null)}
                className="text-slate-400 hover:text-slate-600 font-bold p-1 text-sm"
              >
                ✕
              </button>
            </div>

            <div className="p-6 space-y-4 max-h-[70vh] overflow-y-auto text-xs">
              <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/80 space-y-1.5">
                <span className="font-bold text-slate-700 block">Preferences & Protocols:</span>
                <p className="text-slate-600 leading-relaxed">{selectedCustDetail.preferences}</p>
              </div>

              <div>
                <span className="font-bold text-slate-800 text-sm block mb-2">
                  Retained Memories in Isolated Scope ({custMemories.length})
                </span>

                {loadingMemories ? (
                  <div className="py-6 text-center text-slate-400">Loading customer memories...</div>
                ) : custMemories.length === 0 ? (
                  <p className="text-slate-400 italic">No memories retained yet for this customer.</p>
                ) : (
                  <div className="space-y-2">
                    {custMemories.map((m, idx) => (
                      <div
                        key={idx}
                        className="p-3 rounded-xl bg-white border border-slate-200 shadow-2xs space-y-1"
                      >
                        <div className="flex items-center justify-between text-[11px]">
                          <span className="font-bold uppercase tracking-wider text-purple-700 bg-purple-50 px-1.5 py-0.5 rounded">
                            {m.memory_type || m.type}
                          </span>
                          <span className="text-slate-400">
                            {m.created_at ? new Date(m.created_at).toLocaleDateString() : ''}
                          </span>
                        </div>
                        <p className="text-slate-800 font-medium leading-relaxed">
                          {m.content || m.text}
                        </p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <div className="p-4 border-t border-slate-100 bg-slate-50 flex items-center justify-between">
              <button
                onClick={() => {
                  onSelectCustomer(selectedCustDetail.id);
                  setSelectedCustDetail(null);
                  onNavigate('chat');
                }}
                className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs flex items-center gap-2 shadow-sm"
              >
                <MessageSquare className="w-3.5 h-3.5" />
                <span>Start Chat with {selectedCustDetail.name.split(' ')[0]}</span>
              </button>
              <button
                onClick={() => setSelectedCustDetail(null)}
                className="px-4 py-2 rounded-xl border border-slate-200 text-slate-700 font-semibold text-xs hover:bg-slate-100"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add Customer Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
          <form
            onSubmit={handleCreateCustomer}
            className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-lg overflow-hidden"
          >
            <div className="p-5 border-b border-slate-100 bg-slate-50 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <Users className="w-5 h-5 text-blue-600" />
                <h3 className="font-bold text-slate-900 text-base">Add New Customer</h3>
              </div>
              <button
                type="button"
                onClick={() => setShowAddModal(false)}
                className="text-slate-400 hover:text-slate-600 font-bold p-1 text-sm"
              >
                ✕
              </button>
            </div>

            <div className="p-6 space-y-3.5 text-xs">
              <div>
                <label className="font-semibold text-slate-700 block mb-1">Full Name</label>
                <input
                  type="text"
                  required
                  value={newCustomer.name}
                  onChange={(e) => setNewCustomer({ ...newCustomer, name: e.target.value })}
                  placeholder="e.g. Liam Foster"
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="font-semibold text-slate-700 block mb-1">Email Address</label>
                <input
                  type="email"
                  required
                  value={newCustomer.email}
                  onChange={(e) => setNewCustomer({ ...newCustomer, email: e.target.value })}
                  placeholder="liam@company.com"
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Company</label>
                  <input
                    type="text"
                    value={newCustomer.company}
                    onChange={(e) => setNewCustomer({ ...newCustomer, company: e.target.value })}
                    placeholder="Acme Corp"
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Subscription Plan</label>
                  <select
                    value={newCustomer.plan}
                    onChange={(e) => setNewCustomer({ ...newCustomer, plan: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 focus:ring-2 focus:ring-blue-500 focus:outline-none bg-white"
                  >
                    <option value="Standard">Standard</option>
                    <option value="Business">Business</option>
                    <option value="Pro Annual">Pro Annual</option>
                    <option value="Enterprise">Enterprise</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="font-semibold text-slate-700 block mb-1">
                  Hardware / Router / Environment Details
                </label>
                <input
                  type="text"
                  value={newCustomer.device_info}
                  onChange={(e) => setNewCustomer({ ...newCustomer, device_info: e.target.value })}
                  placeholder="e.g. Netgear Nighthawk RAX50, Windows 11 Pro"
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="font-semibold text-slate-700 block mb-1">Customer Preferences</label>
                <textarea
                  rows={2}
                  value={newCustomer.preferences}
                  onChange={(e) => setNewCustomer({ ...newCustomer, preferences: e.target.value })}
                  placeholder="e.g. Prefers email follow-ups; wants step-by-step instructions"
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                />
              </div>
            </div>

            <div className="p-4 border-t border-slate-100 bg-slate-50 flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setShowAddModal(false)}
                className="px-4 py-2 rounded-xl border border-slate-200 text-slate-700 font-semibold text-xs hover:bg-slate-100"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs shadow-sm"
              >
                Create Customer Bank
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};
