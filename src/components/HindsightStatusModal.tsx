import React, { useState } from 'react';
import {
  X,
  Server,
  CheckCircle2,
  AlertTriangle,
  Copy,
  Check,
  ExternalLink,
  Terminal,
  ShieldCheck,
  RefreshCw,
  Database,
  Layers,
} from 'lucide-react';
import type { HindsightStatus } from '../types';

interface HindsightStatusModalProps {
  isOpen: boolean;
  onClose: () => void;
  status: HindsightStatus | null;
  onRefresh: () => void;
}

export const HindsightStatusModal: React.FC<HindsightStatusModalProps> = ({
  isOpen,
  onClose,
  status,
  onRefresh,
}) => {
  const [copied, setCopied] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);

  if (!isOpen) return null;

  const dockerCommand =
    status?.setupGuide?.dockerCommand ||
    'docker run --rm -it -p 8888:8888 -p 9999:9999 -e HINDSIGHT_API_LLM_API_KEY=$GEMINI_API_KEY -v $HOME/.hindsight-docker:/home/hindsight/.pg0 ghcr.io/vectorize-io/hindsight:latest';

  const handleCopy = () => {
    navigator.clipboard.writeText(dockerCommand);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleRefreshClick = async () => {
    setIsRefreshing(true);
    try {
      await onRefresh();
    } finally {
      setIsRefreshing(false);
    }
  };

  const isConnected = status?.connected ?? false;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-2xl overflow-hidden">
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/70">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-blue-600/10 text-blue-600 flex items-center justify-center">
              <Server className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900">
                Hindsight by Vectorize – Diagnostics & Architecture
              </h2>
              <p className="text-xs text-slate-500">
                Official Persistent Memory Layer for AI Agents
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 space-y-5 max-h-[80vh] overflow-y-auto">
          {/* Status Banner */}
          <div
            className={`p-4 rounded-xl border flex items-start gap-3.5 ${
              isConnected
                ? 'bg-emerald-50/80 border-emerald-200 text-emerald-900'
                : 'bg-amber-50/80 border-amber-200 text-amber-900'
            }`}
          >
            {isConnected ? (
              <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
            ) : (
              <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
            )}
            <div className="text-xs space-y-1">
              <div className="font-bold text-sm">
                {isConnected
                  ? `Hindsight Server Online (Version: ${status?.apiVersion || '0.8.2'})`
                  : 'Hindsight Server Offline (Running on Embedded Fallback Engine)'}
              </div>
              <p className="text-slate-600 leading-relaxed">
                {isConnected
                  ? `Connected to Hindsight at ${status?.baseUrl}. Agent retain and recall operations are being directly indexed in Hindsight memory banks.`
                  : `Could not reach Hindsight at ${status?.baseUrl || 'http://localhost:8888'}. SupportMind seamlessly continues operating via its built-in SQLite persistence engine, ensuring zero downtime while allowing you to start Hindsight Docker at any time.`}
              </p>
            </div>
          </div>

          {/* Configuration Grid */}
          <div className="grid grid-cols-2 gap-3 text-xs">
            <div className="p-3 rounded-lg border border-slate-200 bg-slate-50/50 space-y-1">
              <span className="text-slate-400 font-medium">Hindsight Endpoint URL</span>
              <p className="font-mono text-slate-800 font-semibold truncate">
                {status?.baseUrl || 'http://localhost:8888'}
              </p>
            </div>
            <div className="p-3 rounded-lg border border-slate-200 bg-slate-50/50 space-y-1">
              <span className="text-slate-400 font-medium">Customer Memory Scope</span>
              <p className="font-mono text-emerald-600 font-semibold">
                supportmind-cust-{'{id}'}
              </p>
            </div>
            <div className="p-3 rounded-lg border border-slate-200 bg-slate-50/50 space-y-1">
              <span className="text-slate-400 font-medium">Total Stored Memories</span>
              <p className="text-slate-800 font-semibold text-sm">
                {status?.stats?.totalMemoriesStored ?? 0} memories
              </p>
            </div>
            <div className="p-3 rounded-lg border border-slate-200 bg-slate-50/50 space-y-1">
              <span className="text-slate-400 font-medium">Multi-Way Search</span>
              <p className="text-indigo-600 font-semibold">Semantic + Temporal + Graph</p>
            </div>
          </div>

          {/* Quick Setup for Local Hindsight Docker */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="font-bold text-slate-800 flex items-center gap-1.5">
                <Terminal className="w-4 h-4 text-slate-600" />
                Run Hindsight in Docker (Single Command)
              </span>
              <a
                href="https://hindsight.vectorize.io/"
                target="_blank"
                rel="noreferrer"
                className="text-blue-600 hover:text-blue-700 flex items-center gap-1 text-[11px] font-medium"
              >
                Docs <ExternalLink className="w-3 h-3" />
              </a>
            </div>

            <div className="relative group">
              <pre className="p-3.5 rounded-xl bg-slate-900 text-slate-200 text-xs font-mono overflow-x-auto border border-slate-800 whitespace-pre-wrap leading-relaxed">
                {dockerCommand}
              </pre>
              <button
                onClick={handleCopy}
                className="absolute top-2.5 right-2.5 px-2.5 py-1 rounded-md bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs flex items-center gap-1.5 transition-colors shadow"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copied ? 'Copied' : 'Copy'}</span>
              </button>
            </div>
          </div>

          {/* Architectural Notes */}
          <div className="p-4 rounded-xl border border-blue-100 bg-blue-50/40 text-xs space-y-2 text-slate-700">
            <div className="flex items-center gap-2 font-bold text-blue-900">
              <ShieldCheck className="w-4 h-4 text-blue-600" />
              <span>Strict Customer Bank Isolation Policy</span>
            </div>
            <p className="leading-relaxed">
              Every customer profile is bound to an independent memory bank in Hindsight (e.g.{' '}
              <code className="text-blue-800 font-mono">supportmind-cust-alex_01</code>). Facts, hardware models,
              and complaint histories belonging to Alex Rivera are strictly physically isolated from Elena Rostova or
              Marcus Chen.
            </p>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-3.5 border-t border-slate-100 bg-slate-50 flex items-center justify-between">
          <div className="text-[11px] text-slate-400">
            Last checked: {status?.lastChecked ? new Date(status.lastChecked).toLocaleTimeString() : 'Never'}
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handleRefreshClick}
              disabled={isRefreshing}
              className="px-3 py-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-xs font-semibold text-slate-700 flex items-center gap-1.5 transition-colors disabled:opacity-50"
            >
              <RefreshCw className={`w-3.5 h-3.5 text-slate-500 ${isRefreshing ? 'animate-spin' : ''}`} />
              <span>Test Connection</span>
            </button>
            <button
              onClick={onClose}
              className="px-4 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold shadow-sm transition-colors"
            >
              Done
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
