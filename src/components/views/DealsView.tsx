import React, { useState, useEffect } from 'react';
import {
  Kanban,
  Plus,
  DollarSign,
  User,
  ArrowRight,
  MoreVertical,
  Calendar,
  Sparkles,
  X,
  TrendingUp,
} from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { Deal, PipelineStage, Contact } from '../../types/crm';

export const DealsView: React.FC = () => {
  const [stages, setStages] = useState<PipelineStage[]>([]);
  const [deals, setDeals] = useState<Deal[]>([]);
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [loading, setLoading] = useState(true);

  // Modal
  const [showAddModal, setShowAddModal] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newValue, setNewValue] = useState('1000');
  const [newContactId, setNewContactId] = useState('');
  const [newStageId, setNewStageId] = useState('');

  const fetchPipelineData = async () => {
    setLoading(true);
    try {
      // 1. Stages
      const { data: stagesData } = await supabase
        .from('pipeline_stages')
        .select('*')
        .order('stage_order', { ascending: true });

      // 2. Deals
      const { data: dealsData } = await supabase
        .from('deals')
        .select('*, contact:contacts(*)')
        .order('created_at', { ascending: false });

      // 3. Contacts for dropdown
      const { data: contactsData } = await supabase
        .from('contacts')
        .select('id, name, wa_id')
        .order('name');

      if (stagesData) setStages(stagesData as PipelineStage[]);
      if (dealsData) setDeals(dealsData as Deal[]);
      if (contactsData) setContacts(contactsData as Contact[]);
      if (stagesData && stagesData.length > 0 && !newStageId) {
        setNewStageId(stagesData[0].id);
      }
    } catch (err) {
      console.error('Error fetching pipeline data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPipelineData();
  }, []);

  const handleCreateDeal = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim() || !newContactId || !newStageId) return;

    try {
      const { data: ws } = await supabase.from('workspaces').select('id').eq('slug', 'branify').single();
      if (!ws?.id) return;

      const { data, error } = await supabase
        .from('deals')
        .insert({
          workspace_id: ws.id,
          stage_id: newStageId,
          contact_id: newContactId,
          title: newTitle.trim(),
          value: parseFloat(newValue) || 0,
        })
        .select('*, contact:contacts(*)')
        .single();

      if (data && !error) {
        setDeals((prev) => [data as Deal, ...prev]);
        setShowAddModal(false);
        setNewTitle('');
        setNewValue('1000');
      }
    } catch (e) {
      console.error('Error creating deal:', e);
    }
  };

  const handleMoveStage = async (dealId: string, targetStageId: string) => {
    try {
      await supabase
        .from('deals')
        .update({ stage_id: targetStageId })
        .eq('id', dealId);

      setDeals((prev) =>
        prev.map((d) => (d.id === dealId ? { ...d, stage_id: targetStageId } : d))
      );
    } catch (e) {
      console.error('Error moving deal stage:', e);
    }
  };

  const totalPipelineValue = deals.reduce((acc, d) => acc + (Number(d.value) || 0), 0);

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto flex flex-col h-[calc(100vh-4rem)] overflow-hidden">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 shrink-0">
        <div>
          <h2 className="text-lg font-bold text-white tracking-tight flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-indigo-400" />
            <span>Sales Pipeline & Revenue Stages</span>
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Total Pipeline Potential:{' '}
            <span className="text-emerald-400 font-bold font-mono">
              ${totalPipelineValue.toLocaleString()}
            </span>{' '}
            across {deals.length} deals
          </p>
        </div>

        <button
          onClick={() => setShowAddModal(true)}
          className="px-3.5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-medium flex items-center gap-1.5 transition-all shadow-lg shadow-indigo-600/25 cursor-pointer self-start sm:self-auto"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>New Deal</span>
        </button>
      </div>

      {/* Kanban Board Columns */}
      <div className="flex-1 overflow-x-auto pb-4 flex gap-4 min-h-0">
        {loading ? (
          <div className="py-12 text-center text-slate-500 text-xs w-full flex flex-col items-center gap-2">
            <div className="w-6 h-6 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
            <span>Loading pipeline stages...</span>
          </div>
        ) : (
          stages.map((stage, idx) => {
            const stageDeals = deals.filter((d) => d.stage_id === stage.id);
            const stageTotal = stageDeals.reduce((sum, d) => sum + (Number(d.value) || 0), 0);

            return (
              <div
                key={stage.id}
                className="w-72 bg-slate-900/70 border border-slate-800 rounded-2xl flex flex-col shrink-0 shadow-sm overflow-hidden"
              >
                {/* Column Header */}
                <div className="p-3.5 border-b border-slate-800 bg-slate-950/60 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div
                      className="w-2.5 h-2.5 rounded-full"
                      style={{ backgroundColor: stage.color || '#6366F1' }}
                    />
                    <h3 className="text-xs font-bold text-white truncate">{stage.name}</h3>
                    <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-slate-800 text-slate-300 font-mono">
                      {stageDeals.length}
                    </span>
                  </div>
                  <span className="text-xs font-bold text-slate-400 font-mono">
                    ${stageTotal.toLocaleString()}
                  </span>
                </div>

                {/* Deal Cards Container */}
                <div className="flex-1 overflow-y-auto p-3 space-y-2.5">
                  {stageDeals.length === 0 ? (
                    <div className="py-8 text-center text-[11px] text-slate-600">
                      No deals in {stage.name}
                    </div>
                  ) : (
                    stageDeals.map((deal) => (
                      <div
                        key={deal.id}
                        className="p-3.5 bg-slate-950 border border-slate-800/90 hover:border-slate-700 rounded-xl space-y-2.5 shadow-sm transition-all group"
                      >
                        <div className="flex items-start justify-between">
                          <h4 className="text-xs font-semibold text-white group-hover:text-indigo-300 transition-colors">
                            {deal.title}
                          </h4>
                          <span className="text-xs font-bold text-emerald-400 font-mono">
                            ${Number(deal.value).toLocaleString()}
                          </span>
                        </div>

                        {deal.contact && (
                          <div className="flex items-center gap-1.5 text-[11px] text-slate-400">
                            <User className="w-3 h-3 text-slate-500" />
                            <span className="truncate">{deal.contact.name || '+' + deal.contact.wa_id}</span>
                          </div>
                        )}

                        {/* Move Stage Quick Action */}
                        <div className="pt-2 border-t border-slate-900 flex items-center justify-between text-[10px]">
                          <span className="text-slate-500 font-mono">
                            {new Date(deal.created_at).toLocaleDateString()}
                          </span>
                          <select
                            value={deal.stage_id}
                            onChange={(e) => handleMoveStage(deal.id, e.target.value)}
                            className="bg-slate-900 border border-slate-800 text-slate-300 rounded px-1.5 py-0.5 text-[10px] focus:outline-none focus:border-indigo-500 cursor-pointer"
                          >
                            {stages.map((s) => (
                              <option key={s.id} value={s.id}>
                                Move: {s.name}
                              </option>
                            ))}
                          </select>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Add Deal Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-md w-full p-6 shadow-2xl">
            <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-800">
              <h3 className="text-sm font-bold text-white">Create Sales Deal</h3>
              <button onClick={() => setShowAddModal(false)} className="text-slate-400 hover:text-white">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateDeal} className="space-y-3.5">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Deal Title *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Enterprise Branding Retainer"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl py-2 px-3 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Customer / Contact *</label>
                <select
                  required
                  value={newContactId}
                  onChange={(e) => setNewContactId(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl py-2 px-3 text-xs text-white focus:outline-none focus:border-indigo-500 cursor-pointer"
                >
                  <option value="">Select customer...</option>
                  {contacts.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name || 'Customer'} (+{c.wa_id})
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">Deal Value (USD) *</label>
                  <input
                    type="number"
                    required
                    value={newValue}
                    onChange={(e) => setNewValue(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl py-2 px-3 text-xs text-white focus:outline-none focus:border-indigo-500 font-mono"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">Initial Stage *</label>
                  <select
                    value={newStageId}
                    onChange={(e) => setNewStageId(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl py-2 px-3 text-xs text-white focus:outline-none focus:border-indigo-500 cursor-pointer"
                  >
                    {stages.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-3">
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
                  Save Deal
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
