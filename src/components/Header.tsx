import React from 'react';
import {
  Users,
  Sparkles,
  RefreshCw,
  Cpu,
  Database,
  CheckCircle2,
} from 'lucide-react';
import type { Customer, HindsightStatus } from '../types';

interface HeaderProps {
  activeTab: string;
  customers: Customer[];
  selectedCustomerId: string;
  onSelectCustomer: (id: string) => void;
  hindsightStatus: HindsightStatus | null;
  onRefreshHindsight: () => void;
  onSeedSampleData: () => void;
  isSeeding: boolean;
  onOpenHindsightModal: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  activeTab,
  customers,
  selectedCustomerId,
  onSelectCustomer,
  hindsightStatus,
  onSeedSampleData,
  isSeeding,
  onOpenHindsightModal,
}) => {
  const titles: Record<string, { title: string; subtitle: string }> = {
    overview: {
      title: 'Support Intelligence Dashboard',
      subtitle: 'Real-time support operations powered by persistent memory analytics',
    },
    chat: {
      title: 'Customer Support Intelligence Chat',
      subtitle: 'Live conversation powered by Hindsight retain/recall and Gemini reasoning',
    },
    comparison: {
      title: 'Before & After Memory Comparison',
      subtitle: 'Side-by-side demonstration: Standard generic bot vs. Hindsight-powered memory agent',
    },
    customers: {
      title: 'Customer Directory & Memory Profiles',
      subtitle: 'Customer isolations, persistent memory scopes, and technical environment history',
    },
    tickets: {
      title: 'Smart Support Ticket Management',
      subtitle: 'Track issues, assign priorities, and auto-retain resolutions into memory',
    },
    memories: {
      title: 'Hindsight Memory Insights & Retain/Recall Lab',
      subtitle: 'Inspect retained facts, test multi-strategy recall queries, and audit logs',
    },
    settings: {
      title: 'System Settings & Hindsight Diagnostics',
      subtitle: 'Configure Hindsight instance, Docker instructions, and sample datasets',
    },
  };

  const current = titles[activeTab] || {
    title: 'SupportMind Agent',
    subtitle: 'Hindsight Persistent Memory Layer',
  };

  const selectedCustomer = customers.find(c => c.id === selectedCustomerId);

  return (
    <header className="h-16 border-b border-slate-200 bg-white/90 backdrop-blur-md px-6 flex items-center justify-between z-10">
      <div>
        <h1 className="text-lg font-bold text-slate-900 tracking-tight flex items-center gap-2">
          {current.title}
        </h1>
        <p className="text-xs text-slate-500">{current.subtitle}</p>
      </div>

      <div className="flex items-center gap-3">
        {/* Customer Context Selector */}
        <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 shadow-sm">
          <Users className="w-4 h-4 text-slate-400" />
          <div className="text-xs">
            <span className="text-slate-400 mr-1.5 font-medium">Active Customer:</span>
            <select
              value={selectedCustomerId}
              onChange={(e) => onSelectCustomer(e.target.value)}
              className="font-semibold text-slate-800 bg-transparent border-none focus:outline-none cursor-pointer pr-1 text-xs"
            >
              {customers.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name} ({c.company || 'Personal'})
                </option>
              ))}
            </select>
          </div>
          {selectedCustomer?.plan && (
            <span className="text-[10px] px-1.5 py-0.5 rounded font-bold bg-blue-50 text-blue-700 border border-blue-200">
              {selectedCustomer.plan}
            </span>
          )}
        </div>

        {/* Engine Pills */}
        <div className="hidden lg:flex items-center gap-2">
          <button
            onClick={onOpenHindsightModal}
            className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border text-xs font-medium transition-all ${
              hindsightStatus?.connected
                ? 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100'
                : 'bg-amber-50 text-amber-800 border-amber-200 hover:bg-amber-100'
            }`}
            title="Click to view Hindsight status & Docker setup"
          >
            <Database className="w-3.5 h-3.5 text-blue-600" />
            <span>Memory:</span>
            <span className="font-semibold">
              {hindsightStatus?.connected ? 'Hindsight Live' : 'Hindsight Local'}
            </span>
          </button>

          <div className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border border-slate-200 bg-slate-50 text-xs font-medium text-slate-700">
            <Cpu className="w-3.5 h-3.5 text-purple-600" />
            <span>Gemini 3.8 Flash</span>
            <CheckCircle2 className="w-3 h-3 text-emerald-500" />
          </div>
        </div>

        {/* Re-seed Sample Data */}
        <button
          onClick={onSeedSampleData}
          disabled={isSeeding}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-slate-700 bg-white hover:bg-slate-50 border border-slate-200 shadow-sm active:scale-95 transition-all disabled:opacity-50"
          title="Reset to 5 realistic scenarios (Internet, Billing, Delayed shipment, Linux troubleshooting, Resolved complaint)"
        >
          <RefreshCw className={`w-3.5 h-3.5 text-slate-500 ${isSeeding ? 'animate-spin' : ''}`} />
          <span className="hidden sm:inline">Reset Demo Data</span>
        </button>
      </div>
    </header>
  );
};
