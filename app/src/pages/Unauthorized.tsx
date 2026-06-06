import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ShieldAlert, Home, ArrowLeft } from 'lucide-react';

export default function Unauthorized() {
  const navigate = useNavigate();

  return (
    <div className="min-h-[70vh] flex flex-col items-center justify-center text-center px-4 relative overflow-hidden">
      {/* Background radial highlight */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[300px] h-[300px] bg-red-950/20 rounded-full blur-[100px] -z-10" />

      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.3 }}
        className="max-w-md w-full bg-[#111827] border border-white/5 p-8 rounded-2xl shadow-2xl relative"
      >
        <div className="w-16 h-16 bg-red-900/20 border border-red-500/30 rounded-2xl flex items-center justify-center mx-auto mb-6">
          <ShieldAlert className="w-8 h-8 text-red-500 animate-pulse" />
        </div>

        <h1 className="text-3xl font-extrabold text-white tracking-tight mb-2">403 - Access Denied</h1>
        <p className="text-sm text-[#94A3B8] leading-relaxed mb-8">
          You do not have the required role privileges to access this resource. If you believe this is an error, please verify your credentials or contact the systems administrator.
        </p>

        <div className="flex gap-4">
          <button
            onClick={() => navigate(-1)}
            className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-[#1B2240] hover:bg-[#1B2240]/80 text-[#94A3B8] hover:text-white text-sm font-semibold rounded-lg transition-all"
          >
            <ArrowLeft className="w-4 h-4" />
            Go Back
          </button>
          <button
            onClick={() => navigate('/')}
            className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-[#4F46E5] hover:bg-[#4338CA] text-white text-sm font-semibold rounded-lg shadow-glow hover:shadow-glow-lg transition-all"
          >
            <Home className="w-4 h-4" />
            Home Panel
          </button>
        </div>
      </motion.div>
    </div>
  );
}
