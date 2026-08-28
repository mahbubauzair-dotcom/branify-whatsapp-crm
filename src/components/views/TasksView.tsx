import React, { useState, useEffect } from 'react';
import {
  CheckSquare,
  Plus,
  Clock,
  Calendar,
  User,
  CheckCircle2,
  AlertCircle,
  X,
  Check,
} from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { TaskFollowup, Contact } from '../../types/crm';

export const TasksView: React.FC = () => {
  const [tasks, setTasks] = useState<TaskFollowup[]>([]);
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'pending' | 'completed'>('pending');

  // Modal
  const [showAddModal, setShowAddModal] = useState(false);
  const [title, setTitle] = useState('');
  const [contactId, setContactId] = useState('');
  const [dueDate, setDueDate] = useState('');

  const fetchTasksData = async () => {
    setLoading(true);
    try {
      const { data: tasksData } = await supabase
        .from('tasks_followups')
        .select('*, contact:contacts(*)')
        .order('due_date', { ascending: true });

      const { data: contactsData } = await supabase
        .from('contacts')
        .select('id, name, wa_id')
        .order('name');

      if (tasksData) setTasks(tasksData as any);
      if (contactsData) setContacts(contactsData as Contact[]);
    } catch (e) {
      console.error('Error fetching tasks:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTasksData();
  }, []);

  const handleToggleTask = async (id: string, currentStatus: string) => {
    const newStatus = currentStatus === 'completed' ? 'pending' : 'completed';
    try {
      await supabase
        .from('tasks_followups')
        .update({
          status: newStatus,
          completed_at: newStatus === 'completed' ? new Date().toISOString() : null,
        })
        .eq('id', id);

      setTasks((prev) =>
        prev.map((t) =>
          t.id === id
            ? {
                ...t,
                status: newStatus,
                completed_at: newStatus === 'completed' ? new Date().toISOString() : null,
              }
            : t
        )
      );
    } catch (e) {
      console.error('Error toggling task:', e);
    }
  };

  const handleCreateTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    try {
      const { data: ws } = await supabase.from('workspaces').select('id').eq('slug', 'branify').single();
      if (!ws?.id) return;

      const { data, error } = await supabase
        .from('tasks_followups')
        .insert({
          workspace_id: ws.id,
          contact_id: contactId || null,
          title: title.trim(),
          due_date: dueDate || new Date(Date.now() + 86400000).toISOString(),
          status: 'pending',
        })
        .select('*, contact:contacts(*)')
        .single();

      if (data) {
        setTasks((prev) => [data as any, ...prev]);
        setShowAddModal(false);
        setTitle('');
        setContactId('');
        setDueDate('');
      }
    } catch (err) {
      console.error('Error creating task:', err);
    }
  };

  const filteredTasks = tasks.filter((t) => {
    if (filter === 'pending' && t.status === 'completed') return false;
    if (filter === 'completed' && t.status !== 'completed') return false;
    return true;
  });

  return (
    <div className="p-6 space-y-6 max-w-5xl mx-auto overflow-y-auto">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-bold text-white tracking-tight flex items-center gap-2">
            <CheckSquare className="w-5 h-5 text-amber-400" />
            <span>Follow-ups & Customer Reminders</span>
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Never miss a customer commitment or scheduled WhatsApp follow-up
          </p>
        </div>

        <button
          onClick={() => setShowAddModal(true)}
          className="px-3.5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-medium flex items-center gap-1.5 transition-all shadow-lg shadow-indigo-600/25 cursor-pointer self-start sm:self-auto"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>New Follow-up</span>
        </button>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-1 bg-slate-900/60 p-1.5 rounded-2xl border border-slate-800 w-fit">
        {(['pending', 'completed', 'all'] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setFilter(tab)}
            className={`px-3 py-1 text-xs rounded-xl font-medium capitalize transition-colors cursor-pointer ${
              filter === tab
                ? 'bg-indigo-600 text-white shadow-sm font-semibold'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Tasks List */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-2xl divide-y divide-slate-800/60 shadow-sm overflow-hidden">
        {loading ? (
          <div className="py-12 text-center text-slate-500 text-xs flex flex-col items-center gap-2">
            <div className="w-5 h-5 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
            <span>Loading follow-up tasks...</span>
          </div>
        ) : filteredTasks.length === 0 ? (
          <div className="py-12 text-center text-slate-500 text-xs">
            No tasks in this category.
          </div>
        ) : (
          filteredTasks.map((task) => {
            const isCompleted = task.status === 'completed';
            const isOverdue = !isCompleted && task.due_date && new Date(task.due_date) < new Date();

            return (
              <div
                key={task.id}
                className="p-4 hover:bg-slate-800/40 transition-colors flex items-center justify-between gap-4"
              >
                <div className="flex items-center gap-3.5 min-w-0">
                  <button
                    onClick={() => handleToggleTask(task.id, task.status)}
                    className={`w-5 h-5 rounded-lg border flex items-center justify-center transition-colors cursor-pointer shrink-0 ${
                      isCompleted
                        ? 'bg-emerald-600 border-emerald-500 text-white'
                        : 'border-slate-700 hover:border-indigo-500 bg-slate-950'
                    }`}
                  >
                    {isCompleted && <Check className="w-3.5 h-3.5" />}
                  </button>

                  <div className="min-w-0">
                    <h4
                      className={`text-xs font-semibold truncate ${
                        isCompleted ? 'text-slate-500 line-through' : 'text-white'
                      }`}
                    >
                      {task.title}
                    </h4>

                    <div className="flex items-center gap-3 text-[11px] text-slate-400 mt-1">
                      {task.contact && (
                        <span className="flex items-center gap-1">
                          <User className="w-3 h-3 text-slate-500" />
                          <span>{task.contact.name || '+' + task.contact.wa_id}</span>
                        </span>
                      )}

                      {task.due_date && (
                        <span
                          className={`flex items-center gap-1 font-mono ${
                            isOverdue ? 'text-red-400 font-bold' : 'text-slate-400'
                          }`}
                        >
                          <Clock className="w-3 h-3" />
                          <span>{new Date(task.due_date).toLocaleString()}</span>
                          {isOverdue && <span>(Overdue)</span>}
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                <div className="shrink-0">
                  <span
                    className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold border uppercase ${
                      isCompleted
                        ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30'
                        : isOverdue
                        ? 'bg-red-500/20 text-red-300 border-red-500/30'
                        : 'bg-amber-500/20 text-amber-300 border-amber-500/30'
                    }`}
                  >
                    {isCompleted ? 'Completed' : isOverdue ? 'Overdue' : 'Pending'}
                  </span>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Add Task Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-md w-full p-6 shadow-2xl">
            <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-800">
              <h3 className="text-sm font-bold text-white">Create Follow-up Reminder</h3>
              <button onClick={() => setShowAddModal(false)} className="text-slate-400 hover:text-white">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateTask} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Task Title *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Follow up on custom branding proposal"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl py-2 px-3 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Customer (Optional)</label>
                <select
                  value={contactId}
                  onChange={(e) => setContactId(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl py-2 px-3 text-xs text-white focus:outline-none focus:border-indigo-500 cursor-pointer"
                >
                  <option value="">No customer attached</option>
                  {contacts.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name || 'Customer'} (+{c.wa_id})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Due Date & Time *</label>
                <input
                  type="datetime-local"
                  required
                  value={dueDate}
                  onChange={(e) => setDueDate(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl py-2 px-3 text-xs text-white focus:outline-none focus:border-indigo-500"
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
                  Save Reminder
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
