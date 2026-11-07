import React, { useState, useEffect } from 'react';
import {
  SplitSquareVertical,
  Sparkles,
  BrainCircuit,
  Bot,
  AlertTriangle,
  CheckCircle2,
  Clock,
  ThumbsUp,
  ThumbsDown,
  ArrowRight,
  RefreshCw,
  Sliders,
  ShieldAlert,
  Zap,
} from 'lucide-react';
import { api } from '../services/api';
import type { Customer, MemoryItem } from '../types';

interface MemoryComparisonProps {
  customers: Customer[];
  selectedCustomerId: string;
  onSelectCustomer: (id: string) => void;
  onNavigate: (tab: string) => void;
}

export const MemoryComparison: React.FC<MemoryComparisonProps> = ({
  customers,
  selectedCustomerId,
  onSelectCustomer,
  onNavigate,
}) => {
  const [query, setQuery] = useState('My connection is disconnecting again.');
  const [loading, setLoading] = useState(false);
  const [comparisonResult, setComparisonResult] = useState<{
    customer: Customer;
    query: string;
    recalledMemories: MemoryItem[];
    memorySource: string;
    comparison: {
      query: string;
      withoutMemory: {
        response: string;
        characteristics: string[];
        tone: string;
        customerSentimentScore: number;
      };
      withMemory: {
        response: string;
        characteristics: string[];
        tone: string;
        customerSentimentScore: number;
        recalledMemoriesUsed: string[];
      };
      comparisonAnalysis: {
        keyDifferences: string[];
        timeSavedMinutes: number;
        frustrationPointsAvoided: string[];
        summary: string;
      };
    };
  } | null>(null);

  const presetScenarios = [
    {
      customerId: 'cust_alex_01',
      title: 'Repeated Internet Disconnections',
      label: 'Alex Rivera (TP-Link Router)',
      query: 'My connection is disconnecting again.',
      highlight: 'Router model recall & follow-up on previous DNS fix',
    },
    {
      customerId: 'cust_elena_02',
      title: 'Payment & Subscription Failure',
      label: 'Elena Rostova (Apex Retail)',
      query: 'Our subscription renewal failed again.',
      highlight: 'Corporate card velocity limit & VAT invoice routing',
    },
    {
      customerId: 'cust_marcus_03',
      title: 'Delayed Hardware Replacement',
      label: 'Marcus Chen (Velocity Logistics)',
      query: 'Where is my pending hardware shipment?',
      highlight: 'Tracking #VL-88291 FedEx Memphis hub delay status',
    },
    {
      customerId: 'cust_sarah_04',
      title: 'Linux Production Webhook Timeout',
      label: 'Sarah Jenkins (HealthTech Labs)',
      query: 'Webhook connection timed out on TLS handshake.',
      highlight: 'AWS MTU 1420 packet size & strictly providing cURL commands',
    },
    {
      customerId: 'cust_david_05',
      title: 'Resolved Complaint Follow-Up',
      label: 'David Okafor (Solaria Solar)',
      query: 'Checking if my Solar Inverter readings look normal.',
      highlight: 'Recalls Oct 28 Phase 1 CT clamp fix & firmware 4.9.1',
    },
  ];

  useEffect(() => {
    // Run comparison on initial mount or when customer changes
    runComparison(selectedCustomerId, query);
  }, [selectedCustomerId]);

  const runComparison = async (custId: string, testQuery: string) => {
    try {
      setLoading(true);
      const res = await api.runComparison(custId, testQuery);
      setComparisonResult(res);
    } catch (err) {
      console.error('Failed to run comparison:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSelectScenario = (scenario: (typeof presetScenarios)[0]) => {
    onSelectCustomer(scenario.customerId);
    setQuery(scenario.query);
    runComparison(scenario.customerId, scenario.query);
  };

  const currentCustomer = customers.find(c => c.id === selectedCustomerId) || customers[0];

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8">
      {/* Page Header */}
      <div className="space-y-2">
        <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-blue-50 text-blue-700 border border-blue-200 text-xs font-semibold">
          <SplitSquareVertical className="w-3.5 h-3.5 text-blue-600" />
          <span>Interactive Benchmark & Live Demonstration</span>
        </div>
        <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight sm:text-3xl">
          Side-by-Side: Standard Support vs. Hindsight Memory
        </h1>
        <p className="text-sm text-slate-500 max-w-3xl leading-relaxed">
          See the tangible difference persistent memory makes. Below, the same customer sends the exact same
          troubleshooting query to a traditional stateless chatbot versus SupportMind powered by Hindsight.
        </p>
      </div>

      {/* Preset Scenario Selector Bar */}
      <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold text-slate-700 uppercase tracking-wider">
            Choose a Real-World Customer Scenario:
          </span>
          <span className="text-xs text-slate-400">Click any card to load customer context & query</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-2.5">
          {presetScenarios.map((sc, idx) => {
            const isSelected = sc.customerId === selectedCustomerId && sc.query === query;
            return (
              <button
                key={idx}
                onClick={() => handleSelectScenario(sc)}
                className={`p-3 rounded-xl text-left border text-xs transition-all ${
                  isSelected
                    ? 'bg-blue-50/80 border-blue-400 shadow-sm ring-1 ring-blue-400'
                    : 'bg-slate-50/70 border-slate-200 hover:bg-white hover:border-slate-300'
                }`}
              >
                <div className="font-bold text-slate-900 truncate">{sc.title}</div>
                <div className="text-[11px] text-blue-600 font-medium truncate mt-0.5">{sc.label}</div>
                <div className="text-[10px] text-slate-500 line-clamp-2 mt-1 leading-snug">
                  {sc.highlight}
                </div>
              </button>
            );
          })}
        </div>

        {/* Custom Query Input */}
        <div className="pt-2 flex items-center gap-3">
          <div className="flex-1 relative">
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Or test a custom customer query (e.g. 'My connection is disconnecting again.')..."
              className="w-full px-4 py-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500 text-xs text-slate-800 placeholder-slate-400"
            />
          </div>
          <button
            onClick={() => runComparison(selectedCustomerId, query)}
            disabled={loading || !query.trim()}
            className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs flex items-center gap-2 shadow-sm transition-all disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            <span>Run Comparison</span>
          </button>
        </div>
      </div>

      {/* Side-by-Side Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Scenario 1: Without Memory */}
        <div className="rounded-2xl bg-white border border-slate-200 shadow-xs overflow-hidden flex flex-col justify-between">
          <div>
            {/* Header */}
            <div className="p-5 border-b border-slate-100 bg-slate-50/70 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-slate-200 text-slate-700 flex items-center justify-center font-bold">
                  <Bot className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 text-sm">Scenario 1: Without Memory</h3>
                  <p className="text-[11px] text-slate-500">Traditional Stateless AI Support Chatbot</p>
                </div>
              </div>
              <span className="text-[11px] font-bold px-2.5 py-1 rounded-full bg-slate-100 text-slate-600 border border-slate-200">
                Context: Zero
              </span>
            </div>

            {/* Prompt & Content */}
            <div className="p-6 space-y-4">
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/80 text-xs">
                <span className="font-semibold text-slate-500 block mb-1">Customer Query:</span>
                <p className="font-medium text-slate-800">&ldquo;{comparisonResult?.query || query}&rdquo;</p>
              </div>

              {/* Bot Response Box */}
              <div className="p-4 rounded-xl border border-amber-200 bg-amber-50/30 text-xs text-slate-800 leading-relaxed space-y-2">
                <div className="flex items-center gap-1.5 text-amber-700 font-bold text-[11px] uppercase tracking-wider">
                  <AlertTriangle className="w-3.5 h-3.5" />
                  <span>Generic Repetitive Response</span>
                </div>
                <div className="whitespace-pre-wrap font-medium">
                  {loading ? (
                    <div className="py-4 text-center text-slate-400">Generating generic response...</div>
                  ) : (
                    comparisonResult?.comparison.withoutMemory.response
                  )}
                </div>
              </div>

              {/* Characteristics List */}
              <div className="space-y-2 text-xs">
                <span className="font-bold text-slate-700 block">Flaws & Frustration Points:</span>
                {comparisonResult?.comparison.withoutMemory.characteristics.map((c, i) => (
                  <div key={i} className="flex items-start gap-2 text-slate-600">
                    <span className="text-red-500 font-bold">✕</span>
                    <span>{c}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Footer Sentiment */}
          <div className="p-4 border-t border-slate-100 bg-slate-50/50 flex items-center justify-between text-xs">
            <span className="text-slate-500 font-medium">Customer Sentiment Score:</span>
            <div className="flex items-center gap-1.5">
              <ThumbsDown className="w-3.5 h-3.5 text-red-500" />
              <span className="font-bold text-red-600">
                {comparisonResult?.comparison.withoutMemory.customerSentimentScore || 38}/100
              </span>
            </div>
          </div>
        </div>

        {/* Scenario 2: With Hindsight Memory */}
        <div className="rounded-2xl bg-white border-2 border-purple-200 shadow-md overflow-hidden flex flex-col justify-between">
          <div>
            {/* Header */}
            <div className="p-5 border-b border-purple-100 bg-gradient-to-r from-purple-50/80 via-blue-50/50 to-white flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-purple-600 to-blue-600 text-white flex items-center justify-center font-bold shadow-xs">
                  <BrainCircuit className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 text-sm">Scenario 2: With Hindsight Memory</h3>
                  <p className="text-[11px] text-purple-700 font-medium">
                    SupportMind Intelligent Agent · Customer Isolated Bank
                  </p>
                </div>
              </div>
              <span className="text-[11px] font-bold px-2.5 py-1 rounded-full bg-purple-100 text-purple-800 border border-purple-200">
                Persistent Memory Active
              </span>
            </div>

            {/* Content */}
            <div className="p-6 space-y-4">
              <div className="p-3 rounded-xl bg-purple-50/40 border border-purple-100 text-xs">
                <span className="font-semibold text-purple-700 block mb-1">
                  Recalled Facts from Bank (supportmind-cust-{currentCustomer.id.replace('cust_', '')}):
                </span>
                <div className="space-y-1">
                  {comparisonResult?.recalledMemories?.map((mem, mIdx) => (
                    <div key={mIdx} className="text-slate-700 font-medium flex items-start gap-1.5">
                      <span className="text-purple-600 font-bold">•</span>
                      <span>{mem.text}</span>
                    </div>
                  )) || <span className="text-slate-400">Loading recalled memories...</span>}
                </div>
              </div>

              {/* Bot Response Box */}
              <div className="p-4 rounded-xl border border-emerald-200 bg-emerald-50/40 text-xs text-slate-800 leading-relaxed space-y-2">
                <div className="flex items-center gap-1.5 text-emerald-800 font-bold text-[11px] uppercase tracking-wider">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Personalized & Context-Aware Agent Response</span>
                </div>
                <div className="whitespace-pre-wrap font-medium">
                  {loading ? (
                    <div className="py-4 text-center text-purple-600">
                      Recalling Hindsight memories and synthesizing response...
                    </div>
                  ) : (
                    comparisonResult?.comparison.withMemory.response
                  )}
                </div>
              </div>

              {/* Characteristics List */}
              <div className="space-y-2 text-xs">
                <span className="font-bold text-slate-700 block">Immediate Value & Intelligence:</span>
                {comparisonResult?.comparison.withMemory.characteristics.map((c, i) => (
                  <div key={i} className="flex items-start gap-2 text-slate-700">
                    <span className="text-emerald-500 font-bold">✓</span>
                    <span className="font-medium">{c}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Footer Sentiment */}
          <div className="p-4 border-t border-purple-100 bg-purple-50/30 flex items-center justify-between text-xs">
            <span className="text-slate-600 font-medium">Customer Sentiment Score:</span>
            <div className="flex items-center gap-1.5">
              <ThumbsUp className="w-3.5 h-3.5 text-emerald-600" />
              <span className="font-bold text-emerald-700">
                {comparisonResult?.comparison.withMemory.customerSentimentScore || 95}/100 (+57% Lift)
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Summary Impact Analysis Bar */}
      {comparisonResult?.comparison.comparisonAnalysis && (
        <div className="p-6 rounded-2xl bg-gradient-to-br from-slate-900 to-indigo-950 text-white shadow-xl space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <Zap className="w-5 h-5 text-amber-400" />
                <span>Executive Impact Analysis</span>
              </h3>
              <p className="text-xs text-slate-300 mt-0.5">
                {comparisonResult.comparison.comparisonAnalysis.summary}
              </p>
            </div>
            <div className="flex items-center gap-4 bg-white/10 px-4 py-2 rounded-xl border border-white/10 shrink-0">
              <Clock className="w-5 h-5 text-blue-400" />
              <div>
                <span className="text-[10px] uppercase font-bold text-slate-300 block">Avg Time Saved</span>
                <span className="text-lg font-black text-white">
                  {comparisonResult.comparison.comparisonAnalysis.timeSavedMinutes} Minutes / Ticket
                </span>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs pt-2 border-t border-slate-800">
            <div>
              <span className="font-bold text-indigo-300 block mb-2 uppercase tracking-wider text-[11px]">
                Frustrating Steps Eliminated:
              </span>
              <ul className="space-y-1.5 text-slate-300">
                {comparisonResult.comparison.comparisonAnalysis.frustrationPointsAvoided.map((f, idx) => (
                  <li key={idx} className="flex items-center gap-2">
                    <span className="text-amber-400">•</span>
                    <span>{f}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div>
              <span className="font-bold text-emerald-300 block mb-2 uppercase tracking-wider text-[11px]">
                Key Conversational Advantages:
              </span>
              <ul className="space-y-1.5 text-slate-300">
                {comparisonResult.comparison.comparisonAnalysis.keyDifferences.map((d, idx) => (
                  <li key={idx} className="flex items-center gap-2">
                    <span className="text-emerald-400">•</span>
                    <span>{d}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
