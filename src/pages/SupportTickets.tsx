import React, { useState, useEffect } from 'react';
import {
  Ticket as TicketIcon,
  Search,
  Filter,
  Plus,
  CheckCircle2,
  Clock,
  AlertCircle,
  BrainCircuit,
  MessageSquare,
  ArrowUpRight,
  ShieldAlert,
} from 'lucide-react';
import { api } from '../services/api';
import type { Ticket, Customer } from '../types';

interface SupportTicketsProps {
  customers: Customer[];
  onSelectCustomer: (id: string) => void;
  onNavigate: (tab: string) => void;
  prefillTicketContext?: { customerId: string; title: string; description: string } | null;
  onClearPrefillContext?: () => void;
}

export const SupportTickets: React.FC<SupportTicketsProps> = ({
  customers,
  onSelectCustomer,
  onNavigate,
  prefillTicketContext,
  onClearPrefillContext,
}) => {
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('all');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [priorityFilter, setPriorityFilter] = useState('all');
  const [search, setSearch] = useState('');

  // Ticket create modal
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newTicket, setNewTicket] = useState({
    customer_id: customers[0]?.id || '',
    title: '',
    description: '',
    category: 'Hardware / Network',
    priority: 'Medium',
  });

  // Ticket resolve modal
  const [resolvingTicket, setResolvingTicket] = useState<Ticket | null>(null);
  const [resolutionNotes, setResolutionNotes] = useState('');
  const [isResolving, setIsResolving] = useState(false);

  useEffect(() => {
    loadTickets();
  }, [statusFilter, categoryFilter, priorityFilter, search]);

  useEffect(() => {
    if (prefillTicketContext) {
      setNewTicket({
        customer_id: prefillTicketContext.customerId,
        title: prefillTicketContext.title,
        description: prefillTicketContext.description,
        category: 'Hardware / Network',
        priority: 'High',
      });
      setShowCreateModal(true);
      if (onClearPrefillContext) onClearPrefillContext();
    }
  }, [prefillTicketContext]);

  const loadTickets = async () => {
    try {
      setLoading(true);
      const res = await api.getTickets({
        status: statusFilter,
        category: categoryFilter,
        priority: priorityFilter,
        search,
      });
      setTickets(res.tickets);
    } catch (err) {
      console.error('Failed to load tickets:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateTicket = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTicket.customer_id || !newTicket.title || !newTicket.description) return;

    try {
      await api.createTicket(newTicket);
      setShowCreateModal(false);
      setNewTicket({
        customer_id: customers[0]?.id || '',
        title: '',
        description: '',
        category: 'Hardware / Network',
        priority: 'Medium',
      });
      loadTickets();
    } catch (err) {
      console.error('Failed to create ticket:', err);
    }
  };

  const handleResolveTicket = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!resolvingTicket || !resolutionNotes.trim()) return;

    setIsResolving(true);
    try {
      await api.updateTicket(resolvingTicket.id, {
        status: 'Resolved',
        resolution_notes: resolutionNotes,
      });
      setResolvingTicket(null);
      setResolutionNotes('');
      loadTickets();
    } catch (err) {
      console.error('Failed to resolve ticket:', err);
    } finally {
      setIsResolving(false);
    }
  };

  const priorityColors: Record<string, string> = {
    Critical: 'bg-red-50 text-red-700 border-red-200',
    High: 'bg-amber-50 text-amber-700 border-amber-200',
    Medium: 'bg-blue-50 text-blue-700 border-blue-200',
    Low: 'bg-slate-50 text-slate-700 border-slate-200',
  };

  const statusColors: Record<string, string> = {
    Open: 'bg-amber-500/10 text-amber-700 border-amber-300',
    'In Progress': 'bg-blue-500/10 text-blue-700 border-blue-300',
    Resolved: 'bg-emerald-500/10 text-emerald-700 border-emerald-300',
    Closed: 'bg-slate-200 text-slate-700 border-slate-300',
  };

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
            Support Ticket Management
          </h1>
          <p className="text-xs text-slate-500">
            Resolving any ticket automatically retains the solution into the customer&apos;s Hindsight memory bank
          </p>
        </div>

        <button
          onClick={() => setShowCreateModal(true)}
          className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold flex items-center gap-1.5 shadow-sm transition-all"
        >
          <Plus className="w-4 h-4" />
          <span>New Support Ticket</span>
        </button>
      </div>

      {/* Filter Bar */}
      <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-2xs flex flex-wrap items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-2 flex-1 min-w-[240px]">
          <Search className="w-4 h-4 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search tickets by #, title, or description..."
            className="w-full bg-transparent border-none focus:outline-none text-slate-800 placeholder-slate-400"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Status Filter */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-2.5 py-1.5 rounded-lg border border-slate-200 bg-slate-50 text-slate-700 font-medium focus:outline-none cursor-pointer"
          >
            <option value="all">All Statuses</option>
            <option value="Open">Open</option>
            <option value="In Progress">In Progress</option>
            <option value="Resolved">Resolved</option>
          </select>

          {/* Category Filter */}
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="px-2.5 py-1.5 rounded-lg border border-slate-200 bg-slate-50 text-slate-700 font-medium focus:outline-none cursor-pointer"
          >
            <option value="all">All Categories</option>
            <option value="Hardware / Network">Hardware / Network</option>
            <option value="Billing">Billing</option>
            <option value="Delivery">Delivery</option>
            <option value="Software">Software</option>
          </select>

          {/* Priority Filter */}
          <select
            value={priorityFilter}
            onChange={(e) => setPriorityFilter(e.target.value)}
            className="px-2.5 py-1.5 rounded-lg border border-slate-200 bg-slate-50 text-slate-700 font-medium focus:outline-none cursor-pointer"
          >
            <option value="all">All Priorities</option>
            <option value="Critical">Critical</option>
            <option value="High">High</option>
            <option value="Medium">Medium</option>
            <option value="Low">Low</option>
          </select>
        </div>
      </div>

      {/* Tickets Table */}
      <div className="rounded-2xl bg-white border border-slate-200 shadow-2xs overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-xs text-slate-400">Loading support tickets...</div>
        ) : tickets.length === 0 ? (
          <div className="p-12 text-center text-xs text-slate-400">No support tickets match the filters.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50/80 border-b border-slate-200 text-slate-500 font-semibold uppercase tracking-wider text-[10px]">
                <tr>
                  <th className="py-3 px-4">Ticket</th>
                  <th className="py-3 px-4">Customer</th>
                  <th className="py-3 px-4">Category</th>
                  <th className="py-3 px-4">Priority</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4">Created</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {tickets.map((t) => {
                  const isResolved = t.status === 'Resolved';
                  return (
                    <tr key={t.id} className="hover:bg-slate-50/60 transition-colors">
                      <td className="py-3.5 px-4">
                        <span className="font-mono font-bold text-blue-600 block">{t.ticket_number}</span>
                        <span className="font-semibold text-slate-900 block max-w-xs truncate">{t.title}</span>
                      </td>

                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-2">
                          <img
                            src={t.customer_avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150'}
                            alt={t.customer_name}
                            className="w-6 h-6 rounded-full object-cover border"
                          />
                          <span className="font-medium text-slate-800">{t.customer_name}</span>
                        </div>
                      </td>

                      <td className="py-3.5 px-4 text-slate-600">{t.category}</td>

                      <td className="py-3.5 px-4">
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-bold border ${
                            priorityColors[t.priority] || 'bg-slate-50 text-slate-700'
                          }`}
                        >
                          {t.priority}
                        </span>
                      </td>

                      <td className="py-3.5 px-4">
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-bold border ${
                            statusColors[t.status] || 'bg-slate-50 text-slate-700'
                          }`}
                        >
                          {t.status}
                        </span>
                      </td>

                      <td className="py-3.5 px-4 text-slate-400">
                        {new Date(t.created_at).toLocaleDateString()}
                      </td>

                      <td className="py-3.5 px-4 text-right space-x-1.5 whitespace-nowrap">
                        {!isResolved ? (
                          <button
                            onClick={() => {
                              setResolvingTicket(t);
                              setResolutionNotes('');
                            }}
                            className="px-2.5 py-1 rounded-md bg-emerald-50 hover:bg-emerald-100 text-emerald-700 font-semibold text-[11px] border border-emerald-200 transition-colors"
                          >
                            Resolve & Retain
                          </button>
                        ) : (
                          <span
                            className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-600"
                            title={t.resolution_notes || 'Resolved'}
                          >
                            <BrainCircuit className="w-3 h-3 text-purple-600" />
                            <span>Retained Fix</span>
                          </span>
                        )}

                        <button
                          onClick={() => {
                            onSelectCustomer(t.customer_id);
                            onNavigate('chat');
                          }}
                          className="px-2.5 py-1 rounded-md bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-[11px] transition-colors"
                        >
                          Chat
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Resolve Ticket Modal */}
      {resolvingTicket && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
          <form
            onSubmit={handleResolveTicket}
            className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-lg overflow-hidden"
          >
            <div className="p-5 border-b border-slate-100 bg-slate-50 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                <h3 className="font-bold text-slate-900 text-base">
                  Resolve Ticket #{resolvingTicket.ticket_number}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setResolvingTicket(null)}
                className="text-slate-400 hover:text-slate-600 font-bold p-1 text-sm"
              >
                ✕
              </button>
            </div>

            <div className="p-6 space-y-4 text-xs">
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/80 space-y-1">
                <span className="font-semibold text-slate-500 block">Issue Title:</span>
                <p className="font-bold text-slate-900">{resolvingTicket.title}</p>
                <p className="text-slate-600 mt-1">{resolvingTicket.description}</p>
              </div>

              <div>
                <label className="font-bold text-slate-800 block mb-1">
                  Resolution Notes (Auto-Retained into Hindsight Bank)
                </label>
                <p className="text-[11px] text-slate-500 mb-2">
                  Describe what fixed the issue. This exact resolution will be permanently recalled the next time{' '}
                  {resolvingTicket.customer_name} starts a support conversation.
                </p>
                <textarea
                  rows={4}
                  required
                  value={resolutionNotes}
                  onChange={(e) => setResolutionNotes(e.target.value)}
                  placeholder="e.g. Firmware updated to v1.2.4, 5GHz channel locked to 44 with 80MHz bandwidth. Verified drops resolved."
                  className="w-full px-3 py-2.5 rounded-xl border border-slate-300 focus:ring-2 focus:ring-emerald-500 focus:outline-none text-xs text-slate-800"
                />
              </div>

              <div className="p-3 rounded-xl bg-purple-50/70 border border-purple-200 text-purple-900 flex items-center gap-2">
                <BrainCircuit className="w-4 h-4 text-purple-600 shrink-0" />
                <span className="text-[11px] leading-relaxed">
                  Upon submission, Hindsight will invoke <code>client.retain()</code> into bank{' '}
                  <code>supportmind-cust-{resolvingTicket.customer_id.replace('cust_', '')}</code>.
                </span>
              </div>
            </div>

            <div className="p-4 border-t border-slate-100 bg-slate-50 flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setResolvingTicket(null)}
                className="px-4 py-2 rounded-xl border border-slate-200 text-slate-700 font-semibold text-xs hover:bg-slate-100"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isResolving || !resolutionNotes.trim()}
                className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs shadow-sm disabled:opacity-50"
              >
                {isResolving ? 'Retaining in Hindsight...' : 'Confirm Resolution & Retain'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Create Ticket Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
          <form
            onSubmit={handleCreateTicket}
            className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-lg overflow-hidden"
          >
            <div className="p-5 border-b border-slate-100 bg-slate-50 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <TicketIcon className="w-5 h-5 text-blue-600" />
                <h3 className="font-bold text-slate-900 text-base">Create Support Ticket</h3>
              </div>
              <button
                type="button"
                onClick={() => setShowCreateModal(false)}
                className="text-slate-400 hover:text-slate-600 font-bold p-1 text-sm"
              >
                ✕
              </button>
            </div>

            <div className="p-6 space-y-3.5 text-xs">
              <div>
                <label className="font-semibold text-slate-700 block mb-1">Customer</label>
                <select
                  value={newTicket.customer_id}
                  onChange={(e) => setNewTicket({ ...newTicket, customer_id: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 focus:ring-2 focus:ring-blue-500 focus:outline-none bg-white"
                >
                  {customers.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name} ({c.company || 'Personal'})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="font-semibold text-slate-700 block mb-1">Ticket Title</label>
                <input
                  type="text"
                  required
                  value={newTicket.title}
                  onChange={(e) => setNewTicket({ ...newTicket, title: e.target.value })}
                  placeholder="e.g. Wi-Fi dropping on Zoom calls"
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Category</label>
                  <select
                    value={newTicket.category}
                    onChange={(e) => setNewTicket({ ...newTicket, category: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 focus:ring-2 focus:ring-blue-500 focus:outline-none bg-white"
                  >
                    <option value="Hardware / Network">Hardware / Network</option>
                    <option value="Billing">Billing</option>
                    <option value="Delivery">Delivery</option>
                    <option value="Software">Software</option>
                    <option value="General">General</option>
                  </select>
                </div>
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Priority</label>
                  <select
                    value={newTicket.priority}
                    onChange={(e) => setNewTicket({ ...newTicket, priority: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 focus:ring-2 focus:ring-blue-500 focus:outline-none bg-white"
                  >
                    <option value="Low">Low</option>
                    <option value="Medium">Medium</option>
                    <option value="High">High</option>
                    <option value="Critical">Critical</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="font-semibold text-slate-700 block mb-1">Description</label>
                <textarea
                  rows={3}
                  required
                  value={newTicket.description}
                  onChange={(e) => setNewTicket({ ...newTicket, description: e.target.value })}
                  placeholder="Describe the complaint or troubleshooting requirement..."
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                />
              </div>
            </div>

            <div className="p-4 border-t border-slate-100 bg-slate-50 flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setShowCreateModal(false)}
                className="px-4 py-2 rounded-xl border border-slate-200 text-slate-700 font-semibold text-xs hover:bg-slate-100"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs shadow-sm"
              >
                Create Ticket & Retain
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};
