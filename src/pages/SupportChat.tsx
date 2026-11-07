import React, { useState, useEffect, useRef } from 'react';
import {
  Send,
  Sparkles,
  BrainCircuit,
  Clock,
  ChevronDown,
  ChevronUp,
  Ticket,
  CheckCircle2,
  AlertCircle,
  Cpu,
  RefreshCw,
  Plus,
  HelpCircle,
  ExternalLink,
  Laptop,
} from 'lucide-react';
import { api } from '../services/api';
import type { Customer, Conversation, Message, MemoryItem } from '../types';

interface SupportChatProps {
  selectedCustomer: Customer | undefined;
  customers: Customer[];
  onSelectCustomer: (id: string) => void;
  onOpenTicketModalWithContext?: (context: { customerId: string; title: string; description: string }) => void;
  onNavigate: (tab: string) => void;
}

export const SupportChat: React.FC<SupportChatProps> = ({
  selectedCustomer,
  customers,
  onSelectCustomer,
  onOpenTicketModalWithContext,
  onNavigate,
}) => {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [currentConversation, setCurrentConversation] = useState<Conversation | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [expandedMemoryMsgId, setExpandedMemoryMsgId] = useState<string | null>(null);
  const [customerMemories, setCustomerMemories] = useState<MemoryItem[]>([]);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Quick prompt presets tailored to each customer scenario
  const scenarioPrompts: Record<string, string[]> = {
    cust_alex_01: [
      'My connection is disconnecting again.',
      'Did the DNS flush and channel lock help with my TP-Link router?',
      'Can you review why 5GHz Wi-Fi drops on Tuesdays?',
    ],
    cust_elena_02: [
      'Our annual Pro renewal invoice failed again.',
      'Can you send the manual invoice directly to our finance team?',
      'Has the VAT ID NL849201948B01 been added to our account?',
    ],
    cust_marcus_03: [
      'Any update on delayed hardware shipment #VL-88291?',
      'Has FedEx cleared the Memphis depot delay?',
      'We urgently need the fiber optical transceivers by Friday.',
    ],
    cust_sarah_04: [
      'Webhook TLS handshake timed out on Ubuntu 24.04.',
      'Give me the cURL command to verify MTU packet size.',
      'Did you save our AWS VPC network configuration?',
    ],
    cust_david_05: [
      'My Solar Inverter S-400 readings look stable now.',
      'Can you verify if firmware 4.9.1 fixed the CT clamp issue?',
      'Do I need to do any regular calibration on Phase 1?',
    ],
  };

  const defaultPrompts = [
    'My connection is disconnecting again.',
    'I need help checking my account status.',
    'Where is my pending order?',
  ];

  const currentPrompts = (selectedCustomer && scenarioPrompts[selectedCustomer.id]) || defaultPrompts;

  useEffect(() => {
    if (selectedCustomer) {
      loadCustomerConversations(selectedCustomer.id);
      loadCustomerMemories(selectedCustomer.id);
    }
  }, [selectedCustomer?.id]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const loadCustomerConversations = async (customerId: string) => {
    try {
      const res = await api.getConversations(customerId);
      setConversations(res.conversations);
      if (res.conversations.length > 0) {
        selectConversation(res.conversations[0].id);
      } else {
        createNewConversation(customerId);
      }
    } catch (err) {
      console.error('Failed to load conversations:', err);
    }
  };

  const loadCustomerMemories = async (customerId: string) => {
    try {
      const res = await api.getMemories(customerId);
      setCustomerMemories(res.memories);
    } catch (err) {
      console.error('Failed to load customer memories:', err);
    }
  };

  const selectConversation = async (convId: string) => {
    try {
      const res = await api.getConversation(convId);
      setCurrentConversation(res.conversation);
      setMessages(res.messages);
    } catch (err) {
      console.error('Failed to load conversation details:', err);
    }
  };

  const createNewConversation = async (customerId: string) => {
    try {
      const title = `Support Session #${Math.floor(1000 + Math.random() * 9000)}`;
      const res = await api.createConversation({ customerId, title });
      setConversations(prev => [res.conversation, ...prev]);
      setCurrentConversation(res.conversation);
      setMessages([]);
    } catch (err) {
      console.error('Failed to create conversation:', err);
    }
  };

  const handleSendMessage = async (e?: React.FormEvent, customText?: string) => {
    if (e) e.preventDefault();
    const textToSend = (customText || inputText).trim();
    if (!textToSend || !currentConversation || isSending) return;

    setIsSending(true);
    setInputText('');

    // Optimistic UI for customer message
    const tempUserMsg: Message = {
      id: `temp_${Date.now()}`,
      conversation_id: currentConversation.id,
      customer_id: currentConversation.customer_id,
      sender: 'customer',
      content: textToSend,
      created_at: new Date().toISOString(),
    };
    setMessages(prev => [...prev, tempUserMsg]);

    try {
      const res = await api.sendMessage(currentConversation.id, textToSend);

      // Replace optimistic message and append agent response
      setMessages(prev => {
        const filtered = prev.filter(m => m.id !== tempUserMsg.id);
        return [...filtered, res.customerMessage, res.agentResponse];
      });

      // Expand memory dropdown automatically on new agent response to highlight memory recall!
      if (res.agentResponse.retrieved_memories && res.agentResponse.retrieved_memories.length > 0) {
        setExpandedMemoryMsgId(res.agentResponse.id);
      }

      // Refresh customer memory list in sidebar
      if (selectedCustomer) {
        loadCustomerMemories(selectedCustomer.id);
      }
    } catch (err) {
      console.error('Error sending message:', err);
      // Append error message from agent
      const errorAgentMsg: Message = {
        id: `err_${Date.now()}`,
        conversation_id: currentConversation.id,
        customer_id: currentConversation.customer_id,
        sender: 'agent',
        content: 'I apologize, an unexpected error occurred while communicating with the intelligence service. Please try again.',
        created_at: new Date().toISOString(),
      };
      setMessages(prev => [...prev, errorAgentMsg]);
    } finally {
      setIsSending(false);
    }
  };

  const handleCreateTicketFromChat = () => {
    if (!selectedCustomer || !currentConversation) return;
    const lastUserMsg = [...messages].reverse().find(m => m.sender === 'customer')?.content || 'Customer Inquiry';
    if (onOpenTicketModalWithContext) {
      onOpenTicketModalWithContext({
        customerId: selectedCustomer.id,
        title: `Issue: ${lastUserMsg.slice(0, 50)}...`,
        description: `Customer ${selectedCustomer.name} reported:\n"${lastUserMsg}"\n\nGenerated from Chat Session #${currentConversation.id}`,
      });
    } else {
      onNavigate('tickets');
    }
  };

  return (
    <div className="h-[calc(100vh-4rem)] flex overflow-hidden bg-slate-50">
      {/* Left Chat Area (Main) */}
      <div className="flex-1 flex flex-col h-full bg-white border-r border-slate-200">
        {/* Chat Header */}
        <div className="px-6 py-3.5 border-b border-slate-200 bg-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <img
              src={selectedCustomer?.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150'}
              alt={selectedCustomer?.name}
              className="w-10 h-10 rounded-full object-cover border border-slate-200"
            />
            <div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-slate-900 text-sm">{selectedCustomer?.name}</span>
                <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-blue-50 text-blue-700 border border-blue-200">
                  {selectedCustomer?.company}
                </span>
                <span className="text-[10px] px-1.5 py-0.5 rounded font-mono bg-purple-50 text-purple-700 border border-purple-200">
                  Bank: supportmind-cust-{selectedCustomer?.id.replace('cust_', '')}
                </span>
              </div>
              <p className="text-xs text-slate-500 truncate max-w-md">
                {selectedCustomer?.device_info || 'Standard Technical Profile'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleCreateTicketFromChat}
              className="px-3 py-1.5 rounded-lg border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-semibold flex items-center gap-1.5 transition-colors shadow-2xs"
              title="Convert current conversation into a support ticket"
            >
              <Ticket className="w-3.5 h-3.5 text-blue-600" />
              <span>Convert to Ticket</span>
            </button>
            <button
              onClick={() => selectedCustomer && createNewConversation(selectedCustomer.id)}
              className="px-3 py-1.5 rounded-lg bg-blue-50 hover:bg-blue-100 text-blue-700 text-xs font-semibold flex items-center gap-1.5 transition-colors"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>New Session</span>
            </button>
          </div>
        </div>

        {/* Message Thread */}
        <div className="flex-1 overflow-y-auto p-6 space-y-5 bg-gradient-to-b from-slate-50/50 to-white">
          {messages.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center p-8 max-w-md mx-auto">
              <div className="w-14 h-14 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center mb-4 shadow-sm">
                <BrainCircuit className="w-7 h-7" />
              </div>
              <h3 className="text-base font-bold text-slate-900">
                Persistent Memory Support Ready
              </h3>
              <p className="text-xs text-slate-500 mt-1 mb-6 leading-relaxed">
                Send a message to see how SupportMind retrieves {selectedCustomer?.name}&apos;s previous complaints,
                router model, and preferences from Hindsight to provide an instant personalized answer.
              </p>

              {/* Sample Prompts */}
              <div className="w-full space-y-2">
                <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block text-left">
                  Suggested Prompts for {selectedCustomer?.name?.split(' ')[0]}:
                </span>
                {currentPrompts.map((prompt, idx) => (
                  <button
                    key={idx}
                    onClick={() => handleSendMessage(undefined, prompt)}
                    className="w-full text-left p-3 rounded-xl bg-white hover:bg-blue-50/50 border border-slate-200 hover:border-blue-300 text-xs text-slate-700 transition-all font-medium flex items-center justify-between group shadow-2xs"
                  >
                    <span>&ldquo;{prompt}&rdquo;</span>
                    <span className="text-blue-500 opacity-0 group-hover:opacity-100 transition-opacity">
                      Send →
                    </span>
                  </button>
                ))}
              </div>
            </div>
          ) : (
            messages.map((msg) => {
              const isUser = msg.sender === 'customer';
              const hasMemories = msg.retrieved_memories && msg.retrieved_memories.length > 0;
              const isExpanded = expandedMemoryMsgId === msg.id;

              return (
                <div
                  key={msg.id}
                  className={`flex flex-col ${isUser ? 'items-end' : 'items-start'} space-y-1.5`}
                >
                  <div className="flex items-center gap-2 text-[11px] text-slate-400 px-1">
                    <span className="font-semibold text-slate-600">
                      {isUser ? selectedCustomer?.name : 'SupportMind AI'}
                    </span>
                    <span>•</span>
                    <span>{new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                  </div>

                  <div
                    className={`max-w-2xl rounded-2xl p-4 shadow-xs text-sm leading-relaxed ${
                      isUser
                        ? 'bg-blue-600 text-white rounded-br-xs'
                        : 'bg-white border border-slate-200 text-slate-800 rounded-bl-xs'
                    }`}
                  >
                    <div className="whitespace-pre-wrap">{msg.content}</div>

                    {/* Agent Recalled Memory Pill */}
                    {!isUser && hasMemories && (
                      <div className="mt-3 pt-3 border-t border-slate-100">
                        <button
                          onClick={() => setExpandedMemoryMsgId(isExpanded ? null : msg.id)}
                          className="flex items-center justify-between w-full text-xs font-semibold text-purple-700 bg-purple-50 hover:bg-purple-100 px-2.5 py-1.5 rounded-lg border border-purple-200 transition-colors"
                        >
                          <div className="flex items-center gap-1.5">
                            <BrainCircuit className="w-3.5 h-3.5 text-purple-600" />
                            <span>
                              {msg.retrieved_memories?.length} Hindsight {msg.retrieved_memories?.length === 1 ? 'Memory' : 'Memories'} Influenced Response
                            </span>
                          </div>
                          {isExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                        </button>

                        {/* Expanded Recalled Memory Details */}
                        {isExpanded && (
                          <div className="mt-2 space-y-2 animate-in fade-in duration-150">
                            {msg.retrieved_memories?.map((mem, mIdx) => (
                              <div
                                key={mIdx}
                                className="p-2.5 rounded-lg bg-slate-50 border border-purple-100 text-xs text-slate-700 space-y-1"
                              >
                                <div className="flex items-center justify-between text-[11px]">
                                  <span className="font-bold uppercase tracking-wider text-purple-800 bg-purple-100/70 px-1.5 py-0.5 rounded">
                                    {mem.type}
                                  </span>
                                  {mem.score && (
                                    <span className="font-mono text-slate-500 font-medium">
                                      Relevance Score: {Math.round(mem.score * 100)}%
                                    </span>
                                  )}
                                </div>
                                <p className="text-slate-800 leading-snug font-medium">{mem.text}</p>
                              </div>
                            ))}

                            {msg.metadata && (
                              <div className="flex items-center gap-3 text-[10px] text-slate-400 font-mono pt-1">
                                <span>Recall Latency: {msg.metadata.recall_duration_ms || 18}ms</span>
                                <span>•</span>
                                <span>Gemini: {msg.metadata.gemini_duration_ms || 620}ms</span>
                                <span>•</span>
                                <span className="text-purple-600 font-semibold uppercase">
                                  Scope: {msg.metadata.hindsight_source || 'hindsight_live'}
                                </span>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              );
            })
          )}
          {isSending && (
            <div className="flex items-center gap-2.5 p-3 rounded-2xl bg-white border border-slate-200 w-fit text-xs text-slate-500 shadow-2xs">
              <BrainCircuit className="w-4 h-4 text-purple-600 animate-pulse" />
              <span>SupportMind is recalling Hindsight memories & synthesizing reply...</span>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input Bar & Scenario Shortcuts */}
        <div className="p-4 border-t border-slate-200 bg-white space-y-3">
          {/* Quick Scenario Buttons */}
          <div className="flex items-center gap-2 overflow-x-auto pb-1 text-xs">
            <span className="text-slate-400 font-medium shrink-0 flex items-center gap-1">
              <Sparkles className="w-3.5 h-3.5 text-blue-500" />
              Scenario Prompts:
            </span>
            {currentPrompts.map((prompt, idx) => (
              <button
                key={idx}
                onClick={() => handleSendMessage(undefined, prompt)}
                disabled={isSending}
                className="px-2.5 py-1 rounded-full bg-slate-100 hover:bg-blue-50 hover:text-blue-700 text-slate-600 shrink-0 border border-slate-200/70 transition-all font-medium disabled:opacity-50"
              >
                {prompt}
              </button>
            ))}
          </div>

          <form onSubmit={handleSendMessage} className="flex items-center gap-2">
            <input
              type="text"
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              placeholder={`Message SupportMind as ${selectedCustomer?.name || 'Customer'}...`}
              disabled={isSending}
              className="flex-1 px-4 py-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm text-slate-800 placeholder-slate-400 shadow-2xs disabled:bg-slate-50"
            />
            <button
              type="submit"
              disabled={isSending || !inputText.trim()}
              className="px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold text-sm flex items-center gap-1.5 shadow-md shadow-blue-500/20 active:scale-95 transition-all disabled:opacity-50 disabled:pointer-events-none"
            >
              <span>Send</span>
              <Send className="w-4 h-4" />
            </button>
          </form>
        </div>
      </div>

      {/* Right Drawer: Live Customer Memory Inspector */}
      <div className="w-80 border-l border-slate-200 bg-white p-5 flex flex-col justify-between overflow-y-auto hidden md:flex shrink-0">
        <div className="space-y-5">
          {/* Section Header */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <BrainCircuit className="w-4 h-4 text-purple-600" />
              <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                Customer Memory Bank
              </h4>
            </div>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-purple-50 text-purple-700 border border-purple-200">
              {customerMemories.length} Retained
            </span>
          </div>

          {/* Customer Technical Context Card */}
          <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/80 text-xs space-y-2">
            <div className="flex items-center gap-1.5 text-slate-700 font-semibold">
              <Laptop className="w-3.5 h-3.5 text-slate-500" />
              <span>Hardware & Environment</span>
            </div>
            <p className="text-slate-600 font-mono text-[11px] leading-relaxed">
              {selectedCustomer?.device_info || 'No hardware details recorded.'}
            </p>
          </div>

          {/* Preferences Card */}
          <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/80 text-xs space-y-1.5">
            <span className="text-slate-700 font-semibold block">Customer Preferences</span>
            <p className="text-slate-600 text-[11px] leading-relaxed">
              {selectedCustomer?.preferences || 'Standard communication protocol.'}
            </p>
          </div>

          {/* Stored Memories List */}
          <div className="space-y-2">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
              Retained Facts & History
            </span>

            <div className="space-y-2 max-h-[38vh] overflow-y-auto pr-1">
              {customerMemories.map((mem, idx) => (
                <div
                  key={mem.id || idx}
                  className="p-2.5 rounded-xl bg-white border border-slate-200/90 hover:border-purple-300 shadow-2xs transition-colors space-y-1"
                >
                  <div className="flex items-center justify-between text-[10px]">
                    <span className="font-bold uppercase tracking-wider px-1.5 py-0.5 rounded bg-slate-100 text-slate-700">
                      {mem.type || mem.memory_type}
                    </span>
                    <span className="text-slate-400">
                      {mem.created_at ? new Date(mem.created_at).toLocaleDateString() : 'Active'}
                    </span>
                  </div>
                  <p className="text-xs text-slate-700 font-medium leading-snug">
                    {mem.text || mem.content}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Bottom CTA to Before-and-After Comparison */}
        <div className="mt-4 pt-4 border-t border-slate-100">
          <button
            onClick={() => onNavigate('comparison')}
            className="w-full py-2 px-3 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-semibold text-xs flex items-center justify-center gap-1.5 shadow-sm transition-all"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>Test in Memory Comparison →</span>
          </button>
        </div>
      </div>
    </div>
  );
};
