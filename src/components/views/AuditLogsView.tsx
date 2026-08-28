import React, { useState, useEffect } from 'react';
import {
  ShieldAlert,
  Search,
  Filter,
  Clock,
  User,
  Activity,
  FileCode2,
  Lock,
  RefreshCw,
} from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { AuditLog } from '../../types/crm';

export const AuditLogsView: React.FC = () => {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedLog, setSelectedLog] = useState<AuditLog | null>(null);

  const fetchAuditLogs = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('audit_logs')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(100);

      if (data) setLogs(data as AuditLog[]);
    } catch (e) {
      console.error('Error fetching audit logs:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAuditLogs();
  }, []);

  const filteredLogs = logs.filter((log) => {
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const action = (log.action || '').toLowerCase();
      const entity = (log.entity_type || '').toLowerCase();
      return action.includes(q) || entity.includes(q);
    }
    return true;
  });

  return (
    <div className="p-6 space-y-6 max-w-6xl mx-auto overflow-y-auto">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-bold text-white tracking-tight flex items-center gap-2">
            <ShieldAlert className="w-5 h-5 text-indigo-400" />
            <span>Security & Compliance Audit Logs</span>
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Immutable chronological security trail of CRM administrative actions and data operations
          </p>
        </div>

        <button
          onClick={fetchAuditLogs}
          className="px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-800 rounded-xl text-xs font-medium flex items-center gap-1.5 transition-colors cursor-pointer self-start sm:self-auto"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          <span>Refresh Logs</span>
        </button>
      </div>

      {/* Search Bar */}
      <div className="relative max-w-md">
        <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
        <input
          type="text"
          placeholder="Filter by action or entity type..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full bg-slate-900 border border-slate-800 rounded-xl py-2 pl-9 pr-3 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
        />
      </div>

      {/* Audit Logs Table */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-2xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-300">
            <thead className="bg-slate-950/80 text-slate-400 font-semibold border-b border-slate-800 uppercase tracking-wider text-[10px]">
              <tr>
                <th className="py-3 px-4">Action</th>
                <th className="py-3 px-4">Entity</th>
                <th className="py-3 px-4">Entity ID</th>
                <th className="py-3 px-4">IP / Actor</th>
                <th className="py-3 px-4 text-right">Timestamp</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 font-mono text-[11px]">
              {loading ? (
                <tr>
                  <td colSpan={5} className="py-12 text-center text-slate-500 font-sans text-xs">
                    <div className="w-5 h-5 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
                    Loading audit trail...
                  </td>
                </tr>
              ) : filteredLogs.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-12 text-center text-slate-500 font-sans text-xs">
                    No audit records recorded yet.
                  </td>
                </tr>
              ) : (
                filteredLogs.map((log) => (
                  <tr
                    key={log.id}
                    onClick={() => setSelectedLog(log)}
                    className="hover:bg-slate-800/40 transition-colors cursor-pointer"
                  >
                    <td className="py-3 px-4 font-semibold text-white font-sans">
                      <span className="px-2 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 text-[10px] uppercase">
                        {log.action}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-slate-300">
                      {log.entity_type}
                    </td>
                    <td className="py-3 px-4 text-slate-400 truncate max-w-[120px]">
                      {log.entity_id || '—'}
                    </td>
                    <td className="py-3 px-4 text-slate-400">
                      {log.ip_address || '127.0.0.1'}
                    </td>
                    <td className="py-3 px-4 text-right text-slate-500">
                      {new Date(log.created_at).toLocaleString()}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Selected Log Detail Modal */}
      {selectedLog && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-lg w-full p-6 shadow-2xl">
            <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-800">
              <h3 className="text-sm font-bold text-white">Audit Log Details</h3>
              <button onClick={() => setSelectedLog(null)} className="text-slate-400 hover:text-white">
                ✕
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <span className="text-slate-400 text-[11px]">Action:</span>
                <div className="font-bold text-white">{selectedLog.action}</div>
              </div>

              <div>
                <span className="text-slate-400 text-[11px]">Entity Type:</span>
                <div className="text-slate-200">{selectedLog.entity_type}</div>
              </div>

              <div>
                <span className="text-slate-400 text-[11px]">Timestamp:</span>
                <div className="text-slate-200 font-mono">{selectedLog.created_at}</div>
              </div>

              {selectedLog.changes && (
                <div>
                  <span className="text-slate-400 text-[11px]">Payload Changes:</span>
                  <pre className="mt-1 p-3 bg-slate-950 rounded-xl border border-slate-800 font-mono text-[11px] text-slate-300 overflow-x-auto max-h-48">
                    {JSON.stringify(selectedLog.changes, null, 2)}
                  </pre>
                </div>
              )}
            </div>

            <div className="mt-5 pt-3 border-t border-slate-800 flex justify-end">
              <button
                onClick={() => setSelectedLog(null)}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-xs font-medium"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
