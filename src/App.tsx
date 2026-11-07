import React, { useState, useEffect } from 'react';
import { Sidebar } from './components/Sidebar';
import { Header } from './components/Header';
import { HindsightStatusModal } from './components/HindsightStatusModal';
import { DashboardOverview } from './pages/DashboardOverview';
import { SupportChat } from './pages/SupportChat';
import { MemoryComparison } from './pages/MemoryComparison';
import { CustomerManagement } from './pages/CustomerManagement';
import { SupportTickets } from './pages/SupportTickets';
import { MemoryInsights } from './pages/MemoryInsights';
import { SettingsView } from './pages/SettingsView';
import { api } from './services/api';
import type { Customer, HindsightStatus } from './types';

export default function App() {
  const [activeTab, setActiveTab] = useState('overview');
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [selectedCustomerId, setSelectedCustomerId] = useState<string>('cust_alex_01');
  const [hindsightStatus, setHindsightStatus] = useState<HindsightStatus | null>(null);
  const [isHindsightModalOpen, setIsHindsightModalOpen] = useState(false);
  const [isSeeding, setIsSeeding] = useState(false);
  const [loading, setLoading] = useState(true);

  // Ticket prefill context when navigating from chat
  const [prefillTicketContext, setPrefillTicketContext] = useState<{
    customerId: string;
    title: string;
    description: string;
  } | null>(null);

  useEffect(() => {
    loadInitialData();
  }, []);

  const loadInitialData = async () => {
    try {
      setLoading(true);
      const [custRes, hindRes] = await Promise.allSettled([
        api.getCustomers(),
        api.getHindsightStatus(),
      ]);

      if (custRes.status === 'fulfilled') {
        setCustomers(custRes.value.customers);
        if (custRes.value.customers.length > 0 && !selectedCustomerId) {
          setSelectedCustomerId(custRes.value.customers[0].id);
        }
      }

      if (hindRes.status === 'fulfilled') {
        setHindsightStatus(hindRes.value);
      }
    } catch (err) {
      console.error('Failed to load initial data:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleRefreshHindsight = async () => {
    try {
      const status = await api.getHindsightStatus(true);
      setHindsightStatus(status);
    } catch (err) {
      console.error('Failed to refresh Hindsight status:', err);
    }
  };

  const handleSeedSampleData = async () => {
    if (!confirm('Reset all customers, tickets, and memories to the 5 realistic demonstration scenarios?')) {
      return;
    }
    setIsSeeding(true);
    try {
      await api.seedSampleData();
      await loadInitialData();
    } catch (err) {
      console.error('Failed to seed sample data:', err);
    } finally {
      setIsSeeding(false);
    }
  };

  const handleOpenTicketModalWithContext = (context: {
    customerId: string;
    title: string;
    description: string;
  }) => {
    setPrefillTicketContext(context);
    setActiveTab('tickets');
  };

  const selectedCustomer = customers.find(c => c.id === selectedCustomerId) || customers[0];

  return (
    <div className="flex h-screen bg-slate-100 font-sans text-slate-800 antialiased overflow-hidden">
      {/* Sidebar */}
      <Sidebar
        activeTab={activeTab}
        onTabChange={setActiveTab}
        hindsightStatus={hindsightStatus}
        onOpenHindsightModal={() => setIsHindsightModalOpen(true)}
      />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 h-full overflow-hidden">
        {/* Header Bar */}
        <Header
          activeTab={activeTab}
          customers={customers}
          selectedCustomerId={selectedCustomerId}
          onSelectCustomer={setSelectedCustomerId}
          hindsightStatus={hindsightStatus}
          onRefreshHindsight={handleRefreshHindsight}
          onSeedSampleData={handleSeedSampleData}
          isSeeding={isSeeding}
          onOpenHindsightModal={() => setIsHindsightModalOpen(true)}
        />

        {/* View Page Router */}
        <main className="flex-1 overflow-y-auto">
          {activeTab === 'overview' && (
            <DashboardOverview
              onNavigate={setActiveTab}
              customers={customers}
              onSelectCustomer={setSelectedCustomerId}
            />
          )}

          {activeTab === 'chat' && (
            <SupportChat
              selectedCustomer={selectedCustomer}
              customers={customers}
              onSelectCustomer={setSelectedCustomerId}
              onOpenTicketModalWithContext={handleOpenTicketModalWithContext}
              onNavigate={setActiveTab}
            />
          )}

          {activeTab === 'comparison' && (
            <MemoryComparison
              customers={customers}
              selectedCustomerId={selectedCustomerId}
              onSelectCustomer={setSelectedCustomerId}
              onNavigate={setActiveTab}
            />
          )}

          {activeTab === 'customers' && (
            <CustomerManagement
              customers={customers}
              onSelectCustomer={setSelectedCustomerId}
              onNavigate={setActiveTab}
              onRefreshCustomers={loadInitialData}
            />
          )}

          {activeTab === 'tickets' && (
            <SupportTickets
              customers={customers}
              onSelectCustomer={setSelectedCustomerId}
              onNavigate={setActiveTab}
              prefillTicketContext={prefillTicketContext}
              onClearPrefillContext={() => setPrefillTicketContext(null)}
            />
          )}

          {activeTab === 'memories' && (
            <MemoryInsights
              customers={customers}
              selectedCustomerId={selectedCustomerId}
              onSelectCustomer={setSelectedCustomerId}
              onOpenHindsightModal={() => setIsHindsightModalOpen(true)}
            />
          )}

          {activeTab === 'settings' && (
            <SettingsView
              hindsightStatus={hindsightStatus}
              onRefreshHindsight={handleRefreshHindsight}
              onSeedSampleData={handleSeedSampleData}
              isSeeding={isSeeding}
              onOpenHindsightModal={() => setIsHindsightModalOpen(true)}
            />
          )}
        </main>
      </div>

      {/* Hindsight Status & Docker Diagnostics Modal */}
      <HindsightStatusModal
        isOpen={isHindsightModalOpen}
        onClose={() => setIsHindsightModalOpen(false)}
        status={hindsightStatus}
        onRefresh={handleRefreshHindsight}
      />
    </div>
  );
}
