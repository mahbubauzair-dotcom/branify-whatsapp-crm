import React, { useState, useEffect } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { AuthScreen } from './components/auth/AuthScreen';
import { Sidebar, NavItemKey } from './components/layout/Sidebar';
import { Header } from './components/layout/Header';
import { PrivacyPolicyPage } from './components/public/PrivacyPolicyPage';

// Views
import { DashboardView } from './components/views/DashboardView';
import { InboxView } from './components/views/InboxView';
import { ContactsView } from './components/views/ContactsView';
import { DealsView } from './components/views/DealsView';
import { BroadcastsView } from './components/views/BroadcastsView';
import { TemplatesView } from './components/views/TemplatesView';
import { AutomationsView } from './components/views/AutomationsView';
import { TasksView } from './components/views/TasksView';
import { KnowledgeBaseView } from './components/views/KnowledgeBaseView';
import { AiCopilotView } from './components/views/AiCopilotView';
import { SettingsView } from './components/views/SettingsView';
import { AuditLogsView } from './components/views/AuditLogsView';
import { PrivacyPolicyView } from './components/views/PrivacyPolicyView';

const MainAppContent: React.FC = () => {
  const { user, loading } = useAuth();
  const [currentView, setCurrentView] = useState<NavItemKey>('dashboard');
  const [selectedConversationId, setSelectedConversationId] = useState<string | null>(null);
  const [isPrivacyPolicyRoute, setIsPrivacyPolicyRoute] = useState<boolean>(() => {
    if (typeof window !== 'undefined') {
      const p = window.location.pathname.toLowerCase();
      return p === '/privacy-policy' || p === '/privacy-policy/' || window.location.hash === '#privacy-policy';
    }
    return false;
  });

  useEffect(() => {
    const handleLocationChange = () => {
      const p = window.location.pathname.toLowerCase();
      setIsPrivacyPolicyRoute(p === '/privacy-policy' || p === '/privacy-policy/' || window.location.hash === '#privacy-policy');
    };

    window.addEventListener('popstate', handleLocationChange);
    return () => window.removeEventListener('popstate', handleLocationChange);
  }, []);

  // Public Privacy Policy Page - No Auth Required
  if (isPrivacyPolicyRoute) {
    return (
      <PrivacyPolicyPage
        onNavigateHome={() => {
          if (window.history.pushState) {
            window.history.pushState({}, '', '/');
            setIsPrivacyPolicyRoute(false);
          } else {
            window.location.href = '/';
          }
        }}
      />
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center text-slate-400 gap-3">
        <div className="w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
        <span className="text-xs font-mono">Initializing Branify WhatsApp CRM...</span>
      </div>
    );
  }

  if (!user) {
    return (
      <AuthScreen
        onOpenPrivacyPolicy={() => {
          if (window.history.pushState) {
            window.history.pushState({}, '', '/privacy-policy');
            setIsPrivacyPolicyRoute(true);
          } else {
            window.location.href = '/privacy-policy';
          }
        }}
      />
    );
  }

  const handleOpenConversation = (conversationId: string) => {
    setSelectedConversationId(conversationId);
    setCurrentView('inbox');
  };

  const handleQuickAction = (action: 'new_message' | 'new_contact' | 'new_deal' | 'new_task') => {
    if (action === 'new_message') setCurrentView('inbox');
    if (action === 'new_contact') setCurrentView('contacts');
    if (action === 'new_deal') setCurrentView('deals');
    if (action === 'new_task') setCurrentView('tasks');
  };

  const renderView = () => {
    switch (currentView) {
      case 'dashboard':
        return (
          <DashboardView
            onSelectView={setCurrentView}
            onOpenConversation={handleOpenConversation}
          />
        );
      case 'inbox':
        return <InboxView initialConversationId={selectedConversationId} />;
      case 'contacts':
        return <ContactsView onOpenConversation={handleOpenConversation} />;
      case 'deals':
        return <DealsView />;
      case 'broadcasts':
        return <BroadcastsView />;
      case 'templates':
        return <TemplatesView />;
      case 'automations':
        return <AutomationsView />;
      case 'tasks':
        return <TasksView />;
      case 'knowledge_base':
        return <KnowledgeBaseView />;
      case 'ai_copilot':
        return <AiCopilotView />;
      case 'settings':
        return <SettingsView onSelectView={setCurrentView} />;
      case 'audit_logs':
        return <AuditLogsView />;
      case 'privacy_policy':
        return (
          <PrivacyPolicyView
            onOpenPublicPolicy={() => {
              if (window.history.pushState) {
                window.history.pushState({}, '', '/privacy-policy');
                setIsPrivacyPolicyRoute(true);
              } else {
                window.location.href = '/privacy-policy';
              }
            }}
          />
        );
      default:
        return <DashboardView onSelectView={setCurrentView} />;
    }
  };

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-slate-950 text-slate-100 font-sans antialiased selection:bg-indigo-500 selection:text-white">
      {/* Sidebar */}
      <Sidebar currentView={currentView} onSelectView={setCurrentView} />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <Header
          currentView={currentView}
          onSelectView={setCurrentView}
          onOpenQuickAction={handleQuickAction}
        />
        <main className="flex-1 flex flex-col overflow-hidden relative">
          {renderView()}
        </main>
      </div>
    </div>
  );
};

export default function App() {
  return (
    <AuthProvider>
      <MainAppContent />
    </AuthProvider>
  );
}
