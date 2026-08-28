import React, { useState, useEffect } from 'react';
import {
  Users,
  Search,
  Plus,
  Download,
  Upload,
  CheckCircle2,
  XCircle,
  Phone,
  Mail,
  Building,
  Tag as TagIcon,
  MessageSquare,
  X,
  FileSpreadsheet,
  AlertCircle,
  Clock,
  Sparkles,
} from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { Contact, Tag } from '../../types/crm';

interface ContactsViewProps {
  onOpenConversation?: (conversationId: string) => void;
}

export const ContactsView: React.FC<ContactsViewProps> = ({ onOpenConversation }) => {
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [optInFilter, setOptInFilter] = useState<'all' | 'opted_in' | 'opted_out'>('all');

  // Modals
  const [showAddModal, setShowAddModal] = useState(false);
  const [newWaId, setNewWaId] = useState('');
  const [newName, setNewName] = useState('');
  const [newEmail, setNewEmail] = useState('');
  const [newCompany, setNewCompany] = useState('');
  const [newNotes, setNewNotes] = useState('');
  const [modalError, setModalError] = useState<string | null>(null);

  // CSV Import Modal
  const [showImportModal, setShowImportModal] = useState(false);
  const [csvText, setCsvText] = useState('');
  const [importStatus, setImportStatus] = useState<string | null>(null);

  const fetchContacts = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('contacts')
        .select('*')
        .order('created_at', { ascending: false });

      if (!error && data) {
        setContacts(data as Contact[]);
      }
    } catch (e) {
      console.error('Error loading contacts:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchContacts();
  }, []);

  const handleAddContact = async (e: React.FormEvent) => {
    e.preventDefault();
    setModalError(null);

    const cleanWaId = newWaId.replace(/\D/g, '');
    if (cleanWaId.length < 9) {
      setModalError('Please enter a valid WhatsApp international phone number.');
      return;
    }

    try {
      const { data: ws } = await supabase.from('workspaces').select('id').eq('slug', 'branify').single();
      if (!ws?.id) throw new Error('Branify workspace not found');

      const { data, error } = await supabase
        .from('contacts')
        .insert({
          workspace_id: ws.id,
          wa_id: cleanWaId,
          name: newName.trim() || `Customer (+${cleanWaId})`,
          email: newEmail.trim() || null,
          company: newCompany.trim() || null,
          notes: newNotes.trim() || null,
          marketing_opt_in: false, // Default strictly false
        })
        .select()
        .single();

      if (error) throw error;

      if (data) {
        setContacts((prev) => [data as Contact, ...prev]);
        setShowAddModal(false);
        setNewWaId('');
        setNewName('');
        setNewEmail('');
        setNewCompany('');
        setNewNotes('');
      }
    } catch (err: any) {
      setModalError(err.message || 'Failed to add contact');
    }
  };

  const exportToCSV = () => {
    if (contacts.length === 0) return;
    const headers = ['wa_id', 'name', 'email', 'company', 'lead_score', 'marketing_opt_in', 'consent_source', 'notes'];
    const rows = contacts.map(c => [
      `"${c.wa_id}"`,
      `"${c.name || ''}"`,
      `"${c.email || ''}"`,
      `"${c.company || ''}"`,
      c.lead_score,
      c.marketing_opt_in ? 'TRUE' : 'FALSE',
      `"${c.consent_source || ''}"`,
      `"${(c.notes || '').replace(/"/g, '""')}"`
    ]);

    const csvContent = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `branify_contacts_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleImportCSV = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!csvText.trim()) return;

    try {
      const { data: ws } = await supabase.from('workspaces').select('id').eq('slug', 'branify').single();
      if (!ws?.id) throw new Error('Branify workspace not found');

      const lines = csvText.trim().split('\n');
      let count = 0;

      for (let i = 1; i < lines.length; i++) {
        const line = lines[i].trim();
        if (!line) continue;
        const parts = line.split(',').map(p => p.replace(/^"|"$/g, '').trim());
        const wa_id = parts[0]?.replace(/\D/g, '');
        const name = parts[1] || `Customer (+${wa_id})`;
        const email = parts[2] || null;
        const company = parts[3] || null;

        if (wa_id) {
          await supabase
            .from('contacts')
            .upsert({
              workspace_id: ws.id,
              wa_id,
              name,
              email,
              company,
              marketing_opt_in: false, // strictly default to false on bulk imports
            }, { onConflict: 'workspace_id,wa_id' });
          count++;
        }
      }

      setImportStatus(`Successfully imported/updated ${count} contacts.`);
      setTimeout(() => {
        setShowImportModal(false);
        setImportStatus(null);
        setCsvText('');
        fetchContacts();
      }, 1500);
    } catch (err: any) {
      setImportStatus(`Import Error: ${err.message}`);
    }
  };

  const filteredContacts = contacts.filter((c) => {
    if (optInFilter === 'opted_in' && !c.marketing_opt_in) return false;
    if (optInFilter === 'opted_out' && c.marketing_opt_in) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const name = (c.name || '').toLowerCase();
      const phone = c.wa_id;
      const email = (c.email || '').toLowerCase();
      const company = (c.company || '').toLowerCase();
      return name.includes(q) || phone.includes(q) || email.includes(q) || company.includes(q);
    }
    return true;
  });

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto overflow-y-auto">
      {/* Header & Action Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-bold text-white tracking-tight flex items-center gap-2">
            <Users className="w-5 h-5 text-indigo-400" />
            <span>Customer Directory ({filteredContacts.length})</span>
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Verified WhatsApp audience records with GDPR & Meta opt-in compliance enforcement
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={exportToCSV}
            className="px-3 py-2 bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-800 rounded-xl text-xs font-medium flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export CSV</span>
          </button>

          <button
            onClick={() => setShowImportModal(true)}
            className="px-3 py-2 bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-800 rounded-xl text-xs font-medium flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <Upload className="w-3.5 h-3.5" />
            <span>Import CSV</span>
          </button>

          <button
            onClick={() => setShowAddModal(true)}
            className="px-3.5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-medium flex items-center gap-1.5 transition-all shadow-lg shadow-indigo-600/25 cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add Contact</span>
          </button>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-slate-900/60 p-3 rounded-2xl border border-slate-800">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
          <input
            type="text"
            placeholder="Search by name, phone, email, or company..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-slate-950 border border-slate-800 rounded-xl py-1.5 pl-9 pr-3 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
          />
        </div>

        <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-xl border border-slate-800 text-xs w-full sm:w-auto">
          {(['all', 'opted_in', 'opted_out'] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setOptInFilter(tab)}
              className={`px-3 py-1 rounded-lg capitalize font-medium transition-colors cursor-pointer ${
                optInFilter === tab
                  ? 'bg-indigo-600 text-white shadow-sm font-semibold'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              {tab.replace('_', ' ')}
            </button>
          ))}
        </div>
      </div>

      {/* Contacts Table */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-2xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-300">
            <thead className="bg-slate-950/80 text-slate-400 font-semibold border-b border-slate-800 uppercase tracking-wider text-[10px]">
              <tr>
                <th className="py-3 px-4">Contact</th>
                <th className="py-3 px-4">WhatsApp Phone</th>
                <th className="py-3 px-4">Company / Email</th>
                <th className="py-3 px-4">Lead Score</th>
                <th className="py-3 px-4">Marketing Opt-In</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {loading ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-slate-500">
                    <div className="w-5 h-5 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
                    Loading contacts...
                  </td>
                </tr>
              ) : filteredContacts.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-slate-500">
                    No contacts found matching your criteria.
                  </td>
                </tr>
              ) : (
                filteredContacts.map((contact) => (
                  <tr key={contact.id} className="hover:bg-slate-800/40 transition-colors">
                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-slate-800 to-slate-700 flex items-center justify-center font-bold text-xs text-white uppercase shrink-0 border border-slate-700">
                          {contact.name?.charAt(0) || 'C'}
                        </div>
                        <span className="font-semibold text-white truncate max-w-[180px]">
                          {contact.name || 'Unnamed Customer'}
                        </span>
                      </div>
                    </td>
                    <td className="py-3.5 px-4 font-mono text-slate-300">
                      +{contact.wa_id}
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="text-slate-300">{contact.company || '—'}</div>
                      <div className="text-[11px] text-slate-500">{contact.email || ''}</div>
                    </td>
                    <td className="py-3.5 px-4">
                      <span className="px-2 py-0.5 rounded-full bg-purple-500/20 text-purple-300 font-mono font-bold text-[10px] border border-purple-500/30">
                        {contact.lead_score || 0} pts
                      </span>
                    </td>
                    <td className="py-3.5 px-4">
                      {contact.marketing_opt_in ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 text-[10px] font-semibold border border-emerald-500/30">
                          <CheckCircle2 className="w-3 h-3" /> Opted-In
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-slate-800 text-slate-400 text-[10px] font-medium border border-slate-700">
                          <XCircle className="w-3 h-3" /> No Consent
                        </span>
                      )}
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <button
                        onClick={async () => {
                          // Find or create conversation for this contact
                          const { data: conv } = await supabase
                            .from('conversations')
                            .select('id')
                            .eq('contact_id', contact.id)
                            .maybeSingle();

                          if (conv && onOpenConversation) {
                            onOpenConversation(conv.id);
                          }
                        }}
                        className="px-2.5 py-1 bg-slate-800 hover:bg-indigo-600 text-slate-200 hover:text-white rounded-lg text-xs font-medium transition-colors cursor-pointer inline-flex items-center gap-1"
                      >
                        <MessageSquare className="w-3 h-3" />
                        <span>Chat</span>
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add Contact Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-md w-full p-6 shadow-2xl">
            <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-800">
              <h3 className="text-sm font-bold text-white">Add Customer Record</h3>
              <button onClick={() => setShowAddModal(false)} className="text-slate-400 hover:text-white">
                <X className="w-4 h-4" />
              </button>
            </div>

            {modalError && (
              <div className="mb-4 p-3 bg-red-950/50 border border-red-800/50 rounded-xl text-red-300 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{modalError}</span>
              </div>
            )}

            <form onSubmit={handleAddContact} className="space-y-3.5">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">WhatsApp Phone Number *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. 923321029333"
                  value={newWaId}
                  onChange={(e) => setNewWaId(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl py-2 px-3 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Customer Full Name</label>
                <input
                  type="text"
                  placeholder="e.g. Sarah Jenkins"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl py-2 px-3 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">Email Address</label>
                  <input
                    type="email"
                    placeholder="sarah@example.com"
                    value={newEmail}
                    onChange={(e) => setNewEmail(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl py-2 px-3 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">Company Name</label>
                  <input
                    type="text"
                    placeholder="Acme Corp"
                    value={newCompany}
                    onChange={(e) => setNewCompany(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl py-2 px-3 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Internal Notes</label>
                <textarea
                  rows={2}
                  placeholder="Notes regarding customer requirements..."
                  value={newNotes}
                  onChange={(e) => setNewNotes(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl py-2 px-3 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
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
                  Save Contact
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* CSV Import Modal */}
      {showImportModal && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-lg w-full p-6 shadow-2xl">
            <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-800">
              <h3 className="text-sm font-bold text-white">Import Contacts from CSV</h3>
              <button onClick={() => setShowImportModal(false)} className="text-slate-400 hover:text-white">
                <X className="w-4 h-4" />
              </button>
            </div>

            {importStatus && (
              <div className="mb-4 p-3 bg-indigo-950/60 border border-indigo-800/50 rounded-xl text-indigo-300 text-xs">
                {importStatus}
              </div>
            )}

            <form onSubmit={handleImportCSV} className="space-y-3.5">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  CSV Content (Header: wa_id, name, email, company)
                </label>
                <textarea
                  rows={6}
                  required
                  placeholder={`wa_id,name,email,company\n923321029333,John Doe,john@example.com,Branify Ltd`}
                  value={csvText}
                  onChange={(e) => setCsvText(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs text-white placeholder-slate-600 focus:outline-none focus:border-indigo-500 font-mono"
                />
              </div>

              <div className="p-3 bg-slate-950 rounded-xl border border-slate-800/80 text-[11px] text-slate-400 space-y-1">
                <div className="font-semibold text-slate-300">Compliance Note:</div>
                <p>
                  Imported contacts will have <span className="text-amber-400 font-mono">marketing_opt_in = false</span> by default to respect Meta spam rules.
                </p>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowImportModal(false)}
                  className="px-4 py-2 bg-slate-800 text-slate-300 rounded-xl text-xs font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-medium"
                >
                  Process CSV Import
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
