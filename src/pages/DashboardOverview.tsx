import React, { useEffect, useState } from 'react';
import {
  Users,
  MessageSquare,
  Ticket,
  CheckCircle2,
  BrainCircuit,
  Clock,
  ArrowUpRight,
  TrendingUp,
  AlertCircle,
  ShieldAlert,
  Server,
  Zap,
} from 'lucide-react';
import { api } from '../services/api';
import type { AnalyticsData, Customer } from '../types';

interface DashboardOverviewProps {
  onNavigate: (tab: string) => void;
  customers: Customer[];
  onSelectCustomer: (id: string) => void;
}

export const DashboardOverview: React.FC<DashboardOverviewProps> = ({
  onNavigate,
  customers,
  onSelectCustomer,
}) => {
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadAnalytics();
  }, []);

  const loadAnalytics = async () => {
    try {
      setLoading(true);
      const data = await api.getAnalytics();
      setAnalytics(data);
    } catch (err) {
      console.error('Failed to load analytics:', err);
    } finally {
      setLoading(false);
    }
  };

  const metrics = analytics?.metrics;

  return (
    <div className="p-8 space-y-8 max-w-7xl mx-auto">
      {/* Top Banner / Hero */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-slate-900 via-indigo-950 to-blue-900 text-white p-7 shadow-xl">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2 max-w-2xl">
            <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-blue-500/20 text-blue-300 border border-blue-400/30 text-xs font-semibold">
              <Zap className="w-3.5 h-3.5 text-blue-400" />
              <span>Hindsight Long-Term Agent Memory Layer Active</span>
            </div>
            <h1 className="text-2xl font-bold tracking-tight text-white sm:text-3xl">
              Support with Continuous Customer Context
            </h1>
            <p className="text-sm text-slate-300 leading-relaxed">
              SupportMind prevents repetitive customer questions by retaining complaints, router models,
              billing issues, and confirmed fixes in isolated per-customer memory banks.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={() => onNavigate('comparison')}
              className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white text-xs font-bold shadow-lg shadow-blue-500/20 flex items-center gap-2 transition-all"
            >
              <TrendingUp className="w-4 h-4" />
              <span>See Memory Comparison</span>
            </button>
            <button
              onClick={() => onNavigate('chat')}
              className="px-4 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-semibold backdrop-blur-sm border border-white/15 flex items-center gap-2 transition-all"
            >
              <MessageSquare className="w-4 h-4" />
              <span>Open Support Chat</span>
            </button>
          </div>
        </div>

        {/* Subtle Background Glow */}
        <div className="absolute -right-12 -top-12 w-64 h-64 bg-blue-500/20 rounded-full blur-3xl pointer-events-none" />
      </div>

      {/* Metrics Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Metric 1 */}
        <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-xs hover:border-slate-300 transition-all">
          <div className="flex items-center justify-between text-slate-500 mb-3">
            <span className="text-xs font-semibold uppercase tracking-wider">Total Customers</span>
            <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
              <Users className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline justify-between">
            <div className="text-2xl font-extrabold text-slate-900">
              {metrics?.totalCustomers ?? customers.length}
            </div>
            <span className="text-xs font-semibold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full">
              5 Active Scenarios
            </span>
          </div>
          <p className="mt-2 text-xs text-slate-500">Separately scoped memory banks</p>
        </div>

        {/* Metric 2 */}
        <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-xs hover:border-slate-300 transition-all">
          <div className="flex items-center justify-between text-slate-500 mb-3">
            <span className="text-xs font-semibold uppercase tracking-wider">Retained Memories</span>
            <div className="w-8 h-8 rounded-lg bg-purple-50 text-purple-600 flex items-center justify-center">
              <BrainCircuit className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline justify-between">
            <div className="text-2xl font-extrabold text-slate-900">
              {metrics?.totalMemories ?? 16}
            </div>
            <span className="text-xs font-semibold text-purple-600 bg-purple-50 px-2 py-0.5 rounded-full">
              ~{Math.round(metrics?.estimatedTimeSavedMinutes ?? 67)} min saved
            </span>
          </div>
          <p className="mt-2 text-xs text-slate-500">Hardware, preferences & fixes</p>
        </div>

        {/* Metric 3 */}
        <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-xs hover:border-slate-300 transition-all">
          <div className="flex items-center justify-between text-slate-500 mb-3">
            <span className="text-xs font-semibold uppercase tracking-wider">Open Support Tickets</span>
            <div className="w-8 h-8 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center">
              <Ticket className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline justify-between">
            <div className="text-2xl font-extrabold text-slate-900">
              {(metrics?.openTickets ?? 0) + (metrics?.inProgressTickets ?? 0)}
            </div>
            <span className="text-xs font-semibold text-amber-700 bg-amber-50 px-2 py-0.5 rounded-full">
              {metrics?.inProgressTickets ?? 0} In Progress
            </span>
          </div>
          <p className="mt-2 text-xs text-slate-500">Linked to customer histories</p>
        </div>

        {/* Metric 4 */}
        <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-xs hover:border-slate-300 transition-all">
          <div className="flex items-center justify-between text-slate-500 mb-3">
            <span className="text-xs font-semibold uppercase tracking-wider">Resolution Rate</span>
            <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline justify-between">
            <div className="text-2xl font-extrabold text-slate-900">
              {metrics?.resolutionRatePercent ?? 20}%
            </div>
            <span className="text-xs font-semibold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full">
              {metrics?.resolvedTickets ?? 1} Resolved
            </span>
          </div>
          <p className="mt-2 text-xs text-slate-500">Auto-retained into memory</p>
        </div>
      </div>

      {/* Main Content Two Columns */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column (2 Cols): Frequently Reported Issues & Customer Scenarios */}
        <div className="lg:col-span-2 space-y-6">
          {/* Active Customer Scenarios Card */}
          <div className="p-6 rounded-2xl bg-white border border-slate-200 shadow-xs">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-base font-bold text-slate-900">Active Customer Memory Scenarios</h3>
                <p className="text-xs text-slate-500">
                  Select any customer to test personalized memory recall in chat or comparison
                </p>
              </div>
              <button
                onClick={() => onNavigate('customers')}
                className="text-xs font-semibold text-blue-600 hover:text-blue-700 flex items-center gap-1"
              >
                <span>View all</span>
                <ArrowUpRight className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="divide-y divide-slate-100">
              {customers.map((c) => (
                <div
                  key={c.id}
                  onClick={() => {
                    onSelectCustomer(c.id);
                    onNavigate('chat');
                  }}
                  className="py-3.5 flex items-center justify-between hover:bg-slate-50/80 px-2.5 rounded-xl cursor-pointer transition-colors group"
                >
                  <div className="flex items-center gap-3.5">
                    <img
                      src={c.avatar}
                      alt={c.name}
                      className="w-10 h-10 rounded-full object-cover border border-slate-200"
                    />
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-sm text-slate-900 group-hover:text-blue-600 transition-colors">
                          {c.name}
                        </span>
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-slate-100 text-slate-600">
                          {c.company}
                        </span>
                      </div>
                      <p className="text-xs text-slate-500 truncate max-w-md mt-0.5">
                        {c.device_info || 'Standard Environment'}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <div className="text-right hidden sm:block">
                      <div className="text-xs font-semibold text-purple-600 flex items-center gap-1 justify-end">
                        <BrainCircuit className="w-3 h-3" />
                        <span>{c.memory_count || 3} memories</span>
                      </div>
                      <span className="text-[10px] text-slate-400">
                        {c.open_tickets_count ? `${c.open_tickets_count} open ticket` : 'No open tickets'}
                      </span>
                    </div>
                    <span className="text-xs font-semibold text-blue-600 group-hover:translate-x-0.5 transition-transform">
                      Chat →
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Frequently Reported Issues */}
          <div className="p-6 rounded-2xl bg-white border border-slate-200 shadow-xs">
            <h3 className="text-base font-bold text-slate-900 mb-1">Frequently Reported Problem Types</h3>
            <p className="text-xs text-slate-500 mb-4">
              Extracted from customer complaint memories across multiple sessions
            </p>

            <div className="space-y-3">
              {analytics?.breakdowns.frequentComplaints?.map((comp, idx) => (
                <div
                  key={idx}
                  className="p-3 rounded-xl bg-slate-50 border border-slate-200/70 text-xs flex items-start gap-3"
                >
                  <div className="w-6 h-6 rounded-lg bg-amber-100 text-amber-700 flex items-center justify-center shrink-0 font-bold text-[11px]">
                    #{idx + 1}
                  </div>
                  <div className="space-y-1 flex-1">
                    <p className="text-slate-800 font-medium leading-relaxed">{comp.content}</p>
                    <div className="flex items-center gap-3 text-[11px] text-slate-400">
                      <span>Customer: {comp.customer_id}</span>
                      <span>Confidence: {Math.round((comp.confidence ?? 0.95) * 100)}%</span>
                      <span>{new Date(comp.created_at).toLocaleDateString()}</span>
                    </div>
                  </div>
                </div>
              )) || (
                <p className="text-xs text-slate-400">No complaint memories recorded yet.</p>
              )}
            </div>
          </div>
        </div>

        {/* Right Column (1 Col): Ticket Categories & Memory Distribution */}
        <div className="space-y-6">
          {/* Ticket Breakdown Card */}
          <div className="p-6 rounded-2xl bg-white border border-slate-200 shadow-xs">
            <h3 className="text-base font-bold text-slate-900 mb-1">Tickets by Category</h3>
            <p className="text-xs text-slate-500 mb-4">Real distribution of active issues</p>

            <div className="space-y-3">
              {analytics?.breakdowns.ticketsByCategory?.map((cat) => (
                <div key={cat.category} className="space-y-1">
                  <div className="flex justify-between text-xs font-medium text-slate-700">
                    <span>{cat.category}</span>
                    <span className="font-bold text-slate-900">{cat.count}</span>
                  </div>
                  <div className="w-full h-2 rounded-full bg-slate-100 overflow-hidden">
                    <div
                      className="h-full rounded-full bg-blue-600"
                      style={{
                        width: `${Math.min(100, (cat.count / Math.max(1, metrics?.totalTickets || 5)) * 100)}%`,
                      }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Memory Types Breakdown */}
          <div className="p-6 rounded-2xl bg-white border border-slate-200 shadow-xs">
            <h3 className="text-base font-bold text-slate-900 mb-1">Persistent Memory Index</h3>
            <p className="text-xs text-slate-500 mb-4">Indexed categories in Hindsight banks</p>

            <div className="grid grid-cols-2 gap-2 text-xs">
              {analytics?.breakdowns.memoriesByType?.map((mem) => (
                <div
                  key={mem.memory_type}
                  className="p-3 rounded-xl bg-slate-50 border border-slate-200/60 flex flex-col justify-between"
                >
                  <span className="text-slate-500 capitalize">{mem.memory_type}</span>
                  <span className="text-lg font-bold text-indigo-700 mt-1">{mem.count}</span>
                </div>
              ))}
            </div>

            <div className="mt-4 pt-4 border-t border-slate-100">
              <button
                onClick={() => onNavigate('memories')}
                className="w-full py-2 px-3 rounded-xl bg-slate-100 hover:bg-slate-200/70 text-slate-700 font-semibold text-xs flex items-center justify-center gap-2 transition-colors"
              >
                <BrainCircuit className="w-4 h-4 text-purple-600" />
                <span>Explore Memory Insights & Logs</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
