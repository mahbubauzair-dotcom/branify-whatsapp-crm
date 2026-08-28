import React, { useState, useEffect } from 'react';
import {
  Activity,
  Plus,
  RefreshCw,
  Server,
  Shield,
  Sparkles,
  Zap,
  CheckCircle2,
  AlertTriangle,
  X,
  Copy,
  Check,
} from 'lucide-react';
import { NavItemKey } from './Sidebar';

interface HeaderProps {
  currentView: NavItemKey;
  onSelectView: (view: NavItemKey) => void;
  onOpenQuickAction?: (action: 'new_message' | 'new_contact' | 'new_deal' | 'new_task') => void;
}

export const Header: React.FC<HeaderProps> = ({ currentView, onOpenQuickAction }) => {
  const [showStatusModal, setShowStatusModal] = useState(false);
  const [systemStatus, setSystemStatus] = useState<any>(null);
  const [statusLoading, setStatusLoading] = useState(false);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  const fetchSystemStatus = async () => {
    setStatusLoading(true);
    try {
      const res = await fetch('/api/status');
      if (res.ok) {
        const data = await res.json();
        setSystemStatus(data);
      }
    } catch (e) {
      console.error('Failed to fetch system status:', e);
    } finally {
      setStatusLoading(false);
    }
  };

  useEffect(() => {
    fetchSystemStatus();
  }, []);

  const copyToClipboard = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  const getTitle = () => {
    switch (currentView) {
      case 'dashboard':
        return { title: 'Executive Overview', subtitle: 'WhatsApp Business operations, conversions & performance analytics' };
      case 'inbox':
        return { title: 'WhatsApp Live Inbox', subtitle: 'Three-column synchronized customer chat & lead relationship center' };
      case 'contacts':
        return { title: 'Customer Directory', subtitle: 'Compliance-verified contacts with opt-in status & lead scoring' };
      case 'deals':
        return { title: 'Sales Pipelines & Deals', subtitle: 'Kanban revenue stages and high-intent customer deal management' };
      case 'broadcasts':
        return { title: 'Audience Broadcasts', subtitle: 'Targeted marketing campaigns with opt-in compliance enforcement' };
      case 'templates':
        return { title: 'Meta Message Templates', subtitle: 'Official Meta WhatsApp Business Cloud message templates catalog' };
      case 'automations':
        return { title: 'Workflow Automations', subtitle: 'No-code event triggers, keyword auto-replies & smart task rules' };
      case 'tasks':
        return { title: 'Follow-ups & Reminders', subtitle: 'Actionable customer commitments and timely reminder tasks' };
      case 'knowledge_base':
        return { title: 'Branify Knowledge Base', subtitle: 'Verified business information for grounded AI customer support' };
      case 'ai_copilot':
        return { title: 'AI Intelligence Copilot', subtitle: 'Gemini-powered conversation summaries, lead scoring & smart drafting' };
      case 'settings':
        return { title: 'System & WhatsApp Settings', subtitle: 'Meta Cloud API keys, Webhook configuration & business identity' };
      case 'audit_logs':
        return { title: 'Security & Audit Logs', subtitle: 'Immutable chronological trail of CRM system actions' };
      case 'privacy_policy':
        return { title: 'Privacy Policy & Compliance', subtitle: 'Official data protection disclosures, Meta WhatsApp permissions & legal terms' };
      default:
        return { title: 'Branify CRM', subtitle: 'WhatsApp Business System' };
    }
  };

  const { title, subtitle } = getTitle();

  return (
    <>
      <header className="h-16 bg-slate-950/80 border-b border-slate-800/80 px-6 flex items-center justify-between shrink-0 backdrop-blur-md z-20">
        <div>
          <h1 className="text-base font-bold text-white tracking-tight flex items-center gap-2">
            {title}
          </h1>
          <p className="text-xs text-slate-400">{subtitle}</p>
        </div>

        <div className="flex items-center gap-3">
          {/* Realtime System Diagnostics Trigger */}
          <button
            onClick={() => {
              setShowStatusModal(true);
              fetchSystemStatus();
            }}
            className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-800 text-xs text-slate-300 hover:bg-slate-800 hover:text-white transition-all cursor-pointer shadow-sm"
          >
            <div className="flex items-center gap-1.5">
              <span className="relative flex h-2 w-2">
                <span className={`animate-ping absolute inline-flex h-full w-full rounded-full ${systemStatus?.supabase?.connected ? 'bg-emerald-400' : 'bg-amber-400'} opacity-75`}></span>
                <span className={`relative inline-flex rounded-full h-2 w-2 ${systemStatus?.supabase?.connected ? 'bg-emerald-500' : 'bg-amber-500'}`}></span>
              </span>
              <span className="font-medium">System Diagnostics</span>
            </div>
          </button>

          {/* Quick Action Menu */}
          {onOpenQuickAction && (
            <div className="relative group">
              <button className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-medium text-xs shadow-lg shadow-indigo-600/20 transition-all cursor-pointer">
                <Plus className="w-3.5 h-3.5" />
                <span>Quick Action</span>
              </button>

              <div className="absolute right-0 mt-2 w-48 bg-slate-900 border border-slate-800 rounded-xl shadow-2xl p-1.5 hidden group-hover:block transition-all z-50">
                <button
                  onClick={() => onOpenQuickAction('new_message')}
                  className="w-full text-left px-3 py-2 text-xs text-slate-300 hover:text-white hover:bg-slate-800 rounded-lg flex items-center gap-2 cursor-pointer"
                >
                  <Zap className="w-3.5 h-3.5 text-indigo-400" />
                  <span>Send Direct Message</span>
                </button>
                <button
                  onClick={() => onOpenQuickAction('new_contact')}
                  className="w-full text-left px-3 py-2 text-xs text-slate-300 hover:text-white hover:bg-slate-800 rounded-lg flex items-center gap-2 cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Add New Contact</span>
                </button>
                <button
                  onClick={() => onOpenQuickAction('new_deal')}
                  className="w-full text-left px-3 py-2 text-xs text-slate-300 hover:text-white hover:bg-slate-800 rounded-lg flex items-center gap-2 cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5 text-purple-400" />
                  <span>Create Pipeline Deal</span>
                </button>
                <button
                  onClick={() => onOpenQuickAction('new_task')}
                  className="w-full text-left px-3 py-2 text-xs text-slate-300 hover:text-white hover:bg-slate-800 rounded-lg flex items-center gap-2 cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5 text-amber-400" />
                  <span>Create Follow-up</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </header>

      {/* System Diagnostics Modal */}
      {showStatusModal && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-lg w-full p-6 shadow-2xl relative">
            <div className="flex items-center justify-between mb-5 pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2.5">
                <div className="p-2 bg-indigo-950 border border-indigo-800/40 rounded-xl text-indigo-400">
                  <Activity className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white">System Diagnostics</h3>
                  <p className="text-xs text-slate-400">Live infrastructure connectivity status</p>
                </div>
              </div>
              <button
                onClick={() => setShowStatusModal(false)}
                className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {statusLoading ? (
              <div className="py-12 text-center text-slate-400 text-xs flex flex-col items-center gap-3">
                <div className="w-6 h-6 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
                <span>Checking infrastructure status...</span>
              </div>
            ) : (
              <div className="space-y-4">
                {/* Supabase Status */}
                <div className="p-3.5 bg-slate-950 border border-slate-800 rounded-xl">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-semibold text-white flex items-center gap-2">
                      <Server className="w-4 h-4 text-indigo-400" />
                      Supabase Dedicated Database
                    </span>
                    {systemStatus?.supabase?.connected || systemStatus?.supabase?.configured ? (
                      <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 text-[10px] font-bold border border-emerald-500/30 flex items-center gap-1">
                        <CheckCircle2 className="w-3 h-3" /> Connected
                      </span>
                    ) : (
                      <span className="px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 text-[10px] font-bold border border-amber-500/30 flex items-center gap-1">
                        <AlertTriangle className="w-3 h-3" /> Pending Sync
                      </span>
                    )}
                  </div>
                  <div className="text-[11px] text-slate-400 font-mono break-all">
                    {systemStatus?.supabase?.url}
                  </div>
                </div>

                {/* Meta WhatsApp Cloud API Status */}
                <div className="p-3.5 bg-slate-950 border border-slate-800 rounded-xl">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-semibold text-white flex items-center gap-2">
                      <Zap className="w-4 h-4 text-emerald-400" />
                      Meta WhatsApp Cloud API
                    </span>
                    {systemStatus?.metaWhatsApp?.configured ? (
                      <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 text-[10px] font-bold border border-emerald-500/30 flex items-center gap-1">
                        <CheckCircle2 className="w-3 h-3" /> Live Configured
                      </span>
                    ) : (
                      <span className="px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 text-[10px] font-bold border border-amber-500/30 flex items-center gap-1">
                        <AlertTriangle className="w-3 h-3" /> Credentials Needed in Env
                      </span>
                    )}
                  </div>

                  <div className="space-y-1.5 text-xs text-slate-400">
                    <div className="flex items-center justify-between">
                      <span>Webhook Callback URL:</span>
                      <button
                        onClick={() => copyToClipboard(systemStatus?.metaWhatsApp?.webhookUrl, 'wh')}
                        className="text-[11px] font-mono text-indigo-400 hover:text-indigo-300 flex items-center gap-1 cursor-pointer"
                      >
                        {copiedKey === 'wh' ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                        Copy URL
                      </button>
                    </div>
                    <div className="p-2 bg-slate-900 rounded-lg text-[11px] font-mono text-slate-300 break-all select-all">
                      {systemStatus?.metaWhatsApp?.webhookUrl || `${window.location.origin}/api/whatsapp/webhook`}
                    </div>
                  </div>
                </div>

                {/* AI Gemini Status */}
                <div className="p-3.5 bg-slate-950 border border-slate-800 rounded-xl">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-semibold text-white flex items-center gap-2">
                      <Sparkles className="w-4 h-4 text-purple-400" />
                      Gemini 2.5 Flash AI Copilot
                    </span>
                    {systemStatus?.ai?.configured ? (
                      <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 text-[10px] font-bold border border-emerald-500/30 flex items-center gap-1">
                        <CheckCircle2 className="w-3 h-3" /> Ready
                      </span>
                    ) : (
                      <span className="px-2 py-0.5 rounded-full bg-slate-800 text-slate-400 text-[10px] font-medium">
                        Using Default Environment
                      </span>
                    )}
                  </div>
                  <div className="text-[11px] text-slate-400">
                    Grounded on Branify Knowledge Base without hallucinating prices or guarantees.
                  </div>
                </div>
              </div>
            )}

            <div className="mt-5 pt-3 border-t border-slate-800 flex justify-end">
              <button
                onClick={() => setShowStatusModal(false)}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-xs font-medium transition-colors cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
