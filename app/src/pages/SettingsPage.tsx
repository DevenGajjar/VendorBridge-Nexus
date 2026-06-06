import { useState } from 'react';
import { motion } from 'framer-motion';
import { Settings, Shield, Bell, Lock, Database } from 'lucide-react';
import { Badge } from '@/components/shared/Badge';

export default function SettingsPage() {
  const user = JSON.parse(localStorage.getItem("user") || "null");
  const [notifs, setNotifs] = useState(true);
  const [auditNotify, setAuditNotify] = useState(false);

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white tracking-tight">System Settings</h1>
        <p className="text-sm text-[#94A3B8] mt-1">Configure profile preferences, system notifications, and security protocols</p>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-[#111827] border border-white/5 rounded-xl p-6 space-y-6 shadow-2xl"
      >
        {/* User Card */}
        <div className="flex items-center justify-between pb-6 border-b border-white/5">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-gradient-to-br from-[#4F46E5] to-[#7C3AED] rounded-xl flex items-center justify-center text-lg font-bold text-white shadow-glow-sm">
              {user ? `${user.first_name[0]}${user.last_name[0]}`.toUpperCase() : 'SC'}
            </div>
            <div>
              <h3 className="text-white font-semibold text-base">{user ? `${user.first_name} ${user.last_name}` : 'Sarah Chen'}</h3>
              <p className="text-xs text-[#94A3B8] mt-0.5">{user?.email || 'admin@vendorbridge.com'}</p>
            </div>
          </div>
          <Badge variant="primary">{user?.role?.name || 'ADMIN'}</Badge>
        </div>

        {/* Configurations */}
        <div className="space-y-4">
          <h4 className="text-white font-semibold text-sm flex items-center gap-2 mb-3">
            <Bell className="w-4 h-4 text-[#4F46E5]" />
            Notification Settings
          </h4>
          <div className="flex items-center justify-between py-2">
            <div>
              <p className="text-sm text-white font-medium">System Notifications</p>
              <p className="text-xs text-[#64748B]">Receive push updates for critical RFQ and Invoice events</p>
            </div>
            <input 
              type="checkbox" 
              checked={notifs} 
              onChange={() => setNotifs(!notifs)} 
              className="w-4 h-4 accent-[#4F46E5] cursor-pointer"
            />
          </div>
          <div className="flex items-center justify-between py-2 border-b border-white/5 pb-4">
            <div>
              <p className="text-sm text-white font-medium">Audit Alerts</p>
              <p className="text-xs text-[#64748B]">Send alerts to email on security configuration overrides</p>
            </div>
            <input 
              type="checkbox" 
              checked={auditNotify} 
              onChange={() => setAuditNotify(!auditNotify)} 
              className="w-4 h-4 accent-[#4F46E5] cursor-pointer"
            />
          </div>
        </div>

        {/* Security Info */}
        <div className="space-y-4 pt-2">
          <h4 className="text-white font-semibold text-sm flex items-center gap-2 mb-3">
            <Lock className="w-4 h-4 text-[#4F46E5]" />
            Platform Security
          </h4>
          <div className="bg-[#1B2240] rounded-xl p-4 border border-white/5 flex items-start gap-3">
            <Shield className="w-5 h-5 text-emerald-400 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-xs text-white font-semibold">RBAC (Role Based Access Control) Enabled</p>
              <p className="text-[11px] text-[#94A3B8] leading-relaxed mt-0.5">
                Your account is locked into the role configuration profiles defined by the system administrator. URL manual entries are protected by frontend guard middleware.
              </p>
            </div>
          </div>
        </div>

        {/* System Settings */}
        <div className="space-y-4 pt-2">
          <h4 className="text-white font-semibold text-sm flex items-center gap-2 mb-3">
            <Database className="w-4 h-4 text-[#4F46E5]" />
            Data Source
          </h4>
          <div className="text-xs flex items-center justify-between bg-[#1B2240]/40 rounded-lg p-3 border border-white/5">
            <span className="text-[#94A3B8]">Connected Database</span>
            <span className="font-mono text-white text-[11px]">PostgreSQL @ localhost:5432</span>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
