import React from 'react';
import {
  LayoutDashboard,
  MessageSquare,
  Users,
  Ticket,
  BrainCircuit,
  SplitSquareVertical,
  Sliders,
  Sparkles,
  Server,
  Activity,
  CheckCircle2,
  AlertTriangle,
} from 'lucide-react';
import type { HindsightStatus } from '../types';

interface SidebarProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
  hindsightStatus: HindsightStatus | null;
  onOpenHindsightModal: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeTab,
  onTabChange,
  hindsightStatus,
  onOpenHindsightModal,
}) => {
  const navItems = [
    { id: 'overview', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'chat', label: 'AI Support Chat', icon: MessageSquare, badge: 'Live' },
    { id: 'comparison', label: 'Memory Comparison', icon: SplitSquareVertical, highlight: true },
    { id: 'customers', label: 'Customers', icon: Users },
    { id: 'tickets', label: 'Support Tickets', icon: Ticket },
    { id: 'memories', label: 'Memory Insights', icon: BrainCircuit },
    { id: 'settings', label: 'Settings & Engine', icon: Sliders },
  ];

  const isConnected = hindsightStatus?.connected ?? false;

  return (
    <aside className="w-64 bg-slate-900 border-r border-slate-800 flex flex-col justify-between shrink-0 select-none">
      <div>
        {/* Brand Header */}
        <div className="p-5 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-blue-600 via-indigo-600 to-purple-500 flex items-center justify-center shadow-lg shadow-blue-500/25">
              <Sparkles className="w-5 h-5 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="font-bold text-white tracking-tight text-lg">SupportMind</span>
              </div>
              <p className="text-xs text-slate-400 font-medium">Hindsight Persistent AI</p>
            </div>
          </div>
        </div>

        {/* Navigation Links */}
        <nav className="p-3 space-y-1">
          <div className="px-3 py-1.5 text-[11px] font-semibold tracking-wider text-slate-400 uppercase">
            Workspace
          </div>
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => onTabChange(item.id)}
                className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-lg text-sm font-medium transition-all ${
                  isActive
                    ? 'bg-blue-600 text-white shadow-md shadow-blue-600/30'
                    : 'text-slate-300 hover:text-white hover:bg-slate-800/70'
                }`}
              >
                <div className="flex items-center gap-3">
                  <Icon className={`w-4 h-4 ${isActive ? 'text-white' : 'text-slate-400'}`} />
                  <span>{item.label}</span>
                </div>
                {item.badge && (
                  <span className="px-1.5 py-0.5 text-[10px] uppercase tracking-wide font-bold rounded bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                    {item.badge}
                  </span>
                )}
                {item.highlight && !isActive && (
                  <span className="w-2 h-2 rounded-full bg-indigo-400 animate-pulse" />
                )}
              </button>
            );
          })}
        </nav>
      </div>

      {/* Memory Layer Status Box */}
      <div className="p-3 m-3 rounded-xl bg-slate-800/80 border border-slate-700/60 text-xs">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-1.5 font-semibold text-slate-200">
            <Server className="w-3.5 h-3.5 text-blue-400" />
            <span>Memory Layer</span>
          </div>
          <button
            onClick={onOpenHindsightModal}
            className="text-[11px] text-blue-400 hover:text-blue-300 hover:underline"
          >
            Diagnostics
          </button>
        </div>

        <div className="space-y-1.5 text-slate-400">
          <div className="flex items-center justify-between">
            <span>Provider:</span>
            <span className="font-medium text-slate-200">Hindsight (Vectorize)</span>
          </div>
          <div className="flex items-center justify-between">
            <span>Status:</span>
            <span
              className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-semibold ${
                isConnected
                  ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
                  : 'bg-amber-500/15 text-amber-300 border border-amber-500/30'
              }`}
            >
              {isConnected ? (
                <>
                  <CheckCircle2 className="w-2.5 h-2.5" />
                  Live v{hindsightStatus?.apiVersion || '0.8.2'}
                </>
              ) : (
                <>
                  <Activity className="w-2.5 h-2.5" />
                  Local Engine Active
                </>
              )}
            </span>
          </div>
          <div className="flex items-center justify-between">
            <span>Customer Isolation:</span>
            <span className="text-emerald-400 font-mono text-[10px]">Per-Bank Scope</span>
          </div>
        </div>

        <button
          onClick={onOpenHindsightModal}
          className="mt-3 w-full py-1.5 px-2 bg-slate-700/80 hover:bg-slate-700 rounded-lg text-slate-200 text-[11px] font-medium flex items-center justify-center gap-1.5 transition-colors"
        >
          {isConnected ? (
            <>
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
              <span>Hindsight Connected</span>
            </>
          ) : (
            <>
              <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />
              <span>Connect Live Hindsight</span>
            </>
          )}
        </button>
      </div>
    </aside>
  );
};
