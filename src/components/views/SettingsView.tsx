import React, { useState, useEffect } from 'react';
import {
  Settings,
  Shield,
  Server,
  Zap,
  Globe,
  Phone,
  Lock,
  Copy,
  Check,
  CheckCircle2,
  AlertTriangle,
  RefreshCw,
  ExternalLink,
} from 'lucide-react';
import { supabase, BRANIFY_DEFAULTS } from '../../lib/supabase';
import { useAuth } from '../../context/AuthContext';
import { NavItemKey } from '../layout/Sidebar';

interface SettingsViewProps {
  onSelectView?: (view: NavItemKey) => void;
}

export const SettingsView: React.FC<SettingsViewProps> = ({ onSelectView }) => {
  const { user } = useAuth();
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [systemStatus, setSystemStatus] = useState<any>(null);
  const [loadingStatus, setLoadingStatus] = useState(false);

  const fetchStatus = async () => {
    setLoadingStatus(true);
    try {
      const res = await fetch('/api/status');
      if (res.ok) {
        const data = await res.json();
        setSystemStatus(data);
      }
    } catch (e) {
      console.error('Failed to fetch status:', e);
    } finally {
      setLoadingStatus(false);
    }
  };

  useEffect(() => {
    fetchStatus();
  }, []);

  const copyToClipboard = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  const webhookUrl = `${window.location.origin}/api/whatsapp/webhook`;
  const verifyToken = 'branify_crm_webhook_secret_2026';

  return (
    <div className="p-6 space-y-6 max-w-5xl mx-auto overflow-y-auto">
      {/* Header Bar */}
      <div>
        <h2 className="text-lg font-bold text-white tracking-tight flex items-center gap-2">
          <Settings className="w-5 h-5 text-indigo-400" />
          <span>System & WhatsApp Settings</span>
        </h2>
        <p className="text-xs text-slate-400 mt-0.5">
          Meta Cloud API keys, Webhook endpoints, Supabase configuration, and business identity
        </p>
      </div>

      {/* WhatsApp Business Identity Card */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-6 shadow-sm space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-slate-800">
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-xl overflow-hidden ring-1 ring-amber-500/30 bg-black flex items-center justify-center shrink-0 shadow-md">
              <img
                src="/branify-logo.jpg"
                alt="Branify Logo"
                className="w-full h-full object-cover"
              />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white">Branify WhatsApp Business Identity</h3>
              <p className="text-xs text-amber-400 font-medium">BUILD. BRAND. GROW. • Verified Official Account</p>
            </div>
          </div>
          <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 text-[10px] font-bold border border-emerald-500/30">
            Active Verified
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 text-xs">
          <div className="p-3 bg-slate-950 rounded-xl border border-slate-800">
            <span className="text-[10px] text-slate-500 uppercase font-semibold">Business Name</span>
            <div className="text-white font-bold mt-1">{BRANIFY_DEFAULTS.businessName}</div>
          </div>

          <div className="p-3 bg-slate-950 rounded-xl border border-slate-800">
            <span className="text-[10px] text-slate-500 uppercase font-semibold">Username / Handle</span>
            <div className="text-indigo-300 font-mono mt-1">{BRANIFY_DEFAULTS.username}</div>
          </div>

          <div className="p-3 bg-slate-950 rounded-xl border border-slate-800">
            <span className="text-[10px] text-slate-500 uppercase font-semibold">WhatsApp Number</span>
            <div className="text-emerald-400 font-mono mt-1">{BRANIFY_DEFAULTS.formattedPhone}</div>
          </div>

          <div className="p-3 bg-slate-950 rounded-xl border border-slate-800">
            <span className="text-[10px] text-slate-500 uppercase font-semibold">Meta Phone Number ID</span>
            <div className="text-emerald-400 font-mono mt-1">1284140121445758</div>
          </div>

          <div className="p-3 bg-slate-950 rounded-xl border border-slate-800">
            <span className="text-[10px] text-slate-500 uppercase font-semibold">Meta Business Account ID (WABA)</span>
            <div className="text-indigo-300 font-mono mt-1">1923752848293256</div>
          </div>

          <div className="p-3 bg-slate-950 rounded-xl border border-slate-800">
            <span className="text-[10px] text-slate-500 uppercase font-semibold">Official Website</span>
            <div className="text-slate-300 font-mono mt-1">{BRANIFY_DEFAULTS.website}</div>
          </div>
        </div>
      </div>

      {/* Meta Webhook Setup Guide */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-6 shadow-sm space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-950/80 border border-indigo-800/50 flex items-center justify-center text-indigo-400">
              <Globe className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white">Meta Developer App Webhook Setup</h3>
              <p className="text-xs text-slate-400">Configure these exact URLs in Meta App Dashboard → WhatsApp → Configuration</p>
            </div>
          </div>
          <a
            href="https://developers.facebook.com/apps"
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs text-indigo-400 hover:text-indigo-300 flex items-center gap-1 font-medium"
          >
            <span>Meta App Dashboard</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </a>
        </div>

        <div className="space-y-3">
          {/* Callback URL */}
          <div className="space-y-1">
            <div className="flex items-center justify-between text-xs text-slate-300">
              <span className="font-semibold">Webhook Callback URL (POST & GET verification):</span>
              <button
                onClick={() => copyToClipboard(webhookUrl, 'wh')}
                className="text-[11px] text-indigo-400 hover:text-indigo-300 flex items-center gap-1 cursor-pointer font-medium"
              >
                {copiedKey === 'wh' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                <span>Copy URL</span>
              </button>
            </div>
            <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 text-xs font-mono text-slate-200 select-all break-all">
              {webhookUrl}
            </div>
          </div>

          {/* Verify Token */}
          <div className="space-y-1">
            <div className="flex items-center justify-between text-xs text-slate-300">
              <span className="font-semibold">Verify Token:</span>
              <button
                onClick={() => copyToClipboard(verifyToken, 'vt')}
                className="text-[11px] text-indigo-400 hover:text-indigo-300 flex items-center gap-1 cursor-pointer font-medium"
              >
                {copiedKey === 'vt' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                <span>Copy Token</span>
              </button>
            </div>
            <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 text-xs font-mono text-slate-200 select-all">
              {verifyToken}
            </div>
          </div>

          <div className="p-3.5 bg-slate-950 rounded-xl border border-slate-800 text-xs text-slate-400 space-y-1">
            <span className="font-bold text-slate-300">Webhook Fields to Subscribe:</span>
            <div className="flex flex-wrap gap-2 pt-1 font-mono text-[11px]">
              <span className="px-2 py-0.5 bg-slate-900 rounded border border-slate-800 text-indigo-300">messages</span>
              <span className="px-2 py-0.5 bg-slate-900 rounded border border-slate-800 text-indigo-300">message_template_status_update</span>
              <span className="px-2 py-0.5 bg-slate-900 rounded border border-slate-800 text-indigo-300">account_update</span>
            </div>
          </div>
        </div>
      </div>

      {/* Public Privacy Policy & Compliance Notice */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-6 shadow-sm space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-950/60 border border-amber-500/30 flex items-center justify-center text-amber-400">
              <Shield className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white">Public Privacy Policy & Compliance URL</h3>
              <p className="text-xs text-slate-400">Required for Meta App Review, Business Verification, and Customer Disclosures</p>
            </div>
          </div>
          <span className="px-2.5 py-0.5 rounded-full bg-amber-500/20 text-amber-300 text-[10px] font-bold border border-amber-500/30">
            Public Route
          </span>
        </div>

        <div className="space-y-3">
          <p className="text-xs text-slate-300">
            This public page provides full disclosure on data collection, WhatsApp Cloud API processing, Supabase storage, and customer rights.
          </p>

          <div className="flex items-center justify-between p-3 bg-slate-950 rounded-xl border border-slate-800 text-xs font-mono text-amber-300">
            <span className="truncate mr-3">https://branify-whatsapp-crm.vercel.app/privacy-policy</span>
            <div className="flex items-center gap-2 shrink-0">
              <button
                onClick={() => copyToClipboard('https://branify-whatsapp-crm.vercel.app/privacy-policy', 'pp')}
                className="text-[11px] text-amber-400 hover:text-amber-300 flex items-center gap-1 cursor-pointer font-medium"
              >
                {copiedKey === 'pp' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                <span>Copy</span>
              </button>
              <a
                href="/privacy-policy"
                target="_blank"
                rel="noreferrer"
                className="p-1 text-slate-400 hover:text-amber-300 hover:bg-slate-900 rounded transition-colors"
                title="View Public Privacy Policy Page"
              >
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
            </div>
          </div>

          {onSelectView && (
            <div className="pt-1">
              <button
                onClick={() => onSelectView('privacy_policy')}
                className="px-4 py-2 bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 border border-amber-500/30 rounded-xl text-xs font-semibold flex items-center gap-2 transition-colors cursor-pointer"
              >
                <Shield className="w-3.5 h-3.5 text-amber-400" />
                <span>Open In-Dashboard Privacy & Compliance View</span>
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Database & Secret Security Notice */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-6 shadow-sm space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-purple-950/80 border border-purple-800/50 flex items-center justify-center text-purple-400">
              <Lock className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white">Database & Secret Isolation</h3>
              <p className="text-xs text-slate-400">Supabase RLS and Server-Side Secret Boundaries</p>
            </div>
          </div>
          <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 text-[10px] font-bold border border-emerald-500/30">
            Hardened
          </span>
        </div>

        <div className="text-xs text-slate-300 space-y-2 leading-relaxed">
          <p>
            The dedicated Supabase database project (<span className="font-mono text-indigo-300">branify-whatsapp-crm</span>) enforces complete Row-Level Security (RLS). Privileged triggers and invitation-processing functions have all public execution revoked.
          </p>
          <p className="text-slate-400">
            Meta API Tokens and Gemini AI Keys are executed exclusively inside the backend server and are never delivered to the client browser.
          </p>
        </div>
      </div>
    </div>
  );
};
