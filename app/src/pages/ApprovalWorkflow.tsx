import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { CheckCircle, Clock, Circle, User, MessageSquare, AlertCircle, RefreshCw } from 'lucide-react';
import { Badge } from '@/components/shared/Badge';
import { apiFetch } from '@/lib/api';

const stageIcons: Record<string, React.ElementType> = {
  APPROVED: CheckCircle,
  PENDING: Clock,
  REJECTED: Circle,
};

const stageColors: Record<string, string> = {
  APPROVED: '#10B981',
  PENDING: '#F59E0B',
  REJECTED: '#EF4444',
};

export default function ApprovalWorkflow() {
  const [requests, setRequests] = useState<any[]>([]);
  const [selectedRequestId, setSelectedRequestId] = useState<string>('');
  const [timeline, setTimeline] = useState<any[]>([]);
  const [remarks, setRemarks] = useState('');
  const [loading, setLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const currentUser = JSON.parse(localStorage.getItem('user') || '{}');
  const userRole = localStorage.getItem('role') || '';

  async function loadRequests() {
    setLoading(true);
    setError('');
    try {
      const res = await apiFetch("/approvals?page=1&page_size=100");
      if (res && res.success && res.data?.items) {
        setRequests(res.data.items);
        if (res.data.items.length > 0) {
          setSelectedRequestId(res.data.items[0].id);
        }
      }
    } catch (err: any) {
      console.error("Failed to load approvals: ", err);
      setError(err.message || "Failed to load approval requests.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadRequests();
  }, []);

  const selectedRequest = requests.find(r => r.id === selectedRequestId);

  // Load timeline for selected request entity
  useEffect(() => {
    if (!selectedRequest) return;

    async function loadTimeline() {
      try {
        const res = await apiFetch(`/approvals/timeline?entity_type=${selectedRequest.entity_type}&entity_id=${selectedRequest.entity_id}`);
        if (res && res.success && res.data) {
          setTimeline(res.data);
        }
      } catch (err) {
        console.error("Failed to load timeline: ", err);
      }
    }
    loadTimeline();
  }, [selectedRequest]);

  const handleAction = async (status: 'APPROVED' | 'REJECTED') => {
    if (!selectedRequestId) return;

    setActionLoading(true);
    setError('');
    setSuccess('');

    try {
      const res = await apiFetch(`/approvals/${selectedRequestId}/action`, {
        method: 'POST',
        json: {
          status,
          comments: remarks || `${status} remarks`
        }
      });

      if (res && res.success) {
        setSuccess(`Request successfully ${status.toLowerCase()}!`);
        setRemarks('');
        // Reload all requests
        await loadRequests();
      }
    } catch (err: any) {
      setError(err.message || "Action failed.");
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <div>
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight">Approval Workflow Command</h1>
          <p className="text-sm text-[#94A3B8] mt-1">
            Review and approve pending transactional bids, POs, and RFQs
          </p>
        </div>

        {/* Requests Selector */}
        {requests.length > 0 && (
          <div className="flex items-center gap-2">
            <span className="text-xs text-[#94A3B8] font-medium uppercase">Select Request:</span>
            <select
              value={selectedRequestId}
              onChange={(e) => setSelectedRequestId(e.target.value)}
              className="bg-[#1B2240] border border-white/10 rounded-lg px-3 py-2 text-xs text-white outline-none focus:border-[#4F46E5]"
            >
              {requests.map(r => (
                <option key={r.id} value={r.id}>
                  {r.entity_type} ({r.status}) - {r.id.slice(0, 8)}...
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      {success && (
        <div className="mb-4 p-4 bg-green-500/10 border border-green-500/20 text-green-500 text-sm rounded-lg">
          {success}
        </div>
      )}

      {error && (
        <div className="mb-4 p-4 bg-red-500/10 border border-red-500/20 text-red-500 text-sm rounded-lg flex items-center gap-2">
          <AlertCircle className="w-4 h-4" />
          {error}
        </div>
      )}

      {loading && (
        <div className="flex items-center justify-center py-20 text-[#94A3B8] text-sm">
          Loading approval requests...
        </div>
      )}

      {!loading && requests.length === 0 && (
        <div className="flex flex-col items-center justify-center py-20 text-[#94A3B8] text-sm gap-2">
          <AlertCircle className="w-8 h-8" />
          <span>No approval requests found in the system.</span>
        </div>
      )}

      {selectedRequest && !loading && (
        <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
          {/* Timeline */}
          <div className="col-span-1 md:col-span-8">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-[#111827] border border-white/5 rounded-xl p-6"
            >
              <h3 className="text-sm font-semibold text-white mb-6">Approval Timeline Details</h3>

              <div className="relative">
                {/* Vertical line */}
                <div className="absolute left-[19px] top-0 bottom-0 w-px bg-white/10" />

                <div className="space-y-6">
                  {timeline.length > 0 ? (
                    timeline.map((stage: any, i: number) => {
                      const Icon = stageIcons[stage.status] || Clock;
                      const color = stageColors[stage.status] || '#F59E0B';
                      const isActive = stage.status === 'PENDING';

                      return (
                        <motion.div
                          key={stage.id}
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: i * 0.1 }}
                          className="relative flex items-start gap-4"
                        >
                          <div
                            className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 z-10"
                            style={{ backgroundColor: `${color}20` }}
                          >
                            <Icon className="w-5 h-5" style={{ color }} />
                          </div>
                          <div className={`flex-1 p-4 rounded-xl border ${
                            isActive ? 'bg-[#4F46E5]/5 border-[#4F46E5]/30' : 'bg-[#090C18] border-white/5'
                          }`}>
                            <div className="flex items-center justify-between mb-1">
                              <h4 className="text-sm font-semibold text-white">{selectedRequest.entity_type} {stage.status}</h4>
                              <Badge variant={
                                stage.status === 'APPROVED' ? 'success' :
                                stage.status === 'PENDING' ? 'warning' : 'danger'
                              }>
                                {stage.status}
                              </Badge>
                            </div>
                            <p className="text-xs text-[#E2E8F0] mt-1 italic">"{stage.comments || 'No comments'}"</p>
                            <div className="flex items-center gap-4 mt-3 text-xs text-[#94A3B8]">
                              <span className="flex items-center gap-1">
                                <User className="w-3 h-3" />
                                Approver: {stage.action_by}
                              </span>
                              <span>{stage.timestamp ? new Date(stage.timestamp).toLocaleString() : 'N/A'}</span>
                            </div>
                          </div>
                        </motion.div>
                      );
                    })
                  ) : (
                    <div className="text-xs text-[#94A3B8] italic">No timeline event registered. Defaulting to base request.</div>
                  )}
                </div>
              </div>
            </motion.div>
          </div>

          {/* Actions Panel */}
          <div className="col-span-1 md:col-span-4 space-y-4">
            {selectedRequest.status === 'PENDING' && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="bg-[#111827] border border-[#4F46E5]/20 rounded-xl p-6"
              >
                <h3 className="text-sm font-semibold text-white mb-4">Pending Stage Actions</h3>
                <p className="text-xs text-[#94A3B8] mb-4">
                  This {selectedRequest.entity_type} requires Manager approval.
                </p>

                <div className="space-y-3">
                  <textarea
                    required
                    placeholder="Enter review remarks..."
                    value={remarks}
                    onChange={(e) => setRemarks(e.target.value)}
                    rows={2}
                    className="w-full bg-[#161B30] border border-white/5 focus:border-[#4F46E5] rounded-lg px-3 py-2 text-xs text-white placeholder-[#64748B] outline-none resize-none mb-2"
                  />

                  <button
                    onClick={() => handleAction('APPROVED')}
                    disabled={actionLoading}
                    className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-[#10B981] hover:bg-[#059669] text-white text-xs font-semibold rounded-lg transition-all disabled:opacity-50"
                  >
                    <CheckCircle className="w-4 h-4" />
                    Approve
                  </button>
                  <button
                    onClick={() => handleAction('REJECTED')}
                    disabled={actionLoading}
                    className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-[#EF4444] hover:bg-[#DC2626] text-white text-xs font-semibold rounded-lg transition-all disabled:opacity-50"
                  >
                    <X className="w-4 h-4" />
                    Reject
                  </button>
                </div>
              </motion.div>
            )}

            {/* Activity History */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="bg-[#111827] border border-white/5 rounded-xl p-6"
            >
              <h3 className="text-sm font-semibold text-white mb-4">Verification Metadata</h3>
              <div className="space-y-3 text-xs">
                <div className="flex justify-between">
                  <span className="text-[#94A3B8]">Request ID:</span>
                  <span className="font-mono text-white">{selectedRequest.id.slice(0, 8)}...</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#94A3B8]">Entity ID:</span>
                  <span className="font-mono text-[#4F46E5]">{selectedRequest.entity_id.slice(0, 8)}...</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#94A3B8]">Entity Type:</span>
                  <span className="text-white font-semibold">{selectedRequest.entity_type}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#94A3B8]">Status:</span>
                  <Badge variant={selectedRequest.status === 'PENDING' ? 'warning' : 'success'}>
                    {selectedRequest.status}
                  </Badge>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      )}
    </div>
  );
}

function X({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
    </svg>
  );
}
