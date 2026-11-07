import type {
  Customer,
  Conversation,
  Message,
  Ticket,
  MemoryItem,
  HindsightStatus,
  AnalyticsData,
} from '../types';

export const api = {
  // Customers
  async getCustomers(): Promise<{ customers: Customer[] }> {
    const res = await fetch('/api/customers');
    if (!res.ok) throw new Error('Failed to fetch customers');
    return res.json();
  },

  async getCustomer(id: string): Promise<{
    customer: Customer;
    memories: MemoryItem[];
    tickets: Ticket[];
    conversations: Conversation[];
  }> {
    const res = await fetch(`/api/customers/${id}`);
    if (!res.ok) throw new Error('Failed to fetch customer profile');
    return res.json();
  },

  async createCustomer(data: Partial<Customer>): Promise<{ customer: Customer }> {
    const res = await fetch('/api/customers', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error('Failed to create customer');
    return res.json();
  },

  // Conversations
  async getConversations(customerId?: string): Promise<{ conversations: Conversation[] }> {
    const url = customerId ? `/api/conversations?customerId=${customerId}` : '/api/conversations';
    const res = await fetch(url);
    if (!res.ok) throw new Error('Failed to fetch conversations');
    return res.json();
  },

  async getConversation(id: string): Promise<{ conversation: Conversation; messages: Message[] }> {
    const res = await fetch(`/api/conversations/${id}`);
    if (!res.ok) throw new Error('Failed to fetch conversation');
    return res.json();
  },

  async createConversation(data: { customerId: string; title?: string }): Promise<{ conversation: Conversation }> {
    const res = await fetch('/api/conversations', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error('Failed to create conversation');
    return res.json();
  },

  async sendMessage(conversationId: string, content: string): Promise<{
    customerMessage: Message;
    agentResponse: Message;
    timing: { recallDurationMs: number; geminiDurationMs: number };
  }> {
    const res = await fetch(`/api/conversations/${conversationId}/messages`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ content }),
    });
    if (!res.ok) throw new Error('Failed to send message');
    return res.json();
  },

  // Tickets
  async getTickets(filters?: {
    status?: string;
    category?: string;
    priority?: string;
    customerId?: string;
    search?: string;
  }): Promise<{ tickets: Ticket[] }> {
    const params = new URLSearchParams();
    if (filters?.status) params.set('status', filters.status);
    if (filters?.category) params.set('category', filters.category);
    if (filters?.priority) params.set('priority', filters.priority);
    if (filters?.customerId) params.set('customerId', filters.customerId);
    if (filters?.search) params.set('search', filters.search);

    const res = await fetch(`/api/tickets?${params.toString()}`);
    if (!res.ok) throw new Error('Failed to fetch tickets');
    return res.json();
  },

  async createTicket(data: {
    customer_id: string;
    conversation_id?: string;
    title: string;
    description: string;
    category: string;
    priority: string;
  }): Promise<{ ticket: Ticket }> {
    const res = await fetch('/api/tickets', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error('Failed to create ticket');
    return res.json();
  },

  async updateTicket(id: string, data: {
    status?: string;
    priority?: string;
    resolution_notes?: string;
  }): Promise<{ ticket: Ticket }> {
    const res = await fetch(`/api/tickets/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error('Failed to update ticket');
    return res.json();
  },

  // Memories
  async getMemories(customerId?: string, type?: string): Promise<{ memories: MemoryItem[] }> {
    const params = new URLSearchParams();
    if (customerId) params.set('customerId', customerId);
    if (type) params.set('type', type);

    const res = await fetch(`/api/memories?${params.toString()}`);
    if (!res.ok) throw new Error('Failed to fetch memories');
    return res.json();
  },

  async retainMemory(data: {
    customerId: string;
    content: string;
    memoryType?: string;
    context?: string;
  }): Promise<{ memory: MemoryItem }> {
    const res = await fetch('/api/memories', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error('Failed to retain memory');
    return res.json();
  },

  async testRecall(customerId: string, query: string): Promise<{
    query: string;
    customerId: string;
    bankId: string;
    resultsCount: number;
    memories: MemoryItem[];
    promptString: string;
    source: string;
    durationMs: number;
  }> {
    const res = await fetch('/api/memories/recall-test', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ customerId, query }),
    });
    if (!res.ok) throw new Error('Failed to test recall query');
    return res.json();
  },

  async deleteMemory(id: string): Promise<{ success: boolean }> {
    const res = await fetch(`/api/memories/${id}`, { method: 'DELETE' });
    if (!res.ok) throw new Error('Failed to delete memory');
    return res.json();
  },

  async getAuditLogs(customerId?: string): Promise<{
    logs: Array<{
      id: string;
      customer_id: string;
      customer_name: string;
      action: string;
      query_or_content: string;
      results: unknown;
      duration_ms: number;
      source: string;
      created_at: string;
    }>;
  }> {
    const url = customerId ? `/api/memories/audit-logs?customerId=${customerId}` : '/api/memories/audit-logs';
    const res = await fetch(url);
    if (!res.ok) throw new Error('Failed to fetch audit logs');
    return res.json();
  },

  // Comparison
  async runComparison(customerId: string, query: string): Promise<{
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
  }> {
    const res = await fetch('/api/comparison', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ customerId, query }),
    });
    if (!res.ok) throw new Error('Failed to generate memory comparison');
    return res.json();
  },

  // Analytics
  async getAnalytics(): Promise<AnalyticsData> {
    const res = await fetch('/api/analytics');
    if (!res.ok) throw new Error('Failed to fetch analytics');
    return res.json();
  },

  // Hindsight & Settings
  async getHindsightStatus(refresh = false): Promise<HindsightStatus> {
    const res = await fetch(`/api/hindsight/status${refresh ? '?refresh=true' : ''}`);
    if (!res.ok) throw new Error('Failed to fetch Hindsight status');
    return res.json();
  },

  async seedSampleData(): Promise<{ success: boolean; message: string }> {
    const res = await fetch('/api/hindsight/seed-sample-data', { method: 'POST' });
    if (!res.ok) throw new Error('Failed to re-seed sample data');
    return res.json();
  },
};
