import React from 'react';
import {
  LayoutDashboard,
  MessageSquare,
  Users,
  Kanban,
  Send,
  FileCode2,
  Zap,
  CheckSquare,
  BookOpen,
  Sparkles,
  Settings,
  ShieldCheck,
  Shield,
  LogOut,
  ExternalLink,
  Radio,
  Lock,
  Phone,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { BRANIFY_DEFAULTS } from '../../lib/supabase';

export type NavItemKey =
  | 'dashboard'
  | 'inbox'
  | 'contacts'
  | 'deals'
  | 'broadcasts'
  | 'templates'
  | 'automations'
  | 'tasks'
  | 'knowledge_base'
  | 'ai_copilot'
  | 'settings'
  | 'audit_logs'
  | 'privacy_policy';

interface SidebarProps {
  currentView: NavItemKey;
  onSelectView: (view: NavItemKey) => void;
  unreadCount?: number;
  openDealsCount?: number;
  pendingTasksCount?: number;
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentView,
  onSelectView,
  unreadCount = 0,
  openDealsCount = 0,
  pendingTasksCount = 0,
}) => {
  const { profile, signOut, whatsappAccount } = useAuth();

  const primaryNavItems: Array<{
    key: NavItemKey;
    label: string;
    icon: React.ElementType;
    badge?: number | string;
    badgeColor?: string;
  }> = [
    { key: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    {
      key: 'inbox',
      label: 'WhatsApp Inbox',
      icon: MessageSquare,
      badge: unreadCount > 0 ? unreadCount : undefined,
      badgeColor: 'bg-emerald-500 text-white',
    },
    { key: 'contacts', label: 'Contacts', icon: Users },
    {
      key: 'deals',
      label: 'Pipelines & Deals',
      icon: Kanban,
      badge: openDealsCount > 0 ? openDealsCount : undefined,
      badgeColor: 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/30',
    },
    { key: 'broadcasts', label: 'Broadcasts', icon: Send },
    { key: 'templates', label: 'Templates', icon: FileCode2 },
    { key: 'automations', label: 'Automations', icon: Zap },
    {
      key: 'tasks',
      label: 'Follow-ups',
      icon: CheckSquare,
      badge: pendingTasksCount > 0 ? pendingTasksCount : undefined,
      badgeColor: 'bg-amber-500/20 text-amber-300 border border-amber-500/30',
    },
  ];

  const secondaryNavItems: Array<{
    key: NavItemKey;
    label: string;
    icon: React.ElementType;
    badge?: string;
    badgeColor?: string;
  }> = [
    { key: 'knowledge_base', label: 'Knowledge Base', icon: BookOpen },
    { key: 'ai_copilot', label: 'AI Intelligence', icon: Sparkles },
    {
      key: 'privacy_policy',
      label: 'Privacy Policy',
      icon: ShieldCheck,
      badge: 'Meta Review',
      badgeColor: 'bg-amber-500/20 text-amber-300 border border-amber-500/30 text-[9px]',
    },
    { key: 'settings', label: 'Settings', icon: Settings },
    { key: 'audit_logs', label: 'Audit Trail', icon: Shield },
  ];

  return (
    <aside className="w-64 bg-slate-950 border-r border-slate-800/80 flex flex-col justify-between shrink-0 select-none">
      {/* Top Header & Brand Identity */}
      <div>
        <div className="p-4 border-b border-slate-800/80">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-xl overflow-hidden shadow-lg shadow-amber-500/10 ring-1 ring-amber-500/30 bg-black shrink-0 flex items-center justify-center">
              <img
                src="/branify-logo.jpg"
                alt="Branify Logo"
                className="w-full h-full object-cover"
                onError={(e) => {
                  (e.currentTarget as HTMLElement).style.display = 'none';
                }}
              />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="font-bold text-white tracking-wide text-base">BRANIFY</span>
                <span className="text-[10px] uppercase font-bold tracking-wider px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/30">
                  CRM
                </span>
              </div>
              <p className="text-[11px] text-amber-400/90 font-medium tracking-tight">BUILD. BRAND. GROW.</p>
            </div>
          </div>

          {/* Active WhatsApp Identity Pill */}
          <div className="mt-3 p-2.5 bg-slate-900/90 border border-slate-800 rounded-xl flex items-center justify-between">
            <div className="flex items-center gap-2 overflow-hidden">
              <div className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
              </div>
              <div className="truncate">
                <div className="text-xs font-semibold text-white truncate">
                  {whatsappAccount?.business_name || BRANIFY_DEFAULTS.businessName}
                </div>
                <div className="text-[11px] text-slate-400 font-mono flex items-center gap-1">
                  <span>{whatsappAccount?.username || BRANIFY_DEFAULTS.username}</span>
                  <span className="text-slate-600">•</span>
                  <span className="text-emerald-400 flex items-center gap-0.5 font-medium">
                    <Phone className="w-2.5 h-2.5 text-emerald-400" />
                    {whatsappAccount?.phone_number_masked || BRANIFY_DEFAULTS.formattedPhone}
                  </span>
                </div>
              </div>
            </div>
            <a
              href={BRANIFY_DEFAULTS.website}
              target="_blank"
              rel="noopener noreferrer"
              className="p-1 text-slate-500 hover:text-indigo-400 transition-colors"
              title="Visit Branify Website"
            >
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
          </div>
        </div>

        {/* Primary Navigation */}
        <nav className="p-3 space-y-1">
          <div className="px-3 py-1.5 text-[10px] font-semibold tracking-wider text-slate-500 uppercase">
            Operations
          </div>
          {primaryNavItems.map((item) => {
            const Icon = item.icon;
            const isActive = currentView === item.key;
            return (
              <button
                key={item.key}
                onClick={() => onSelectView(item.key)}
                className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-medium transition-all cursor-pointer ${
                  isActive
                    ? 'bg-indigo-600/15 text-indigo-300 border border-indigo-500/30 shadow-sm'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/60 border border-transparent'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <Icon
                    className={`w-4 h-4 ${
                      isActive ? 'text-indigo-400' : 'text-slate-500'
                    }`}
                  />
                  <span>{item.label}</span>
                </div>
                {item.badge !== undefined && (
                  <span
                    className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${
                      item.badgeColor || 'bg-slate-800 text-slate-300'
                    }`}
                  >
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}

          <div className="pt-3 px-3 py-1.5 text-[10px] font-semibold tracking-wider text-slate-500 uppercase">
            Intelligence & System
          </div>
          {secondaryNavItems.map((item) => {
            const Icon = item.icon;
            const isActive = currentView === item.key;
            return (
              <button
                key={item.key}
                onClick={() => onSelectView(item.key)}
                className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-medium transition-all cursor-pointer ${
                  isActive
                    ? 'bg-indigo-600/15 text-indigo-300 border border-indigo-500/30 shadow-sm'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/60 border border-transparent'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <Icon
                    className={`w-4 h-4 ${
                      isActive ? 'text-indigo-400' : 'text-slate-500'
                    }`}
                  />
                  <span>{item.label}</span>
                </div>
                {item.badge !== undefined && (
                  <span
                    className={`text-[9px] font-bold px-1.5 py-0.5 rounded-md ${
                      item.badgeColor || 'bg-slate-800 text-slate-300'
                    }`}
                  >
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </nav>
      </div>

      {/* Footer Profile & Logout */}
      <div className="p-3 border-t border-slate-800/80 bg-slate-950/60 space-y-2">
        <div className="flex items-center justify-between px-1 text-[11px] text-slate-500">
          <button
            onClick={() => onSelectView('privacy_policy')}
            className="hover:text-amber-400 text-slate-400 transition-colors flex items-center gap-1 font-medium cursor-pointer"
            title="Open Admin Privacy Policy View"
          >
            <ShieldCheck className="w-3 h-3 text-amber-500/70" />
            <span>Privacy Policy</span>
          </button>
          <a
            href={BRANIFY_DEFAULTS.website}
            target="_blank"
            rel="noreferrer"
            className="hover:text-slate-300 transition-colors"
          >
            branify.store
          </a>
        </div>

        <div className="flex items-center justify-between p-2 rounded-xl bg-slate-900/80 border border-slate-800">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-7 h-7 rounded-lg bg-indigo-600/30 text-indigo-400 border border-indigo-500/30 flex items-center justify-center font-bold text-xs uppercase shrink-0">
              {profile?.full_name?.charAt(0) || 'O'}
            </div>
            <div className="truncate">
              <div className="text-xs font-medium text-white truncate">
                {profile?.full_name || 'Owner'}
              </div>
              <div className="text-[10px] text-indigo-400 capitalize font-mono">
                Sole Owner
              </div>
            </div>
          </div>
          <button
            onClick={signOut}
            title="Sign Out"
            className="p-1.5 text-slate-400 hover:text-red-400 hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>
    </aside>
  );
};
