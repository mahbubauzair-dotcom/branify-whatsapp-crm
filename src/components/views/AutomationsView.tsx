import React, { useState, useEffect } from 'react';
import {
  Workflow,
  Plus,
  Play,
  Pause,
  Zap,
  CheckCircle2,
  AlertCircle,
  FileCode2,
  Clock,
  Tag as TagIcon,
  X,
  RotateCcw,
} from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { AutomationRule } from '../../types/crm';

export const AutomationsView: React.FC = () => {
  const [automations, setAutomations] = useState<AutomationRule[]>([]);
  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Modal
  const [showAddModal, setShowAddModal] = useState(false);
  const [name, setName] = useState('');
  const [triggerType, setTriggerType] = useState('incoming_keyword');
  const [triggerKeyword, setTriggerKeyword] = useState('');
  const [actionType, setActionType] = useState('send_auto_reply');
  const [actionPayload, setActionPayload] = useState('');

  const fetchAutomationsData = async () => {
    setLoading(true);
    try {
      // 1. Rules
      const { data: rulesData } = await supabase
        .from('automation_rules')
        .select('*')
        .order('created_at', { ascending: false });

      // 2. Execution Logs
      const { data: logsData } = await supabase
        .from('automation_logs')
        .select('*')
        .order('executed_at', { ascending: false })
        .limit(20);

      if (rulesData) setAutomations(rulesData as AutomationRule[]);
      if (logsData) setLogs(logsData as any);
    } catch (e) {
      console.error('Error fetching automations:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAutomationsData();
  }, []);

  const handleToggleActive = async (id: string, currentStatus: boolean) => {
    try {
      await supabase
        .from('automation_rules')
        .update({ is_active: !currentStatus })
        .eq('id', id);

      setAutomations((prev) =>
        prev.map((a) => (a.id === id ? { ...a, is_active: !currentStatus } : a))
      );
    } catch (e) {
      console.error('Error toggling rule:', e);
    }
  };

  const handleCreateAutomation = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    try {
      const { data: ws } = await supabase.from('workspaces').select('id').eq('slug', 'branify').single();
      if (!ws?.id) return;

      const triggerConfig = triggerType === 'incoming_keyword'
        ? { keyword: triggerKeyword.trim().toLowerCase() }
        : {};

      const actionConfig = {
        message: actionPayload.trim(),
      };

      const { data, error } = await supabase
        .from('automation_rules')
        .insert({
          workspace_id: ws.id,
          name: name.trim(),
          trigger_type: triggerType,
          trigger_config: triggerConfig,
          action_type: actionType,
          action_config: actionConfig,
          is_active: true,
        })
        .select()
        .single();

      if (data) {
        setAutomations((prev) => [data as AutomationRule, ...prev]);
        setShowAddModal(false);
        setName('');
        setTriggerKeyword('');
        setActionPayload('');
      }
    } catch (err) {
      console.error('Error creating automation rule:', err);
    }
  };

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto overflow-y-auto">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-bold text-white tracking-tight flex items-center gap-2">
            <Workflow className="w-5 h-5 text-indigo-400" />
            <span>Workflow Automations</span>
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Event triggers, keyword-based auto replies, and instant contact workflows
          </p>
        </div>

        <button
          onClick={() => setShowAddModal(true)}
          className="px-3.5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-medium flex items-center gap-1.5 transition-all shadow-lg shadow-indigo-600/25 cursor-pointer self-start sm:self-auto"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>New Automation</span>
        </button>
      </div>

      {/* Rules Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {loading ? (
          <div className="col-span-full py-12 text-center text-slate-500 text-xs flex flex-col items-center gap-2">
            <div className="w-5 h-5 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
            <span>Loading automation rules...</span>
          </div>
        ) : automations.length === 0 ? (
          <div className="col-span-full py-12 text-center text-slate-500 text-xs">
            No automation rules configured yet.
          </div>
        ) : (
          automations.map((rule) => (
            <div
              key={rule.id}
              className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 flex flex-col justify-between space-y-4 hover:border-slate-700 transition-colors shadow-sm"
            >
              <div>
                <div className="flex items-start justify-between gap-2 mb-2">
                  <h3 className="text-xs font-bold text-white">{rule.name}</h3>
                  <button
                    onClick={() => handleToggleActive(rule.id, rule.is_active)}
                    className={`px-2 py-0.5 rounded-full text-[10px] font-bold border transition-colors cursor-pointer flex items-center gap-1 ${
                      rule.is_active
                        ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30'
                        : 'bg-slate-800 text-slate-400 border-slate-700'
                    }`}
                  >
                    {rule.is_active ? <Play className="w-2.5 h-2.5" /> : <Pause className="w-2.5 h-2.5" />}
                    <span>{rule.is_active ? 'ACTIVE' : 'PAUSED'}</span>
                  </button>
                </div>

                <div className="space-y-2 mt-3 text-xs">
                  {/* Trigger */}
                  <div className="p-2.5 bg-slate-950 rounded-xl border border-slate-800/80 flex items-center gap-2">
                    <Zap className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                    <div className="min-w-0">
                      <div className="text-[10px] text-slate-500 uppercase font-semibold">When:</div>
                      <div className="text-slate-300 font-mono truncate">
                        {rule.trigger_type === 'incoming_keyword'
                          ? `Keyword matches "${rule.trigger_config?.keyword || 'any'}"`
                          : rule.trigger_type}
                      </div>
                    </div>
                  </div>

                  {/* Action */}
                  <div className="p-2.5 bg-slate-950 rounded-xl border border-slate-800/80 flex items-center gap-2">
                    <Workflow className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
                    <div className="min-w-0">
                      <div className="text-[10px] text-slate-500 uppercase font-semibold">Then:</div>
                      <div className="text-slate-300 font-mono truncate">
                        {rule.action_type === 'send_auto_reply'
                          ? `Auto-reply: "${rule.action_config?.message || '...'}"`
                          : rule.action_type}
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="text-[10px] text-slate-500 font-mono pt-2 border-t border-slate-800/80">
                Created: {new Date(rule.created_at).toLocaleDateString()}
              </div>
            </div>
          ))
        )}
      </div>

      {/* Execution Logs */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 shadow-sm">
        <h3 className="text-xs font-bold text-white uppercase tracking-wider mb-3">
          Recent Automation Execution History
        </h3>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-300">
            <thead className="text-[10px] uppercase text-slate-500 font-semibold border-b border-slate-800">
              <tr>
                <th className="py-2.5 px-3">Trigger Event</th>
                <th className="py-2.5 px-3">Execution Status</th>
                <th className="py-2.5 px-3 text-right">Timestamp</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 font-mono text-[11px]">
              {logs.length === 0 ? (
                <tr>
                  <td colSpan={3} className="py-6 text-center text-slate-500 font-sans text-xs">
                    No automation executions recorded yet.
                  </td>
                </tr>
              ) : (
                logs.map((log) => (
                  <tr key={log.id} className="hover:bg-slate-800/30">
                    <td className="py-2.5 px-3 text-slate-300">
                      {log.trigger_event || 'Keyword Triggered'}
                    </td>
                    <td className="py-2.5 px-3">
                      <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 text-[10px] font-bold border border-emerald-500/30">
                        {log.status}
                      </span>
                    </td>
                    <td className="py-2.5 px-3 text-right text-slate-500">
                      {new Date(log.executed_at).toLocaleTimeString()}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add Automation Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-lg w-full p-6 shadow-2xl">
            <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-800">
              <h3 className="text-sm font-bold text-white">Create Automation Workflow</h3>
              <button onClick={() => setShowAddModal(false)} className="text-slate-400 hover:text-white">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateAutomation} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Workflow Title *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Price Inquiry Instant Reply"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl py-2 px-3 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Trigger Event *</label>
                <select
                  value={triggerType}
                  onChange={(e) => setTriggerType(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl py-2 px-3 text-xs text-white focus:outline-none focus:border-indigo-500 cursor-pointer"
                >
                  <option value="incoming_keyword">Incoming Message Contains Keyword</option>
                  <option value="new_contact">New Customer Contact Created</option>
                </select>
              </div>

              {triggerType === 'incoming_keyword' && (
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">Match Keyword *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. price, catalog, quote, info"
                    value={triggerKeyword}
                    onChange={(e) => setTriggerKeyword(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl py-2 px-3 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 font-mono"
                  />
                </div>
              )}

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Auto-Reply Message *</label>
                <textarea
                  rows={3}
                  required
                  placeholder="Hello! Thank you for reaching out to Branify. Our pricing starts at $49/mo..."
                  value={actionPayload}
                  onChange={(e) => setActionPayload(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 bg-slate-800 text-slate-300 rounded-xl text-xs font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-medium"
                >
                  Activate Workflow
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
