import React, { useState, useEffect } from 'react';
import {
  BookOpen,
  Plus,
  Sparkles,
  ShieldCheck,
  Search,
  Tag as TagIcon,
  X,
  CheckCircle2,
  Trash2,
} from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { KnowledgeBaseItem } from '../../types/crm';

export const KnowledgeBaseView: React.FC = () => {
  const [articles, setArticles] = useState<KnowledgeBaseItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  // Modal
  const [showAddModal, setShowAddModal] = useState(false);
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState('pricing');
  const [content, setContent] = useState('');

  const fetchKnowledgeBase = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('knowledge_base')
        .select('*')
        .order('created_at', { ascending: false });

      if (data) setArticles(data as KnowledgeBaseItem[]);
    } catch (e) {
      console.error('Error fetching knowledge base:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchKnowledgeBase();
  }, []);

  const handleCreateArticle = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !content.trim()) return;

    try {
      const { data: ws } = await supabase.from('workspaces').select('id').eq('slug', 'branify').single();
      if (!ws?.id) return;

      const { data, error } = await supabase
        .from('knowledge_base')
        .insert({
          workspace_id: ws.id,
          title: title.trim(),
          category,
          content: content.trim(),
          is_active: true,
        })
        .select()
        .single();

      if (data) {
        setArticles((prev) => [data as KnowledgeBaseItem, ...prev]);
        setShowAddModal(false);
        setTitle('');
        setContent('');
      }
    } catch (err) {
      console.error('Error creating knowledge article:', err);
    }
  };

  const handleDeleteArticle = async (id: string) => {
    try {
      await supabase.from('knowledge_base').delete().eq('id', id);
      setArticles((prev) => prev.filter((a) => a.id !== id));
    } catch (e) {
      console.error('Error deleting article:', e);
    }
  };

  const filteredArticles = articles.filter((a) => {
    if (selectedCategory !== 'all' && a.category !== selectedCategory) return false;
    return true;
  });

  return (
    <div className="p-6 space-y-6 max-w-5xl mx-auto overflow-y-auto">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-bold text-white tracking-tight flex items-center gap-2">
            <BookOpen className="w-5 h-5 text-indigo-400" />
            <span>Branify Verified Knowledge Base</span>
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Official business knowledge base used by the Gemini AI Copilot to answer customer questions accurately without hallucinations
          </p>
        </div>

        <button
          onClick={() => setShowAddModal(true)}
          className="px-3.5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-medium flex items-center gap-1.5 transition-all shadow-lg shadow-indigo-600/25 cursor-pointer self-start sm:self-auto"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>Add Knowledge Article</span>
        </button>
      </div>

      {/* AI Grounding Notice */}
      <div className="bg-purple-950/20 border border-purple-800/40 rounded-2xl p-4 flex items-center gap-3">
        <div className="p-2 bg-purple-900/60 rounded-xl text-purple-400 shrink-0">
          <Sparkles className="w-5 h-5" />
        </div>
        <div className="text-xs text-slate-300">
          <span className="font-bold text-white">AI Grounding Security: </span>
          When customers ask about prices, refund policies, or delivery terms, the AI strictly consults these verified records and refuses to invent unverified discounts or timelines.
        </div>
      </div>

      {/* Category Tabs */}
      <div className="flex items-center gap-1 bg-slate-900/60 p-1.5 rounded-2xl border border-slate-800 w-fit">
        {(['all', 'pricing', 'services', 'faq', 'policies'] as const).map((cat) => (
          <button
            key={cat}
            onClick={() => setSelectedCategory(cat)}
            className={`px-3 py-1 text-xs rounded-xl font-medium capitalize transition-colors cursor-pointer ${
              selectedCategory === cat
                ? 'bg-indigo-600 text-white shadow-sm font-semibold'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Articles Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {loading ? (
          <div className="col-span-full py-12 text-center text-slate-500 text-xs flex flex-col items-center gap-2">
            <div className="w-5 h-5 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
            <span>Loading knowledge base...</span>
          </div>
        ) : filteredArticles.length === 0 ? (
          <div className="col-span-full py-12 text-center text-slate-500 text-xs">
            No knowledge articles in this category.
          </div>
        ) : (
          filteredArticles.map((art) => (
            <div
              key={art.id}
              className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 flex flex-col justify-between space-y-3 hover:border-slate-700 transition-colors shadow-sm"
            >
              <div>
                <div className="flex items-start justify-between gap-2 mb-2">
                  <h3 className="text-sm font-bold text-white">{art.title}</h3>
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 font-mono uppercase">
                    {art.category}
                  </span>
                </div>

                <p className="text-xs text-slate-300 whitespace-pre-wrap leading-relaxed bg-slate-950 p-3 rounded-xl border border-slate-800/80">
                  {art.content}
                </p>
              </div>

              <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between text-[11px]">
                <span className="text-emerald-400 font-medium flex items-center gap-1 text-[10px]">
                  <CheckCircle2 className="w-3 h-3" /> Grounded in AI
                </span>
                <button
                  onClick={() => handleDeleteArticle(art.id)}
                  className="text-slate-500 hover:text-red-400 transition-colors cursor-pointer"
                  title="Delete Article"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Add Knowledge Article Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-lg w-full p-6 shadow-2xl">
            <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-800">
              <h3 className="text-sm font-bold text-white">Add Knowledge Base Article</h3>
              <button onClick={() => setShowAddModal(false)} className="text-slate-400 hover:text-white">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateArticle} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Article Title *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Starter Package Pricing & Deliverables"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl py-2 px-3 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Category *</label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl py-2 px-3 text-xs text-white focus:outline-none focus:border-indigo-500 cursor-pointer"
                >
                  <option value="pricing">Pricing & Rates</option>
                  <option value="services">Services & Deliverables</option>
                  <option value="faq">Frequently Asked Questions (FAQ)</option>
                  <option value="policies">Policies & Terms</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Article Content *</label>
                <textarea
                  rows={5}
                  required
                  placeholder="Enter exact facts, prices, contact emails, turnaround times..."
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
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
                  Save & Ground AI
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
