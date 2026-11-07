export interface Customer {
  id: string;
  name: string;
  email: string;
  company: string;
  plan: string;
  device_info: string;
  preferences: string;
  avatar: string;
  created_at: string;
  updated_at?: string;
  memory_count?: number;
  open_tickets_count?: number;
  conversation_count?: number;
}

export interface MemoryItem {
  id?: string;
  customer_id?: string;
  customer_name?: string;
  type?: 'fact' | 'preference' | 'complaint' | 'resolution' | 'hardware' | string;
  memory_type?: 'fact' | 'preference' | 'complaint' | 'resolution' | 'hardware' | string;
  text?: string;
  content?: string;
  score?: number;
  confidence?: number;
  source?: string;
  hindsight_sync_status?: string;
  created_at?: string;
  metadata?: Record<string, unknown>;
}

export interface Ticket {
  id: string;
  ticket_number: string;
  customer_id: string;
  customer_name?: string;
  customer_email?: string;
  customer_company?: string;
  customer_avatar?: string;
  conversation_id?: string;
  title: string;
  description: string;
  category: 'Hardware / Network' | 'Billing' | 'Delivery' | 'Software' | 'General';
  priority: 'Low' | 'Medium' | 'High' | 'Critical';
  status: 'Open' | 'In Progress' | 'Resolved' | 'Closed';
  resolution_notes?: string;
  resolved_at?: string;
  created_at: string;
  updated_at?: string;
}

export interface Conversation {
  id: string;
  customer_id: string;
  customer_name?: string;
  customer_email?: string;
  customer_avatar?: string;
  title: string;
  channel: string;
  status: string;
  created_at: string;
  updated_at: string;
  last_message?: string;
  last_message_at?: string;
  message_count?: number;
}

export interface Message {
  id: string;
  conversation_id: string;
  customer_id: string;
  sender: 'customer' | 'agent';
  content: string;
  retrieved_memories?: Array<{
    type: string;
    text: string;
    score?: number;
  }>;
  metadata?: {
    hindsight_source?: string;
    recall_duration_ms?: number;
    gemini_duration_ms?: number;
    memories_count?: number;
    extracted_facts?: string[];
  };
  created_at: string;
}

export interface HindsightStatus {
  connected: boolean;
  baseUrl: string;
  hasApiKey: boolean;
  apiVersion?: string;
  features?: Record<string, unknown>;
  error?: string;
  lastChecked: string;
  stats?: {
    totalMemoriesStored: number;
    syncedToHindsight: number;
  };
  setupGuide?: {
    dockerCommand: string;
    cloudUrl: string;
    envVars: Record<string, string>;
  };
}

export interface AnalyticsData {
  metrics: {
    totalCustomers: number;
    totalConversations: number;
    totalMessages: number;
    totalMemories: number;
    openTickets: number;
    inProgressTickets: number;
    resolvedTickets: number;
    totalTickets: number;
    resolutionRatePercent: number;
    estimatedTimeSavedMinutes: number;
  };
  breakdowns: {
    ticketsByCategory: Array<{ category: string; count: number }>;
    ticketsByPriority: Array<{ priority: string; count: number }>;
    memoriesByType: Array<{ memory_type: string; count: number }>;
    frequentComplaints: Array<{ content: string; confidence: number; created_at: string; customer_id: string }>;
    recentAuditLogs: Array<{ action: string; duration_ms: number; source: string; created_at: string }>;
  };
}
