import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { FileSearch, Clock, RefreshCw, UserCheck } from 'lucide-react';
import { apiFetch } from '@/lib/api';

export default function AuditLogs() {
  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  async function loadLogs() {
    setLoading(true);
    try {
      const res = await apiFetch("/audit-logs?page=1&page_size=100");
      if (res && res.success && res.data && res.data.items) {
        setLogs(res.data.items);
      }
    } catch (err) {
      console.error("Failed to load audit logs: ", err);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadLogs();
  }, []);

  const filtered = logs.filter(log =>
    log.action.toLowerCase().includes(search.toLowerCase()) ||
    log.entity_type.toLowerCase().includes(search.toLowerCase()) ||
    (log.user_email && log.user_email.toLowerCase().includes(search.toLowerCase()))
  );

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight">System Audit Logs</h1>
          <p className="text-sm text-[#94A3B8] mt-1">Immutable transaction audit trail for ERP operations</p>
        </div>
        <button
          onClick={loadLogs}
          className="flex items-center gap-2 px-3 py-2 bg-[#1B2240] hover:bg-[#1B2240]/80 text-[#94A3B8] hover:text-white text-xs font-medium rounded-lg transition-all"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          Refresh Trails
        </button>
      </div>

      {/* Filter and Search */}
      <div className="relative max-w-sm">
        <FileSearch className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#64748B]" />
        <input
          type="text"
          placeholder="Filter by action or entity..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full bg-[#1B2240] border border-transparent focus:border-[#4F46E5] rounded-lg pl-10 pr-4 py-2 text-sm text-white placeholder-[#64748B] outline-none transition-all focus:ring-2 focus:ring-[#4F46E5]/20"
        />
      </div>

      {/* Audit Trails Table */}
      <div className="bg-[#111827] border border-white/5 rounded-xl overflow-hidden shadow-2xl">
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="bg-[#1B2240]">
              <th className="py-3 px-4 text-xs font-semibold text-[#94A3B8] uppercase">Action</th>
              <th className="py-3 px-4 text-xs font-semibold text-[#94A3B8] uppercase">Entity Type</th>
              <th className="py-3 px-4 text-xs font-semibold text-[#94A3B8] uppercase">Entity reference ID</th>
              <th className="py-3 px-4 text-xs font-semibold text-[#94A3B8] uppercase">Logged At</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={4} className="py-8 text-center text-sm text-[#64748B]">
                  Querying audit log ledger...
                </td>
              </tr>
            ) : filtered.length === 0 ? (
              <tr>
                <td colSpan={4} className="py-8 text-center text-sm text-[#64748B]">
                  No audit trail items recorded.
                </td>
              </tr>
            ) : (
              filtered.map((log, idx) => (
                <motion.tr
                  key={log.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.02 }}
                  className="border-b border-white/5 hover:bg-white/5 transition-colors"
                >
                  <td className="py-4 px-4">
                    <div>
                      <p className="text-white font-medium text-sm">{log.action}</p>
                      {log.user_email && (
                        <p className="text-xs text-[#64748B] flex items-center gap-1 mt-0.5">
                          <UserCheck className="w-3 h-3 text-[#4F46E5]" />
                          {log.user_email}
                        </p>
                      )}
                    </div>
                  </td>
                  <td className="py-4 px-4 text-white text-xs font-semibold">{log.entity_type}</td>
                  <td className="py-4 px-4 text-[#64748B] font-mono text-[10px] tracking-tight truncate max-w-[150px]">
                    {log.entity_id}
                  </td>
                  <td className="py-4 px-4 text-[#94A3B8] font-mono text-xs flex items-center gap-1.5 mt-2.5">
                    <Clock className="w-3.5 h-3.5" />
                    {log.created_at ? new Date(log.created_at).toLocaleString() : 'N/A'}
                  </td>
                </motion.tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
