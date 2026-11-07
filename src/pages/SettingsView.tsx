import React, { useState } from 'react';
import {
  Server,
  Cpu,
  Database,
  Terminal,
  RefreshCw,
  CheckCircle2,
  AlertTriangle,
  Copy,
  Check,
  ExternalLink,
  ShieldCheck,
  RotateCcw,
} from 'lucide-react';
import type { HindsightStatus } from '../types';

interface SettingsViewProps {
  hindsightStatus: HindsightStatus | null;
  onRefreshHindsight: () => void;
  onSeedSampleData: () => void;
  isSeeding: boolean;
  onOpenHindsightModal: () => void;
}

export const SettingsView: React.FC<SettingsViewProps> = ({
  hindsightStatus,
  onRefreshHindsight,
  onSeedSampleData,
  isSeeding,
  onOpenHindsightModal,
}) => {
  const [copiedDocker, setCopiedDocker] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const dockerCommand =
    hindsightStatus?.setupGuide?.dockerCommand ||
    'docker run --rm -it -p 8888:8888 -p 9999:9999 -e HINDSIGHT_API_LLM_API_KEY=$GEMINI_API_KEY -v $HOME/.hindsight-docker:/home/hindsight/.pg0 ghcr.io/vectorize-io/hindsight:latest';

  const handleCopyDocker = () => {
    navigator.clipboard.writeText(dockerCommand);
    setCopiedDocker(true);
    setTimeout(() => setCopiedDocker(false), 2000);
  };

  const handleTestConnection = async () => {
    setIsRefreshing(true);
    try {
      await onRefreshHindsight();
    } finally {
      setIsRefreshing(false);
    }
  };

  const isConnected = hindsightStatus?.connected ?? false;

  return (
    <div className="p-8 max-w-5xl mx-auto space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
          System Settings & Intelligence Engine
        </h1>
        <p className="text-xs text-slate-500">
          Manage Hindsight persistent memory connections, Gemini models, and sample demo scenarios
        </p>
      </div>

      {/* Engine Status Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {/* Hindsight Status Card */}
        <div className="p-6 rounded-2xl bg-white border border-slate-200 shadow-2xs space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
                <Server className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-bold text-slate-900 text-sm">Hindsight Persistent Memory</h3>
                <p className="text-[11px] text-slate-500">Vectorize Open-Source Agent Memory</p>
              </div>
            </div>
            <span
              className={`px-2 py-0.5 rounded text-[10px] font-bold border ${
                isConnected
                  ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                  : 'bg-amber-50 text-amber-800 border-amber-200'
              }`}
            >
              {isConnected ? 'Connected' : 'Offline (Local Engine)'}
            </span>
          </div>

          <div className="space-y-2 text-xs">
            <div className="flex justify-between py-1 border-b border-slate-100">
              <span className="text-slate-400">Endpoint URL:</span>
              <span className="font-mono text-slate-800 font-semibold truncate max-w-xs">
                {hindsightStatus?.baseUrl || 'http://localhost:8888'}
              </span>
            </div>
            <div className="flex justify-between py-1 border-b border-slate-100">
              <span className="text-slate-400">Version:</span>
              <span className="font-mono text-slate-800">
                {hindsightStatus?.apiVersion || 'Embedded v0.8.2'}
              </span>
            </div>
            <div className="flex justify-between py-1 border-b border-slate-100">
              <span className="text-slate-400">Customer Bank Scope:</span>
              <span className="text-purple-600 font-mono font-medium">Per-Customer Partitioning</span>
            </div>
            <div className="flex justify-between py-1">
              <span className="text-slate-400">Search Strategy:</span>
              <span className="text-slate-700 font-medium">Multi-way (Vector + Keyword + Temporal)</span>
            </div>
          </div>

          <div className="pt-2 flex items-center gap-2">
            <button
              onClick={handleTestConnection}
              disabled={isRefreshing}
              className="flex-1 py-2 px-3 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors disabled:opacity-50"
            >
              <RefreshCw className={`w-3.5 h-3.5 text-slate-500 ${isRefreshing ? 'animate-spin' : ''}`} />
              <span>Test Connection</span>
            </button>
            <button
              onClick={onOpenHindsightModal}
              className="py-2 px-3 rounded-xl bg-blue-50 hover:bg-blue-100 text-blue-700 text-xs font-semibold transition-colors"
            >
              Docker Details
            </button>
          </div>
        </div>

        {/* Gemini API Status Card */}
        <div className="p-6 rounded-2xl bg-white border border-slate-200 shadow-2xs space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center">
                <Cpu className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-bold text-slate-900 text-sm">Gemini AI Model</h3>
                <p className="text-[11px] text-slate-500">Google GenAI Official TypeScript SDK</p>
              </div>
            </div>
            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
              Active
            </span>
          </div>

          <div className="space-y-2 text-xs">
            <div className="flex justify-between py-1 border-b border-slate-100">
              <span className="text-slate-400">Target Model:</span>
              <span className="font-mono text-purple-700 font-bold">gemini-3.8-flash</span>
            </div>
            <div className="flex justify-between py-1 border-b border-slate-100">
              <span className="text-slate-400">Reasoning Engine:</span>
              <span className="text-slate-800 font-medium">Memory-Injected System Instructions</span>
            </div>
            <div className="flex justify-between py-1 border-b border-slate-100">
              <span className="text-slate-400">Key Storage:</span>
              <span className="text-slate-700 font-mono text-[10px]">process.env.GEMINI_API_KEY</span>
            </div>
            <div className="flex justify-between py-1">
              <span className="text-slate-400">Fact Extraction:</span>
              <span className="text-emerald-600 font-medium">Automatic Post-Turn Retain</span>
            </div>
          </div>

          <div className="pt-2">
            <div className="p-3 rounded-xl bg-purple-50/70 border border-purple-200/80 text-[11px] text-purple-900 flex items-start gap-2">
              <ShieldCheck className="w-4 h-4 text-purple-600 shrink-0 mt-0.5" />
              <span>
                Gemini API keys are maintained server-side only and are never exposed to the browser client.
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Docker Command Guide Card */}
      <div className="p-6 rounded-2xl bg-white border border-slate-200 shadow-2xs space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Terminal className="w-5 h-5 text-slate-700" />
            <h3 className="font-bold text-slate-900 text-sm">
              Run Official Hindsight Instance (Docker Container)
            </h3>
          </div>
          <a
            href="https://hindsight.vectorize.io/"
            target="_blank"
            rel="noreferrer"
            className="text-xs text-blue-600 hover:text-blue-700 flex items-center gap-1 font-semibold"
          >
            <span>Hindsight Documentation</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </a>
        </div>

        <p className="text-xs text-slate-600 leading-relaxed">
          To connect a live self-hosted Hindsight memory server on port 8888, run this Docker command in your
          terminal. SupportMind will automatically recognize the live server on its next retain or recall operation.
        </p>

        <div className="relative group">
          <pre className="p-4 rounded-xl bg-slate-900 text-slate-200 text-xs font-mono overflow-x-auto border border-slate-800 whitespace-pre-wrap leading-relaxed">
            {dockerCommand}
          </pre>
          <button
            onClick={handleCopyDocker}
            className="absolute top-3 right-3 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs flex items-center gap-1.5 transition-colors shadow"
          >
            {copiedDocker ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
            <span>{copiedDocker ? 'Copied' : 'Copy Command'}</span>
          </button>
        </div>
      </div>

      {/* Sample Scenarios Reset Card */}
      <div className="p-6 rounded-2xl bg-white border border-slate-200 shadow-2xs space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-bold text-slate-900 text-sm">Reset & Re-seed Realistic Sample Scenarios</h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Re-populates the database and Hindsight memory banks with 5 enterprise demonstration cases:
            </p>
          </div>
          <button
            onClick={onSeedSampleData}
            disabled={isSeeding}
            className="px-4 py-2.5 rounded-xl bg-red-50 hover:bg-red-100 text-red-700 font-semibold text-xs flex items-center gap-2 border border-red-200 transition-all disabled:opacity-50"
          >
            <RotateCcw className={`w-3.5 h-3.5 ${isSeeding ? 'animate-spin' : ''}`} />
            <span>Reset Demo Data</span>
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 text-xs">
          <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/80">
            <span className="font-bold text-slate-800 block">1. Wi-Fi Router Drops</span>
            <span className="text-slate-500 text-[11px] block mt-0.5">Alex Rivera</span>
            <span className="text-[10px] text-purple-600 block mt-1">TP-Link Archer AX50</span>
          </div>

          <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/80">
            <span className="font-bold text-slate-800 block">2. Payment Failures</span>
            <span className="text-slate-500 text-[11px] block mt-0.5">Elena Rostova</span>
            <span className="text-[10px] text-purple-600 block mt-1">Barclays Corporate card</span>
          </div>

          <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/80">
            <span className="font-bold text-slate-800 block">3. Delayed Deliveries</span>
            <span className="text-slate-500 text-[11px] block mt-0.5">Marcus Chen</span>
            <span className="text-[10px] text-purple-600 block mt-1">FedEx Memphis weather</span>
          </div>

          <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/80">
            <span className="font-bold text-slate-800 block">4. Linux Troubleshooting</span>
            <span className="text-slate-500 text-[11px] block mt-0.5">Sarah Jenkins</span>
            <span className="text-[10px] text-purple-600 block mt-1">Ubuntu MTU 1420 cURL</span>
          </div>

          <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/80">
            <span className="font-bold text-slate-800 block">5. Resolved Complaints</span>
            <span className="text-slate-500 text-[11px] block mt-0.5">David Okafor</span>
            <span className="text-[10px] text-purple-600 block mt-1">Inverter CT clamp fix</span>
          </div>
        </div>
      </div>
    </div>
  );
};
