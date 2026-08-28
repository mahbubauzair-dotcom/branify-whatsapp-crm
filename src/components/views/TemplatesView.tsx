import React, { useState, useEffect } from 'react';
import {
  FileCode2,
  Plus,
  CheckCircle2,
  Clock,
  XCircle,
  Search,
  Filter,
  Copy,
  Check,
  X,
  Sparkles,
} from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { MessageTemplate } from '../../types/crm';

export const TemplatesView: React.FC = () => {
  const [templates, setTemplates] = useState<MessageTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Modal
  const [showAddModal, setShowAddModal] = useState(false);
  const [name, setName] = useState('');
  const [category, setCategory] = useState<'MARKETING' | 'UTILITY' | 'AUTHENTICATION'>('UTILITY');
  const [language, setLanguage] = useState('en_US');
  const [body, setBody] = useState('');
  const [headerType, setHeaderType] = useState<string>('NONE');
  const [headerText, setHeaderText] = useState('');
  const [footerText, setFooterText] = useState('');

  const fetchTemplates = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('message_templates')
        .select('*')
        .order('created_at', { ascending: false });

      if (data) setTemplates(data as MessageTemplate[]);
    } catch (e) {
      console.error('Error fetching templates:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTemplates();
  }, []);

  const handleCreateTemplate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !body.trim()) return;

    try {
      const { data: ws } = await supabase.from('workspaces').select('id').eq('slug', 'branify').single();
      if (!ws?.id) return;

      const formattedName = name.trim().toLowerCase().replace(/[^a-z0-9_]/g, '_');

      const { data, error } = await supabase
        .from('message_templates')
        .insert({
          workspace_id: ws.id,
          name: formattedName,
          category,
          language,
          body: body.trim(),
          header_type: headerType === 'NONE' ? null : headerType,
          header_content: headerText.trim() || null,
          footer_content: footerText.trim() || null,
          status: 'PENDING', // Meta templates submitted start in PENDING
        })
        .select()
        .single();

      if (data) {
        setTemplates((prev) => [data as MessageTemplate, ...prev]);
        setShowAddModal(false);
        setName('');
        setBody('');
        setHeaderText('');
        setFooterText('');
      }
    } catch (err) {
      console.error('Error creating template:', err);
    }
  };

  const copyTemplate = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const filteredTemplates = templates.filter((t) => {
    if (categoryFilter !== 'all' && t.category !== categoryFilter) return false;
    return true;
  });

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto overflow-y-auto">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-bold text-white tracking-tight flex items-center gap-2">
            <FileCode2 className="w-5 h-5 text-indigo-400" />
            <span>Meta Message Templates Catalog</span>
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Pre-approved WhatsApp Cloud API templates for initiating outbound customer conversations
          </p>
        </div>

        <button
          onClick={() => setShowAddModal(true)}
          className="px-3.5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-medium flex items-center gap-1.5 transition-all shadow-lg shadow-indigo-600/25 cursor-pointer self-start sm:self-auto"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>New Template</span>
        </button>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-1 bg-slate-900/60 p-1.5 rounded-2xl border border-slate-800 w-fit">
        {(['all', 'MARKETING', 'UTILITY', 'AUTHENTICATION'] as const).map((cat) => (
          <button
            key={cat}
            onClick={() => setCategoryFilter(cat)}
            className={`px-3 py-1 text-xs rounded-xl font-medium capitalize transition-colors cursor-pointer ${
              categoryFilter === cat
                ? 'bg-indigo-600 text-white shadow-sm font-semibold'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Templates Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {loading ? (
          <div className="col-span-full py-12 text-center text-slate-500 text-xs flex flex-col items-center gap-2">
            <div className="w-5 h-5 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
            <span>Loading template catalog...</span>
          </div>
        ) : filteredTemplates.length === 0 ? (
          <div className="col-span-full py-12 text-center text-slate-500 text-xs">
            No message templates found in this category.
          </div>
        ) : (
          filteredTemplates.map((tmpl) => (
            <div
              key={tmpl.id}
              className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 flex flex-col justify-between space-y-3 hover:border-slate-700 transition-colors shadow-sm"
            >
              <div>
                <div className="flex items-start justify-between gap-2 mb-2">
                  <div className="font-bold text-xs text-white font-mono truncate">
                    {tmpl.name}
                  </div>
                  <span
                    className={`text-[10px] font-semibold px-2 py-0.5 rounded-full uppercase border shrink-0 ${
                      tmpl.status === 'APPROVED'
                        ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30'
                        : tmpl.status === 'PENDING'
                        ? 'bg-amber-500/20 text-amber-300 border-amber-500/30'
                        : 'bg-red-500/20 text-red-300 border-red-500/30'
                    }`}
                  >
                    {tmpl.status}
                  </span>
                </div>

                <div className="flex items-center gap-2 text-[10px] text-slate-400 mb-3 font-mono">
                  <span className="px-1.5 py-0.5 bg-slate-950 rounded border border-slate-800 uppercase">
                    {tmpl.category}
                  </span>
                  <span>{tmpl.language}</span>
                </div>

                {tmpl.header_content && (
                  <div className="text-[11px] font-bold text-slate-300 mb-1">
                    {tmpl.header_content}
                  </div>
                )}

                <p className="text-xs text-slate-300 whitespace-pre-wrap font-sans leading-relaxed bg-slate-950 p-3 rounded-xl border border-slate-800/80">
                  {tmpl.body}
                </p>

                {tmpl.footer_content && (
                  <p className="text-[10px] text-slate-500 mt-1 italic">
                    {tmpl.footer_content}
                  </p>
                )}
              </div>

              <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between">
                <span className="text-[10px] text-slate-500 font-mono">
                  Variables: {(tmpl.body.match(/\{\{\d+\}\}/g) || []).length}
                </span>
                <button
                  onClick={() => copyTemplate(tmpl.body, tmpl.id)}
                  className="text-xs text-indigo-400 hover:text-indigo-300 flex items-center gap-1 font-medium cursor-pointer"
                >
                  {copiedId === tmpl.id ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copiedId === tmpl.id ? 'Copied' : 'Copy'}</span>
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Add Template Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-lg w-full p-6 shadow-2xl">
            <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-800">
              <h3 className="text-sm font-bold text-white">Create Meta Message Template</h3>
              <button onClick={() => setShowAddModal(false)} className="text-slate-400 hover:text-white">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateTemplate} className="space-y-3.5">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  Template Name (lowercase, snake_case) *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. order_confirmation_v2"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl py-2 px-3 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 font-mono"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">Category *</label>
                  <select
                    value={category}
                    onChange={(e: any) => setCategory(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl py-2 px-3 text-xs text-white focus:outline-none focus:border-indigo-500 cursor-pointer font-mono"
                  >
                    <option value="UTILITY">UTILITY</option>
                    <option value="MARKETING">MARKETING</option>
                    <option value="AUTHENTICATION">AUTHENTICATION</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">Language *</label>
                  <select
                    value={language}
                    onChange={(e) => setLanguage(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl py-2 px-3 text-xs text-white focus:outline-none focus:border-indigo-500 cursor-pointer font-mono"
                  >
                    <option value="en_US">English (US)</option>
                    <option value="en_GB">English (UK)</option>
                    <option value="ur">Urdu</option>
                    <option value="ar">Arabic</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  Message Body (Use {'{{1}}'}, {'{{2}}'} for dynamic variables) *
                </label>
                <textarea
                  rows={4}
                  required
                  placeholder="Hello {{1}}, your order #{{2}} has been confirmed!"
                  value={body}
                  onChange={(e) => setBody(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 font-mono"
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
                  Save Template
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
