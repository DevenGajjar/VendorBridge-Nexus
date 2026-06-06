import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { User, Shield, Star, Mail, Phone, MapPin } from 'lucide-react';
import { apiFetch } from '@/lib/api';
import { Badge } from '@/components/shared/Badge';

export default function ProfilePage() {
  const user = JSON.parse(localStorage.getItem("user") || "null");
  const [vendorProfile, setVendorProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadVendorProfile() {
      if (!user) return;
      try {
        const res = await apiFetch("/vendors?page=1&page_size=100");
        if (res && res.success && res.data && res.data.items) {
          // Find vendor linked to this user's email
          const matched = res.data.items.find((v: any) => v.email.toLowerCase() === user.email.toLowerCase() || v.user_id === user.id);
          if (matched) {
            setVendorProfile(matched);
          }
        }
      } catch (err) {
        console.error("Failed to fetch vendor profile: ", err);
      } finally {
        setLoading(false);
      }
    }
    loadVendorProfile();
  }, [user]);

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white tracking-tight">My Profile</h1>
        <p className="text-sm text-[#94A3B8] mt-1">Manage personal info and linked corporate credentials</p>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-[#111827] border border-white/5 rounded-xl p-6 space-y-6 shadow-2xl"
      >
        {/* User Card */}
        <div className="flex items-center gap-4 pb-6 border-b border-white/5">
          <div className="w-14 h-14 bg-gradient-to-br from-[#4F46E5] to-[#7C3AED] rounded-xl flex items-center justify-center text-xl font-bold text-white shadow-glow-sm">
            {user ? `${user.first_name[0]}${user.last_name[0]}`.toUpperCase() : 'V'}
          </div>
          <div>
            <h3 className="text-white font-semibold text-base">{user ? `${user.first_name} ${user.last_name}` : 'Vendor Partner'}</h3>
            <p className="text-xs text-[#94A3B8] mt-0.5">{user?.email || 'vendor@company.com'}</p>
            <div className="flex gap-2 mt-2">
              <Badge variant="primary">{user?.role?.name || 'VENDOR'}</Badge>
              {vendorProfile && <Badge variant="success">Linked Vendor Profile</Badge>}
            </div>
          </div>
        </div>

        {/* Vendor Profile Info */}
        {loading ? (
          <p className="text-sm text-[#64748B] py-4 text-center">Loading linked profile...</p>
        ) : vendorProfile ? (
          <div className="space-y-4">
            <h4 className="text-white font-semibold text-sm flex items-center gap-2 mb-3">
              <Shield className="w-4 h-4 text-[#4F46E5]" />
              Linked Corporate Profile
            </h4>
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-[#1B2240] rounded-lg p-3">
                <p className="text-[10px] text-[#64748B] uppercase tracking-wider mb-1">Company Name</p>
                <p className="text-xs text-white font-semibold">{vendorProfile.name}</p>
              </div>
              <div className="bg-[#1B2240] rounded-lg p-3">
                <p className="text-[10px] text-[#64748B] uppercase tracking-wider mb-1">Vendor Code</p>
                <p className="text-xs text-white font-mono">{vendorProfile.vendor_code}</p>
              </div>
              <div className="bg-[#1B2240] rounded-lg p-3">
                <p className="text-[10px] text-[#64748B] uppercase tracking-wider mb-1">GST Registration</p>
                <p className="text-xs text-white font-mono">{vendorProfile.gst_number}</p>
              </div>
              <div className="bg-[#1B2240] rounded-lg p-3 flex items-center justify-between">
                <div>
                  <p className="text-[10px] text-[#64748B] uppercase tracking-wider mb-1">Performance Rating</p>
                  <p className="text-xs text-white font-semibold">{vendorProfile.rating || 'N/A'}</p>
                </div>
                <Star className="w-4 h-4 text-amber-400 fill-amber-400" />
              </div>
            </div>

            <div className="bg-[#1B2240] rounded-lg p-3 space-y-2.5">
              <p className="text-[10px] text-[#64748B] uppercase tracking-wider">Contact Info</p>
              <p className="text-xs text-white flex items-center gap-2">
                <Phone className="w-3.5 h-3.5 text-[#94A3B8]" />
                {vendorProfile.phone || 'No phone supplied'}
              </p>
              <p className="text-xs text-white flex items-center gap-2">
                <MapPin className="w-3.5 h-3.5 text-[#94A3B8]" />
                {vendorProfile.address || 'No address supplied'}
              </p>
            </div>
          </div>
        ) : (
          <div className="bg-[#1B2240]/40 rounded-xl p-4 border border-white/5 flex items-start gap-3">
            <User className="w-5 h-5 text-[#94A3B8] flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-xs text-white font-semibold">Standalone Profile</p>
              <p className="text-[11px] text-[#94A3B8] leading-relaxed mt-0.5">
                This account is currently not linked to an onboarding business vendor profile. Submit a vendor onboarding form to attach corporate records to your account.
              </p>
            </div>
          </div>
        )}
      </motion.div>
    </div>
  );
}
