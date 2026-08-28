import React, { useState, useEffect, useRef } from 'react';
import {
  Search,
  MessageSquare,
  Send as SendIcon,
  Check,
  CheckCheck,
  AlertCircle,
  Paperclip,
  Sparkles,
  User,
  Phone,
  Mail,
  Building,
  Tag as TagIcon,
  Plus,
  Clock,
  DollarSign,
  CheckSquare,
  FileCode2,
  Lock,
  ChevronDown,
  RefreshCw,
  X,
  FileText,
  Image as ImageIcon,
  CheckCircle2,
  Calendar,
  AlertTriangle,
} from 'lucide-react';
import { supabase, BRANIFY_DEFAULTS } from '../../lib/supabase';
import { Conversation, Message, Contact, Tag, Deal, TaskFollowup } from '../../types/crm';

interface InboxViewProps {
  initialConversationId?: string | null;
}

export const InboxView: React.FC<InboxViewProps> = ({ initialConversationId }) => {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedConvId, setSelectedConvId] = useState<string | null>(initialConversationId || null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [activeContact, setActiveContact] = useState<Contact | null>(null);
  const [availableTags, setAvailableTags] = useState<Tag[]>([]);
  const [contactDeals, setContactDeals] = useState<Deal[]>([]);
  const [contactTasks, setContactTasks] = useState<TaskFollowup[]>([]);

  const [filterTab, setFilterTab] = useState<'all' | 'open' | 'pending' | 'resolved'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [inputMessage, setInputMessage] = useState('');
  const [sending, setSending] = useState(false);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [loadingConversations, setLoadingConversations] = useState(true);

  // AI Assistant Drawer State
  const [showAiDrawer, setShowAiDrawer] = useState(false);
  const [aiLoading, setAiLoading] = useState(false);
  const [aiSuggestions, setAiSuggestions] = useState<any>(null);
  const [aiSummary, setAiSummary] = useState<any>(null);
  const [aiLeadQualification, setAiLeadQualification] = useState<any>(null);

  // Templates Drawer
  const [showTemplateModal, setShowTemplateModal] = useState(false);
  const [templates, setTemplates] = useState<any[]>([]);

  // New Chat Modal
  const [showNewChatModal, setShowNewChatModal] = useState(false);
  const [newChatPhone, setNewChatPhone] = useState('');
  const [newChatName, setNewChatName] = useState('');
  const [newChatError, setNewChatError] = useState<string | null>(null);

  // Create Deal Modal
  const [showCreateDealModal, setShowCreateDealModal] = useState(false);
  const [dealTitle, setDealTitle] = useState('');
  const [dealValue, setDealValue] = useState('500');

  // Create Task Modal
  const [showCreateTaskModal, setShowCreateTaskModal] = useState(false);
  const [taskTitle, setTaskTitle] = useState('');
  const [taskDueDate, setTaskDueDate] = useState('');

  // Internal Notes State
  const [internalNotes, setInternalNotes] = useState('');
  const [savingNotes, setSavingNotes] = useState(false);
  const [sendErrorNotice, setSendErrorNotice] = useState<string | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  // 1. Fetch Conversations
  const fetchConversations = async () => {
    try {
      setLoadingConversations(true);
      const { data, error } = await supabase
        .from('conversations')
        .select(`
          *,
          contact:contacts (*),
          last_message:messages ( id, body, created_at, status, sender_type )
        `)
        .order('last_message_at', { ascending: false });

      if (!error && data) {
        setConversations(data as any);
        if (!selectedConvId && data.length > 0) {
          setSelectedConvId(data[0].id);
        }
      }
    } catch (e) {
      console.error('Error fetching conversations:', e);
    } finally {
      setLoadingConversations(false);
    }
  };

  // 2. Fetch Tags & Templates
  const fetchAuxiliaryData = async () => {
    const { data: tData } = await supabase.from('tags').select('*').order('name');
    if (tData) setAvailableTags(tData);

    const { data: tmplData } = await supabase.from('message_templates').select('*').order('name');
    if (tmplData) setTemplates(tmplData);
  };

  useEffect(() => {
    fetchConversations();
    fetchAuxiliaryData();

    // Subscribe to realtime conversation updates
    const channel = supabase
      .channel('inbox_realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'conversations' }, () => {
        fetchConversations();
      })
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'messages' }, (payload) => {
        const newMsg = payload.new as Message;
        if (newMsg.conversation_id === selectedConvId) {
          setMessages((prev) => [...prev, newMsg]);
          scrollToBottom();
        }
        fetchConversations();
      })
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'messages' }, (payload) => {
        const updatedMsg = payload.new as Message;
        if (updatedMsg.conversation_id === selectedConvId) {
          setMessages((prev) =>
            prev.map((m) => (m.id === updatedMsg.id ? { ...m, ...updatedMsg } : m))
          );
        }
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [selectedConvId]);

  // 3. Fetch Active Conversation Messages & Contact Info
  useEffect(() => {
    if (!selectedConvId) return;

    const loadConversationDetails = async () => {
      setLoadingMessages(true);
      try {
        // Load messages
        const { data: msgData } = await supabase
          .from('messages')
          .select('*')
          .eq('conversation_id', selectedConvId)
          .order('created_at', { ascending: true });

        if (msgData) {
          setMessages(msgData as Message[]);
          scrollToBottom();
        }

        // Get contact
        const activeConv = conversations.find((c) => c.id === selectedConvId);
        if (activeConv && activeConv.contact_id) {
          const { data: cData } = await supabase
            .from('contacts')
            .select('*')
            .eq('id', activeConv.contact_id)
            .single();

          if (cData) {
            setActiveContact(cData as Contact);
            setInternalNotes(cData.notes || '');

            // Load deals
            const { data: dealsData } = await supabase
              .from('deals')
              .select('*, pipeline_stages(*)')
              .eq('contact_id', cData.id);
            if (dealsData) setContactDeals(dealsData as any);

            // Load tasks
            const { data: tasksData } = await supabase
              .from('tasks_followups')
              .select('*')
              .eq('contact_id', cData.id)
              .order('due_date', { ascending: true });
            if (tasksData) setContactTasks(tasksData as any);
          }
        }

        // Mark as read in DB if unread
        await supabase
          .from('conversations')
          .update({ unread_count: 0 })
          .eq('id', selectedConvId);
      } catch (e) {
        console.error('Error loading conversation details:', e);
      } finally {
        setLoadingMessages(false);
      }
    };

    loadConversationDetails();
  }, [selectedConvId, conversations.length]);

  const scrollToBottom = () => {
    setTimeout(() => {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, 100);
  };

  // Send WhatsApp Outbound Message
  const handleSendMessage = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!inputMessage.trim() || !selectedConvId || !activeContact) return;

    const messageText = inputMessage.trim();
    setInputMessage('');
    setSending(true);

    try {
      const response = await fetch('/api/whatsapp/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          conversationId: selectedConvId,
          contactWaId: activeContact.wa_id,
          body: messageText,
          type: 'text',
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        console.warn('Backend send notice:', data.error);
        setSendErrorNotice(data.error || 'Meta WhatsApp Cloud API could not deliver the message. Please check permissions or 24h conversation window.');
        // If Meta credentials are not configured yet or in sandbox, insert optimistic message for UI testing
        const { data: insertedMsg } = await supabase
          .from('messages')
          .insert({
            workspace_id: activeContact.workspace_id,
            conversation_id: selectedConvId,
            sender_type: 'agent',
            message_type: 'text',
            body: messageText,
            status: 'failed',
          })
          .select()
          .single();

        if (insertedMsg) {
          setMessages((prev) => [...prev, insertedMsg as Message]);
          scrollToBottom();
        }
      } else {
        setSendErrorNotice(null);
        if (data.message) {
          setMessages((prev) => [...prev, data.message]);
          scrollToBottom();
        }
      }
    } catch (err: any) {
      console.error('Error sending message:', err);
    } finally {
      setSending(false);
    }
  };

  // AI Copilot Actions
  const runAiCopilot = async (action: 'suggest_reply' | 'summarize_conversation' | 'qualify_lead') => {
    setAiLoading(true);
    setShowAiDrawer(true);

    try {
      // Build conversation history format
      const history = messages.slice(-10).map((m) => ({
        sender: m.sender_type === 'customer' ? ('customer' as const) : ('agent' as const),
        text: m.body || '',
        timestamp: m.created_at,
      }));

      // Fetch knowledge base articles for grounding
      const { data: kbData } = await supabase
        .from('knowledge_base')
        .select('category, title, content')
        .eq('is_active', true);

      const response = await fetch('/api/ai/copilot', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action,
          conversationHistory: history,
          contactName: activeContact?.name || undefined,
          contactCompany: activeContact?.company || undefined,
          knowledgeBase: kbData || [],
        }),
      });

      const res = await response.json();
      if (res.success && res.data) {
        if (action === 'suggest_reply') setAiSuggestions(res.data);
        if (action === 'summarize_conversation') setAiSummary(res.data);
        if (action === 'qualify_lead') setAiLeadQualification(res.data);
      }
    } catch (err) {
      console.error('AI Copilot request failed:', err);
    } finally {
      setAiLoading(false);
    }
  };

  // Save Contact Notes
  const handleSaveNotes = async () => {
    if (!activeContact) return;
    setSavingNotes(true);
    try {
      await supabase
        .from('contacts')
        .update({ notes: internalNotes })
        .eq('id', activeContact.id);
      setActiveContact((prev) => (prev ? { ...prev, notes: internalNotes } : null));
    } catch (e) {
      console.error('Error saving notes:', e);
    } finally {
      setSavingNotes(false);
    }
  };

  // Toggle Contact Marketing Opt-in
  const handleToggleOptIn = async () => {
    if (!activeContact) return;
    const newStatus = !activeContact.marketing_opt_in;
    try {
      await supabase
        .from('contacts')
        .update({
          marketing_opt_in: newStatus,
          consent_source: newStatus ? 'Manual CRM Owner Toggle' : activeContact.consent_source,
          consent_timestamp: newStatus ? new Date().toISOString() : activeContact.consent_timestamp,
          opt_out_at: !newStatus ? new Date().toISOString() : null,
        })
        .eq('id', activeContact.id);

      setActiveContact((prev) => (prev ? { ...prev, marketing_opt_in: newStatus } : null));
    } catch (e) {
      console.error('Error updating opt-in:', e);
    }
  };

  // Start New Chat
  const handleCreateNewChat = async (e: React.FormEvent) => {
    e.preventDefault();
    setNewChatError(null);

    const cleanNumber = newChatPhone.replace(/\D/g, '');
    if (cleanNumber.length < 9) {
      setNewChatError('Please enter a valid international phone number (e.g. 923321029333)');
      return;
    }

    try {
      // Find workspace
      const { data: ws } = await supabase.from('workspaces').select('id').eq('slug', 'branify').single();
      const wsId = ws?.id;
      if (!wsId) return;

      // Check if contact exists
      let cId: string;
      const { data: existingC } = await supabase
        .from('contacts')
        .select('id')
        .eq('workspace_id', wsId)
        .eq('wa_id', cleanNumber)
        .maybeSingle();

      if (existingC) {
        cId = existingC.id;
      } else {
        const { data: newC, error: cErr } = await supabase
          .from('contacts')
          .insert({
            workspace_id: wsId,
            wa_id: cleanNumber,
            name: newChatName.trim() || `Customer (+${cleanNumber})`,
            marketing_opt_in: false,
          })
          .select('id')
          .single();
        if (cErr || !newC) throw cErr;
        cId = newC.id;
      }

      // Check if conversation exists
      let convId: string;
      const { data: existingConv } = await supabase
        .from('conversations')
        .select('id')
        .eq('workspace_id', wsId)
        .eq('contact_id', cId)
        .maybeSingle();

      if (existingConv) {
        convId = existingConv.id;
      } else {
        const { data: newConv, error: convErr } = await supabase
          .from('conversations')
          .insert({
            workspace_id: wsId,
            contact_id: cId,
            status: 'open',
            priority: 'normal',
          })
          .select('id')
          .single();
        if (convErr || !newConv) throw convErr;
        convId = newConv.id;
      }

      setShowNewChatModal(false);
      setNewChatPhone('');
      setNewChatName('');
      await fetchConversations();
      setSelectedConvId(convId);
    } catch (err: any) {
      setNewChatError(err.message || 'Failed to create chat');
    }
  };

  // Create Quick Deal for active contact
  const handleCreateDeal = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeContact || !dealTitle.trim()) return;

    try {
      const { data: stages } = await supabase
        .from('pipeline_stages')
        .select('id')
        .order('stage_order', { ascending: true })
        .limit(1);

      const stageId = stages?.[0]?.id;
      if (!stageId) return;

      const { data: newDeal } = await supabase
        .from('deals')
        .insert({
          workspace_id: activeContact.workspace_id,
          contact_id: activeContact.id,
          conversation_id: selectedConvId,
          stage_id: stageId,
          title: dealTitle.trim(),
          value: parseFloat(dealValue) || 0,
        })
        .select('*, pipeline_stages(*)')
        .single();

      if (newDeal) {
        setContactDeals((prev) => [newDeal as any, ...prev]);
        setShowCreateDealModal(false);
        setDealTitle('');
      }
    } catch (err) {
      console.error('Error creating deal:', err);
    }
  };

  // Create Quick Task for active contact
  const handleCreateTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeContact || !taskTitle.trim()) return;

    try {
      const { data: newTask } = await supabase
        .from('tasks_followups')
        .insert({
          workspace_id: activeContact.workspace_id,
          contact_id: activeContact.id,
          conversation_id: selectedConvId,
          title: taskTitle.trim(),
          due_date: taskDueDate || new Date(Date.now() + 86400000).toISOString(),
        })
        .select('*')
        .single();

      if (newTask) {
        setContactTasks((prev) => [...prev, newTask as any]);
        setShowCreateTaskModal(false);
        setTaskTitle('');
        setTaskDueDate('');
      }
    } catch (err) {
      console.error('Error creating task:', err);
    }
  };

  // Filter conversations
  const filteredConversations = conversations.filter((c) => {
    if (filterTab !== 'all' && c.status !== filterTab) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const name = c.contact?.name?.toLowerCase() || '';
      const phone = c.contact?.wa_id || '';
      return name.includes(q) || phone.includes(q);
    }
    return true;
  });

  const activeConversation = conversations.find((c) => c.id === selectedConvId);

  return (
    <div className="flex-1 flex overflow-hidden bg-slate-950">
      {/* ============================================================
          COLUMN 1: CONVERSATION LIST (LEFT)
          ============================================================ */}
      <div className="w-80 border-r border-slate-800/80 flex flex-col bg-slate-950 shrink-0">
        {/* Top Search & Start Chat */}
        <div className="p-3 border-b border-slate-800/80 space-y-2.5">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-bold text-white tracking-tight">WhatsApp Chats</h2>
            <button
              onClick={() => setShowNewChatModal(true)}
              className="p-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs flex items-center gap-1 transition-colors cursor-pointer"
              title="Start New WhatsApp Chat"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>New</span>
            </button>
          </div>

          {/* Search Input */}
          <div className="relative">
            <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
            <input
              type="text"
              placeholder="Search contact or phone..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-slate-900 border border-slate-800 rounded-xl py-1.5 pl-8 pr-3 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 transition-colors"
            />
          </div>

          {/* Status Filter Tabs */}
          <div className="flex items-center gap-1 bg-slate-900/60 p-1 rounded-xl border border-slate-800/80">
            {(['all', 'open', 'pending', 'resolved'] as const).map((tab) => (
              <button
                key={tab}
                onClick={() => setFilterTab(tab)}
                className={`flex-1 py-1 text-[11px] font-medium rounded-lg capitalize transition-colors cursor-pointer ${
                  filterTab === tab
                    ? 'bg-indigo-600 text-white shadow-sm font-semibold'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                {tab}
              </button>
            ))}
          </div>
        </div>

        {/* Conversation List Stream */}
        <div className="flex-1 overflow-y-auto divide-y divide-slate-900">
          {loadingConversations ? (
            <div className="py-12 text-center text-slate-500 text-xs flex flex-col items-center gap-2">
              <div className="w-5 h-5 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
              <span>Loading messages...</span>
            </div>
          ) : filteredConversations.length === 0 ? (
            <div className="py-12 text-center text-slate-500 text-xs px-4">
              <MessageSquare className="w-8 h-8 mx-auto text-slate-700 mb-2 stroke-1" />
              <p className="font-medium text-slate-400">No conversations found</p>
              <p className="text-[11px] text-slate-500 mt-1">
                Start a new chat or wait for incoming WhatsApp webhooks.
              </p>
            </div>
          ) : (
            filteredConversations.map((conv) => {
              const isSelected = conv.id === selectedConvId;
              const contact = conv.contact;
              const hasUnread = (conv.unread_count || 0) > 0;

              return (
                <div
                  key={conv.id}
                  onClick={() => setSelectedConvId(conv.id)}
                  className={`p-3 transition-colors cursor-pointer flex items-start gap-3 relative ${
                    isSelected
                      ? 'bg-indigo-950/30 border-l-2 border-indigo-500'
                      : 'hover:bg-slate-900/50'
                  }`}
                >
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-slate-800 to-slate-700 flex items-center justify-center font-bold text-xs text-white uppercase shrink-0 border border-slate-700 shadow-sm">
                    {contact?.name?.charAt(0) || 'C'}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-0.5">
                      <h4 className="text-xs font-semibold text-white truncate">
                        {contact?.name || `Customer (+${contact?.wa_id})`}
                      </h4>
                      <span className="text-[10px] text-slate-500 font-mono shrink-0">
                        {new Date(conv.last_message_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>

                    <div className="text-[11px] text-slate-400 font-mono truncate mb-1">
                      +{contact?.wa_id}
                    </div>

                    <div className="flex items-center justify-between">
                      <span className="text-[11px] text-slate-400 truncate max-w-[160px]">
                        {conv.last_message?.body || 'No messages yet'}
                      </span>
                      {hasUnread && (
                        <span className="px-1.5 py-0.2 rounded-full bg-emerald-500 text-white text-[10px] font-bold">
                          {conv.unread_count}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* ============================================================
          COLUMN 2: ACTIVE CONVERSATION (CENTER)
          ============================================================ */}
      <div className="flex-1 flex flex-col bg-slate-950 border-r border-slate-800/80 min-w-0">
        {selectedConvId && activeContact ? (
          <>
            {/* Conversation Header */}
            <div className="h-16 border-b border-slate-800/80 px-5 flex items-center justify-between shrink-0 bg-slate-950/90 backdrop-blur-sm">
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-indigo-600 to-indigo-800 flex items-center justify-center font-bold text-xs text-white uppercase shrink-0 ring-1 ring-white/10">
                  {activeContact.name?.charAt(0) || 'C'}
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <h3 className="text-sm font-bold text-white truncate">
                      {activeContact.name || `Customer (+${activeContact.wa_id})`}
                    </h3>
                    <span className="text-[10px] font-mono text-slate-400">
                      +{activeContact.wa_id}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 text-[11px] text-slate-400">
                    <span className="flex items-center gap-1 text-emerald-400 font-medium">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                      WhatsApp Direct
                    </span>
                    <span className="text-slate-600">•</span>
                    <span>Status: {activeConversation?.status}</span>
                  </div>
                </div>
              </div>

              {/* AI & Quick Action Buttons */}
              <div className="flex items-center gap-2">
                <button
                  onClick={() => runAiCopilot('suggest_reply')}
                  className="px-2.5 py-1.5 bg-purple-600/20 hover:bg-purple-600/30 text-purple-300 border border-purple-500/30 rounded-xl text-xs font-medium flex items-center gap-1.5 transition-colors cursor-pointer"
                  title="AI Reply Copilot (Gemini)"
                >
                  <Sparkles className="w-3.5 h-3.5 text-purple-400" />
                  <span>AI Copilot</span>
                </button>

                <button
                  onClick={() => setShowTemplateModal(true)}
                  className="px-2.5 py-1.5 bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-800 rounded-xl text-xs font-medium flex items-center gap-1.5 transition-colors cursor-pointer"
                  title="Send Approved Template"
                >
                  <FileCode2 className="w-3.5 h-3.5 text-indigo-400" />
                  <span>Template</span>
                </button>
              </div>
            </div>

            {/* AI Assistant Drawer (Collapsible) */}
            {showAiDrawer && (
              <div className="p-4 bg-purple-950/30 border-b border-purple-800/40 relative">
                <button
                  onClick={() => setShowAiDrawer(false)}
                  className="absolute top-3 right-3 text-slate-400 hover:text-white"
                >
                  <X className="w-4 h-4" />
                </button>

                <div className="flex items-center gap-2 mb-3">
                  <Sparkles className="w-4 h-4 text-purple-400" />
                  <span className="text-xs font-bold text-white">Branify Gemini AI Copilot</span>
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-purple-500/20 text-purple-300 border border-purple-500/30 font-medium">
                    Grounded on Knowledge Base
                  </span>
                </div>

                {aiLoading ? (
                  <div className="py-4 text-xs text-slate-400 flex items-center gap-2">
                    <div className="w-4 h-4 border-2 border-purple-500 border-t-transparent rounded-full animate-spin" />
                    <span>Analyzing conversation context & knowledge base...</span>
                  </div>
                ) : aiSuggestions?.options ? (
                  <div className="space-y-2">
                    <div className="text-[11px] text-slate-300 font-medium">
                      Select a suggestion to insert into message box:
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                      {aiSuggestions.options.map((opt: any, idx: number) => (
                        <div
                          key={idx}
                          onClick={() => {
                            setInputMessage(opt.text);
                            setShowAiDrawer(false);
                          }}
                          className="p-3 bg-slate-900/90 border border-purple-800/40 rounded-xl hover:border-purple-500 text-xs cursor-pointer transition-all hover:scale-[1.01]"
                        >
                          <div className="font-semibold text-purple-300 mb-1 text-[11px]">
                            {opt.title}
                          </div>
                          <div className="text-slate-300 line-clamp-3 text-[11px]">
                            {opt.text}
                          </div>
                        </div>
                      ))}
                    </div>
                    {aiSuggestions.reasoning && (
                      <p className="text-[10px] text-slate-400 italic">
                        Tip: {aiSuggestions.reasoning}
                      </p>
                    )}
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => runAiCopilot('suggest_reply')}
                      className="px-3 py-1.5 bg-purple-600 text-white rounded-lg text-xs font-medium hover:bg-purple-500 cursor-pointer"
                    >
                      Draft Smart Replies
                    </button>
                    <button
                      onClick={() => runAiCopilot('summarize_conversation')}
                      className="px-3 py-1.5 bg-slate-800 text-slate-200 rounded-lg text-xs font-medium hover:bg-slate-700 cursor-pointer"
                    >
                      Summarize Thread
                    </button>
                    <button
                      onClick={() => runAiCopilot('qualify_lead')}
                      className="px-3 py-1.5 bg-slate-800 text-slate-200 rounded-lg text-xs font-medium hover:bg-slate-700 cursor-pointer"
                    >
                      Qualify Lead
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* Messages Feed Stream */}
            <div className="flex-1 overflow-y-auto p-5 space-y-3.5 bg-slate-950/60">
              {loadingMessages ? (
                <div className="py-12 text-center text-slate-500 text-xs flex flex-col items-center gap-2">
                  <div className="w-5 h-5 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
                  <span>Loading messages...</span>
                </div>
              ) : messages.length === 0 ? (
                <div className="py-16 text-center text-slate-500 text-xs space-y-2">
                  <MessageSquare className="w-8 h-8 mx-auto text-slate-700 stroke-1" />
                  <p className="font-medium text-slate-400">No messages in this chat yet</p>
                  <p className="text-[11px] text-slate-500">
                    Type a message below to send directly to +{activeContact.wa_id} via Meta Cloud API.
                  </p>
                </div>
              ) : (
                messages.map((msg) => {
                  const isAgent = msg.sender_type === 'agent';
                  return (
                    <div
                      key={msg.id}
                      className={`flex flex-col ${isAgent ? 'items-end' : 'items-start'}`}
                    >
                      <div
                        className={`max-w-md rounded-2xl px-4 py-2.5 text-xs shadow-sm relative ${
                          isAgent
                            ? 'bg-indigo-600 text-white rounded-br-none'
                            : 'bg-slate-900 border border-slate-800 text-slate-200 rounded-bl-none'
                        }`}
                      >
                        {/* Media rendering if present */}
                        {msg.message_type === 'image' && msg.media_url && (
                          <div className="mb-2 rounded-lg overflow-hidden bg-black/20">
                            <img
                              src={msg.media_url}
                              alt="Media"
                              className="max-h-48 w-full object-cover"
                              referrerPolicy="no-referrer"
                            />
                          </div>
                        )}

                        <div className="whitespace-pre-wrap break-words leading-relaxed">
                          {msg.body}
                        </div>

                        {/* Timestamp & Status Tick */}
                        <div
                          className={`mt-1 flex items-center justify-end gap-1 text-[10px] font-mono ${
                            isAgent ? 'text-indigo-200' : 'text-slate-500'
                          }`}
                        >
                          <span>
                            {new Date(msg.created_at).toLocaleTimeString([], {
                              hour: '2-digit',
                              minute: '2-digit',
                            })}
                          </span>
                          {isAgent && (
                            <span>
                              {msg.status === 'read' ? (
                                <CheckCheck className="w-3.5 h-3.5 text-cyan-300" />
                              ) : msg.status === 'delivered' ? (
                                <CheckCheck className="w-3.5 h-3.5 text-indigo-200" />
                              ) : msg.status === 'failed' ? (
                                <AlertCircle className="w-3.5 h-3.5 text-red-300" />
                              ) : (
                                <Check className="w-3.5 h-3.5 text-indigo-200" />
                              )}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Bottom Message Input Bar */}
            <div className="p-4 border-t border-slate-800/80 bg-slate-950">
              {sendErrorNotice && (
                <div className="mb-3 px-3 py-2.5 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs flex items-start justify-between gap-2 animate-in fade-in">
                  <div className="flex items-start gap-2">
                    <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                    <div>
                      <span className="font-semibold text-amber-200">WhatsApp Delivery Notice: </span>
                      <span>{sendErrorNotice}</span>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setSendErrorNotice(null)}
                    className="text-amber-400 hover:text-amber-200 p-0.5 rounded cursor-pointer"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              )}

              <form onSubmit={handleSendMessage} className="flex items-end gap-2.5">
                <div className="flex-1 bg-slate-900 border border-slate-800 rounded-2xl p-2.5 focus-within:border-indigo-500 transition-colors">
                  <textarea
                    rows={2}
                    value={inputMessage}
                    onChange={(e) => setInputMessage(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault();
                        handleSendMessage();
                      }
                    }}
                    placeholder={`Message ${activeContact.name || '+' + activeContact.wa_id} (Press Enter to send)...`}
                    className="w-full bg-transparent text-xs text-white placeholder-slate-500 focus:outline-none resize-none"
                  />
                  <div className="flex items-center justify-between pt-1 text-slate-500">
                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() => setShowTemplateModal(true)}
                        className="p-1 hover:text-indigo-400 rounded transition-colors cursor-pointer"
                        title="Attach Template"
                      >
                        <FileCode2 className="w-4 h-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() => runAiCopilot('suggest_reply')}
                        className="p-1 hover:text-purple-400 rounded transition-colors cursor-pointer"
                        title="AI Suggest Reply"
                      >
                        <Sparkles className="w-4 h-4" />
                      </button>
                    </div>
                    <span className="text-[10px] text-slate-600">Shift + Enter for new line</span>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={sending || !inputMessage.trim()}
                  className="p-3.5 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white rounded-2xl transition-all shadow-lg shadow-indigo-600/25 flex items-center justify-center cursor-pointer"
                >
                  {sending ? (
                    <div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                  ) : (
                    <SendIcon className="w-4 h-4" />
                  )}
                </button>
              </form>
            </div>
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-slate-500 text-xs p-6 space-y-3">
            <MessageSquare className="w-12 h-12 text-slate-700 stroke-1" />
            <h3 className="text-sm font-semibold text-slate-400">Select a conversation to start</h3>
            <p className="text-slate-500 max-w-sm text-center">
              Choose a customer thread from the left list or create a new conversation to communicate via official WhatsApp Cloud API.
            </p>
          </div>
        )}
      </div>

      {/* ============================================================
          COLUMN 3: CUSTOMER CRM INFORMATION (RIGHT)
          ============================================================ */}
      <div className="w-80 border-l border-slate-800/80 bg-slate-950 p-5 overflow-y-auto space-y-5 shrink-0">
        {activeContact ? (
          <>
            {/* Customer Identity Card */}
            <div className="text-center pb-4 border-b border-slate-800/80">
              <div className="w-14 h-14 mx-auto rounded-2xl bg-gradient-to-br from-indigo-500 to-indigo-700 flex items-center justify-center font-bold text-lg text-white uppercase mb-2 shadow-lg shadow-indigo-500/20 ring-1 ring-white/10">
                {activeContact.name?.charAt(0) || 'C'}
              </div>
              <h3 className="text-sm font-bold text-white">
                {activeContact.name || 'Unnamed Customer'}
              </h3>
              <p className="text-xs text-slate-400 font-mono">+{activeContact.wa_id}</p>

              {/* Marketing Opt-In Compliance Badge */}
              <div className="mt-3 flex items-center justify-center">
                <button
                  onClick={handleToggleOptIn}
                  className={`px-2.5 py-1 rounded-full text-[11px] font-semibold border flex items-center gap-1.5 transition-colors cursor-pointer ${
                    activeContact.marketing_opt_in
                      ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30'
                      : 'bg-slate-800 text-slate-400 border-slate-700'
                  }`}
                  title="Click to toggle marketing consent status"
                >
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>{activeContact.marketing_opt_in ? 'Marketing Opted-In' : 'Not Opted-In'}</span>
                </button>
              </div>
            </div>

            {/* Customer Details */}
            <div className="space-y-3">
              <h4 className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                Contact Details
              </h4>

              <div className="space-y-2 text-xs">
                <div className="flex items-center gap-2 text-slate-300">
                  <Phone className="w-3.5 h-3.5 text-slate-500" />
                  <span className="font-mono">+{activeContact.wa_id}</span>
                </div>
                {activeContact.email && (
                  <div className="flex items-center gap-2 text-slate-300">
                    <Mail className="w-3.5 h-3.5 text-slate-500" />
                    <span className="truncate">{activeContact.email}</span>
                  </div>
                )}
                {activeContact.company && (
                  <div className="flex items-center gap-2 text-slate-300">
                    <Building className="w-3.5 h-3.5 text-slate-500" />
                    <span>{activeContact.company}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Internal CRM Notes */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <h4 className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                  Internal Notes
                </h4>
                <button
                  onClick={handleSaveNotes}
                  disabled={savingNotes}
                  className="text-[10px] text-indigo-400 hover:text-indigo-300 font-semibold cursor-pointer"
                >
                  {savingNotes ? 'Saving...' : 'Save'}
                </button>
              </div>
              <textarea
                rows={3}
                value={internalNotes}
                onChange={(e) => setInternalNotes(e.target.value)}
                placeholder="Add private owner notes about this lead..."
                className="w-full bg-slate-900 border border-slate-800 rounded-xl p-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 transition-colors"
              />
            </div>

            {/* Deals Linked to this Contact */}
            <div className="space-y-2.5">
              <div className="flex items-center justify-between">
                <h4 className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                  Deals ({contactDeals.length})
                </h4>
                <button
                  onClick={() => setShowCreateDealModal(true)}
                  className="text-[10px] text-indigo-400 hover:text-indigo-300 font-semibold flex items-center gap-0.5 cursor-pointer"
                >
                  <Plus className="w-3 h-3" />
                  <span>Deal</span>
                </button>
              </div>

              {contactDeals.length === 0 ? (
                <div className="p-3 bg-slate-900/60 rounded-xl text-center text-[11px] text-slate-500 border border-slate-800">
                  No deals open for this contact
                </div>
              ) : (
                contactDeals.map((deal) => (
                  <div
                    key={deal.id}
                    className="p-3 bg-slate-900 border border-slate-800 rounded-xl text-xs flex items-center justify-between"
                  >
                    <div>
                      <div className="font-semibold text-white truncate max-w-[140px]">
                        {deal.title}
                      </div>
                      <div className="text-[10px] text-slate-400">
                        Stage: {deal.stage?.name || 'Pipeline'}
                      </div>
                    </div>
                    <div className="text-right font-bold text-indigo-400 font-mono">
                      ${Number(deal.value).toLocaleString()}
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Follow-up Tasks */}
            <div className="space-y-2.5">
              <div className="flex items-center justify-between">
                <h4 className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                  Follow-ups ({contactTasks.length})
                </h4>
                <button
                  onClick={() => setShowCreateTaskModal(true)}
                  className="text-[10px] text-indigo-400 hover:text-indigo-300 font-semibold flex items-center gap-0.5 cursor-pointer"
                >
                  <Plus className="w-3 h-3" />
                  <span>Task</span>
                </button>
              </div>

              {contactTasks.length === 0 ? (
                <div className="p-3 bg-slate-900/60 rounded-xl text-center text-[11px] text-slate-500 border border-slate-800">
                  No active follow-ups scheduled
                </div>
              ) : (
                contactTasks.map((task) => (
                  <div
                    key={task.id}
                    className="p-2.5 bg-slate-900 border border-slate-800 rounded-xl text-xs space-y-1"
                  >
                    <div className="font-semibold text-white">{task.title}</div>
                    <div className="text-[10px] text-amber-400 flex items-center gap-1 font-mono">
                      <Clock className="w-3 h-3" />
                      <span>{new Date(task.due_date).toLocaleDateString()}</span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </>
        ) : (
          <div className="py-12 text-center text-slate-500 text-xs">
            No contact selected
          </div>
        )}
      </div>

      {/* ============================================================
          MODALS: NEW CHAT, CREATE DEAL, CREATE TASK, TEMPLATE PICKER
          ============================================================ */}

      {/* 1. New Chat Modal */}
      {showNewChatModal && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-md w-full p-6 shadow-2xl">
            <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-800">
              <h3 className="text-sm font-bold text-white">Start New WhatsApp Chat</h3>
              <button onClick={() => setShowNewChatModal(false)} className="text-slate-400 hover:text-white">
                <X className="w-4 h-4" />
              </button>
            </div>

            {newChatError && (
              <div className="mb-4 p-3 bg-red-950/50 border border-red-800/50 rounded-xl text-red-300 text-xs">
                {newChatError}
              </div>
            )}

            <form onSubmit={handleCreateNewChat} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  Recipient Phone Number (with Country Code) *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. 923321029333"
                  value={newChatPhone}
                  onChange={(e) => setNewChatPhone(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl py-2 px-3 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  Customer Name (Optional)
                </label>
                <input
                  type="text"
                  placeholder="Customer Name"
                  value={newChatName}
                  onChange={(e) => setNewChatName(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl py-2 px-3 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowNewChatModal(false)}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-medium"
                >
                  Open Chat
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 2. Create Deal Modal */}
      {showCreateDealModal && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-md w-full p-6 shadow-2xl">
            <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-800">
              <h3 className="text-sm font-bold text-white">Create Sales Deal</h3>
              <button onClick={() => setShowCreateDealModal(false)} className="text-slate-400 hover:text-white">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateDeal} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Deal Title *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Brand Scale Package"
                  value={dealTitle}
                  onChange={(e) => setDealTitle(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl py-2 px-3 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Deal Value (USD) *</label>
                <input
                  type="number"
                  required
                  value={dealValue}
                  onChange={(e) => setDealValue(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl py-2 px-3 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 font-mono"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowCreateDealModal(false)}
                  className="px-4 py-2 bg-slate-800 text-slate-300 rounded-xl text-xs font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-indigo-600 text-white rounded-xl text-xs font-medium"
                >
                  Create Deal
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 3. Create Task Modal */}
      {showCreateTaskModal && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-md w-full p-6 shadow-2xl">
            <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-800">
              <h3 className="text-sm font-bold text-white">Create Follow-up Reminder</h3>
              <button onClick={() => setShowCreateTaskModal(false)} className="text-slate-400 hover:text-white">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateTask} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Reminder Title *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Call customer regarding custom order"
                  value={taskTitle}
                  onChange={(e) => setTaskTitle(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl py-2 px-3 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Due Date & Time</label>
                <input
                  type="datetime-local"
                  value={taskDueDate}
                  onChange={(e) => setTaskDueDate(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl py-2 px-3 text-xs text-white focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowCreateTaskModal(false)}
                  className="px-4 py-2 bg-slate-800 text-slate-300 rounded-xl text-xs font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-indigo-600 text-white rounded-xl text-xs font-medium"
                >
                  Save Task
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 4. Template Selection Modal */}
      {showTemplateModal && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-lg w-full p-6 shadow-2xl">
            <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-800">
              <h3 className="text-sm font-bold text-white">Select Message Template</h3>
              <button onClick={() => setShowTemplateModal(false)} className="text-slate-400 hover:text-white">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="max-h-80 overflow-y-auto space-y-2.5">
              {templates.length === 0 ? (
                <div className="py-8 text-center text-slate-500 text-xs">
                  No message templates found in catalog
                </div>
              ) : (
                templates.map((tmpl) => (
                  <div
                    key={tmpl.id}
                    onClick={() => {
                      setInputMessage(tmpl.body);
                      setShowTemplateModal(false);
                    }}
                    className="p-3 bg-slate-950 border border-slate-800 rounded-xl hover:border-indigo-500 transition-all cursor-pointer space-y-1"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-white">{tmpl.name}</span>
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 uppercase">
                        {tmpl.category}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-400 line-clamp-2">{tmpl.body}</p>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
