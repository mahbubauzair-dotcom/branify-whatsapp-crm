import React, { useState, useEffect } from 'react';
import {
  MessageSquare,
  Users,
  DollarSign,
  Send,
  ArrowUpRight,
  Clock,
  CheckCircle2,
  TrendingUp,
  AlertCircle,
  Plus,
  Radio,
  Zap,
} from 'lucide-react';
import { supabase, BRANIFY_DEFAULTS } from '../../lib/supabase';
import { NavItemKey } from '../layout/Sidebar';

interface DashboardViewProps {
  onSelectView: (view: NavItemKey) => void;
  onOpenConversation?: (conversationId: string) => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({ onSelectView, onOpenConversation }) => {
  const [stats, setStats] = useState({
    activeConversations: 0,
    unreadConversations: 0,
    messagesToday: 0,
    newContacts: 0,
    openDeals: 0,
    wonDeals: 0,
    pipelineValue: 0,
    broadcastCount: 0,
  });
  const [recentConversations, setRecentConversations] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);

      // 1. Fetch Conversations
      const { data: convs } = await supabase
        .from('conversations')
        .select(`
          id, status, priority, unread_count, last_message_at,
          contacts ( id, name, wa_id, marketing_opt_in )
        `)
        .order('last_message_at', { ascending: false })
        .limit(10);

      const activeConvCount = convs?.filter(c => c.status === 'open' || c.status === 'pending').length || 0;
      const unreadConvCount = convs?.filter(c => (c.unread_count || 0) > 0).length || 0;

      // 2. Fetch Contacts count
      const { count: contactsCount } = await supabase
        .from('contacts')
        .select('id', { count: 'exact', head: true });

      // 3. Fetch Deals
      const { data: deals } = await supabase
        .from('deals')
        .select('id, value, stage_id, pipeline_stages(name)');

      let openD = 0;
      let wonD = 0;
      let totalVal = 0;

      deals?.forEach((deal: any) => {
        const stageName = deal.pipeline_stages?.name?.toLowerCase() || '';
        const val = Number(deal.value) || 0;
        if (stageName === 'won') {
          wonD += 1;
        } else if (stageName !== 'lost') {
          openD += 1;
          totalVal += val;
        }
      });

      // 4. Fetch Broadcasts count
      const { count: bCount } = await supabase
        .from('broadcasts')
        .select('id', { count: 'exact', head: true });

      // 5. Fetch Messages count today
      const todayStart = new Date();
      todayStart.setHours(0, 0, 0, 0);
      const { count: msgTodayCount } = await supabase
        .from('messages')
        .select('id', { count: 'exact', head: true })
        .gte('created_at', todayStart.toISOString());

      setStats({
        activeConversations: activeConvCount,
        unreadConversations: unreadConvCount,
        messagesToday: msgTodayCount || 0,
        newContacts: contactsCount || 0,
        openDeals: openD,
        wonDeals: wonD,
        pipelineValue: totalVal,
        broadcastCount: bCount || 0,
      });

      setRecentConversations(convs || []);
    } catch (err) {
      console.error('Error loading dashboard stats:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();

    // Subscribe to realtime conversation updates
    const channel = supabase
      .channel('dashboard_realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'conversations' }, () => {
        fetchDashboardData();
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'messages' }, () => {
        fetchDashboardData();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto overflow-y-auto">
      {/* Top Banner / Hero Card */}
      <div className="relative overflow-hidden bg-gradient-to-r from-slate-900 via-indigo-950/40 to-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl">
        <div className="absolute top-0 right-0 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="flex items-start gap-4">
            <div className="w-14 h-14 rounded-2xl overflow-hidden shadow-xl shadow-amber-500/10 ring-2 ring-amber-500/30 bg-black shrink-0 hidden sm:flex items-center justify-center">
              <img
                src="/branify-logo.jpg"
                alt="Branify Official Logo"
                className="w-full h-full object-cover"
              />
            </div>
            <div>
              <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-full bg-amber-500/20 text-amber-300 text-xs font-semibold border border-amber-500/30 mb-2">
                <Radio className="w-3.5 h-3.5 animate-pulse text-emerald-400" />
                <span>Branify Official Business Hub • BUILD. BRAND. GROW.</span>
              </div>
              <h2 className="text-xl font-bold text-white tracking-tight">
                Welcome back to Branify WhatsApp CRM
              </h2>
              <p className="text-xs text-slate-400 mt-1 max-w-xl">
                Connected to <span className="text-slate-200 font-mono">{BRANIFY_DEFAULTS.username}</span>. Live customer chats, lead pipeline conversions, and Meta Cloud API automations are synchronized in real-time.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            <button
              onClick={() => onSelectView('inbox')}
              className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white font-medium text-xs rounded-xl shadow-lg shadow-indigo-600/25 flex items-center gap-2 transition-all cursor-pointer"
            >
              <MessageSquare className="w-4 h-4" />
              <span>Open Live Inbox</span>
            </button>
            <button
              onClick={() => onSelectView('deals')}
              className="px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 font-medium text-xs rounded-xl border border-slate-700 flex items-center gap-2 transition-all cursor-pointer"
            >
              <TrendingUp className="w-4 h-4 text-emerald-400" />
              <span>View Pipelines</span>
            </button>
          </div>
        </div>
      </div>

      {/* KPI Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Metric 1 */}
        <div className="bg-slate-900/90 border border-slate-800 p-5 rounded-2xl shadow-sm hover:border-slate-700 transition-colors">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-medium text-slate-400">Active Conversations</span>
            <div className="p-2 bg-indigo-950/60 rounded-xl text-indigo-400 border border-indigo-800/40">
              <MessageSquare className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline justify-between">
            <div className="text-2xl font-bold text-white tracking-tight">
              {stats.activeConversations}
            </div>
            {stats.unreadConversations > 0 && (
              <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                {stats.unreadConversations} unread
              </span>
            )}
          </div>
          <p className="text-[11px] text-slate-500 mt-2">Open & pending customer inquiries</p>
        </div>

        {/* Metric 2 */}
        <div className="bg-slate-900/90 border border-slate-800 p-5 rounded-2xl shadow-sm hover:border-slate-700 transition-colors">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-medium text-slate-400">Total Contacts</span>
            <div className="p-2 bg-emerald-950/60 rounded-xl text-emerald-400 border border-emerald-800/40">
              <Users className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline justify-between">
            <div className="text-2xl font-bold text-white tracking-tight">
              {stats.newContacts}
            </div>
            <span className="text-xs text-slate-400">Directory</span>
          </div>
          <p className="text-[11px] text-slate-500 mt-2">Verified WhatsApp customers</p>
        </div>

        {/* Metric 3 */}
        <div className="bg-slate-900/90 border border-slate-800 p-5 rounded-2xl shadow-sm hover:border-slate-700 transition-colors">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-medium text-slate-400">Active Pipeline Value</span>
            <div className="p-2 bg-purple-950/60 rounded-xl text-purple-400 border border-purple-800/40">
              <DollarSign className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline justify-between">
            <div className="text-2xl font-bold text-white tracking-tight">
              ${stats.pipelineValue.toLocaleString()}
            </div>
            <span className="text-xs text-indigo-400 font-medium">
              {stats.openDeals} deals
            </span>
          </div>
          <p className="text-[11px] text-slate-500 mt-2">{stats.wonDeals} deals successfully won</p>
        </div>

        {/* Metric 4 */}
        <div className="bg-slate-900/90 border border-slate-800 p-5 rounded-2xl shadow-sm hover:border-slate-700 transition-colors">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-medium text-slate-400">Broadcast Campaigns</span>
            <div className="p-2 bg-amber-950/60 rounded-xl text-amber-400 border border-amber-800/40">
              <Send className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline justify-between">
            <div className="text-2xl font-bold text-white tracking-tight">
              {stats.broadcastCount}
            </div>
            <span className="text-xs text-emerald-400 font-medium">Opt-in verified</span>
          </div>
          <p className="text-[11px] text-slate-500 mt-2">Targeted Meta audience broadcasts</p>
        </div>
      </div>

      {/* Two Column Grid: Recent Chats & Operational Shortcuts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: Recent Active Conversations */}
        <div className="lg:col-span-2 bg-slate-900/90 border border-slate-800 rounded-2xl p-6 shadow-sm">
          <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-800">
            <div>
              <h3 className="text-sm font-bold text-white">Recent WhatsApp Conversations</h3>
              <p className="text-xs text-slate-400">Latest synchronized customer message threads</p>
            </div>
            <button
              onClick={() => onSelectView('inbox')}
              className="text-xs font-medium text-indigo-400 hover:text-indigo-300 flex items-center gap-1 cursor-pointer"
            >
              <span>View All in Inbox</span>
              <ArrowUpRight className="w-3.5 h-3.5" />
            </button>
          </div>

          {loading ? (
            <div className="py-12 text-center text-slate-500 text-xs flex flex-col items-center gap-2">
              <div className="w-5 h-5 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
              <span>Loading recent chats...</span>
            </div>
          ) : recentConversations.length === 0 ? (
            <div className="py-12 text-center text-slate-500 text-xs space-y-2">
              <MessageSquare className="w-8 h-8 mx-auto text-slate-600 stroke-1" />
              <p className="font-medium text-slate-400">No active conversations yet</p>
              <p className="text-[11px] text-slate-500 max-w-sm mx-auto">
                Incoming WhatsApp messages will appear here automatically via the Meta Cloud API webhook.
              </p>
              <button
                onClick={() => onSelectView('inbox')}
                className="mt-3 px-3 py-1.5 bg-indigo-600/20 text-indigo-300 border border-indigo-500/30 rounded-xl text-xs hover:bg-indigo-600/30 transition-colors cursor-pointer"
              >
                Send First Message
              </button>
            </div>
          ) : (
            <div className="divide-y divide-slate-800/60">
              {recentConversations.map((conv) => {
                const contact = conv.contacts;
                return (
                  <div
                    key={conv.id}
                    onClick={() => {
                      if (onOpenConversation) {
                        onOpenConversation(conv.id);
                      } else {
                        onSelectView('inbox');
                      }
                    }}
                    className="py-3.5 px-3 -mx-3 rounded-xl hover:bg-slate-800/50 transition-colors flex items-center justify-between cursor-pointer group"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-slate-800 to-slate-700 flex items-center justify-center font-bold text-xs text-white uppercase shrink-0 border border-slate-700">
                        {contact?.name?.charAt(0) || 'C'}
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-semibold text-white truncate">
                            {contact?.name || `Customer (+${contact?.wa_id})`}
                          </span>
                          {conv.unread_count > 0 && (
                            <span className="px-1.5 py-0.2 rounded-full bg-emerald-500 text-white text-[10px] font-bold">
                              {conv.unread_count}
                            </span>
                          )}
                        </div>
                        <div className="text-[11px] text-slate-400 font-mono truncate">
                          +{contact?.wa_id}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-3 shrink-0">
                      <div className="text-right">
                        <span
                          className={`text-[10px] font-semibold px-2 py-0.5 rounded-full capitalize ${
                            conv.status === 'open'
                              ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                              : 'bg-slate-800 text-slate-400'
                          }`}
                        >
                          {conv.status}
                        </span>
                        <div className="text-[10px] text-slate-500 mt-1">
                          {new Date(conv.last_message_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </div>
                      </div>
                      <ArrowUpRight className="w-4 h-4 text-slate-600 group-hover:text-indigo-400 transition-colors" />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Right 1 Col: Quick Tools & Status */}
        <div className="space-y-6">
          {/* Quick Operations Card */}
          <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 shadow-sm">
            <h3 className="text-xs font-bold text-white uppercase tracking-wider mb-3">
              Quick Operations
            </h3>
            <div className="space-y-2">
              <button
                onClick={() => onSelectView('inbox')}
                className="w-full text-left p-3 rounded-xl bg-slate-950 border border-slate-800/80 hover:border-indigo-500/40 text-slate-300 hover:text-white transition-all flex items-center justify-between cursor-pointer group"
              >
                <div className="flex items-center gap-2.5">
                  <div className="p-1.5 bg-indigo-950/60 rounded-lg text-indigo-400">
                    <MessageSquare className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="text-xs font-semibold">Live WhatsApp Inbox</div>
                    <div className="text-[10px] text-slate-500">Respond to customer chats</div>
                  </div>
                </div>
                <ArrowUpRight className="w-3.5 h-3.5 text-slate-500 group-hover:text-indigo-400" />
              </button>

              <button
                onClick={() => onSelectView('deals')}
                className="w-full text-left p-3 rounded-xl bg-slate-950 border border-slate-800/80 hover:border-indigo-500/40 text-slate-300 hover:text-white transition-all flex items-center justify-between cursor-pointer group"
              >
                <div className="flex items-center gap-2.5">
                  <div className="p-1.5 bg-purple-950/60 rounded-lg text-purple-400">
                    <TrendingUp className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="text-xs font-semibold">Lead Pipeline</div>
                    <div className="text-[10px] text-slate-500">Track stages & conversions</div>
                  </div>
                </div>
                <ArrowUpRight className="w-3.5 h-3.5 text-slate-500 group-hover:text-purple-400" />
              </button>

              <button
                onClick={() => onSelectView('broadcasts')}
                className="w-full text-left p-3 rounded-xl bg-slate-950 border border-slate-800/80 hover:border-indigo-500/40 text-slate-300 hover:text-white transition-all flex items-center justify-between cursor-pointer group"
              >
                <div className="flex items-center gap-2.5">
                  <div className="p-1.5 bg-amber-950/60 rounded-lg text-amber-400">
                    <Send className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="text-xs font-semibold">Audience Broadcast</div>
                    <div className="text-[10px] text-slate-500">Launch marketing campaign</div>
                  </div>
                </div>
                <ArrowUpRight className="w-3.5 h-3.5 text-slate-500 group-hover:text-amber-400" />
              </button>
            </div>
          </div>

          {/* Compliance & Opt-in Safeguard Badge */}
          <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-xs font-bold text-emerald-400">
                <CheckCircle2 className="w-4 h-4" />
                <span>Meta WhatsApp Policy Guard</span>
              </div>
              <span className="text-[9px] font-mono font-bold px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                Compliant
              </span>
            </div>
            <p className="text-[11px] text-slate-400 leading-relaxed">
              Opt-in consent is strictly enforced for broadcasts. Contacts replying with <span className="text-white font-mono">STOP</span> or <span className="text-white font-mono">UNSUBSCRIBE</span> are immediately opted out.
            </p>
            <button
              onClick={() => onSelectView('privacy_policy')}
              className="w-full py-2 px-3 rounded-xl bg-slate-950 hover:bg-slate-800/80 border border-slate-800 text-amber-400 hover:text-amber-300 text-xs font-medium flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
            >
              <span>View In-Dashboard Privacy & Compliance</span>
              <ArrowUpRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
