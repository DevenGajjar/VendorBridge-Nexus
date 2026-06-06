import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useEffect, useRef } from 'react';
import gsap from 'gsap';

export function SuccessOverlay() {
  const navigate = useNavigate();
  const circleRef = useRef<SVGCircleElement>(null);
  const pathRef = useRef<SVGPathElement>(null);

  useEffect(() => {
    if (!circleRef.current || !pathRef.current) return;

    const circumference = 2 * Math.PI * 35;
    gsap.set(circleRef.current, { strokeDasharray: circumference, strokeDashoffset: circumference });
    gsap.set(pathRef.current, { strokeDasharray: 100, strokeDashoffset: 100 });

    const tl = gsap.timeline();
    tl.to(circleRef.current, {
      strokeDashoffset: 0,
      duration: 0.75,
      ease: 'power3.out',
    });
    tl.to(
      pathRef.current,
      {
        strokeDashoffset: 0,
        duration: 0.5,
        ease: 'power3.out',
      },
      '-=0.25'
    );

    return () => { tl.kill(); };
  }, []);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm"
    >
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: 'spring', stiffness: 300, damping: 25 }}
        className="bg-[#111827] border border-white/10 rounded-2xl p-8 max-w-md w-full mx-4 text-center shadow-2xl"
      >
        <div className="flex justify-center mb-6">
          <svg width="75" height="75" viewBox="0 0 75 75">
            <circle
              ref={circleRef}
              cx="37.5"
              cy="37.5"
              r="35"
              stroke="#4F46E5"
              strokeWidth="4"
              fill="none"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            <path
              ref={pathRef}
              d="M19.5,44.5 L31,56 L52,25"
              stroke="#FFFFFF"
              strokeWidth="4"
              fill="none"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </div>

        <h2 className="text-xl font-bold text-white mb-2">Submission Successful</h2>
        <p className="text-sm text-[#94A3B8] mb-8">
          Your vendor registration has been submitted for approval. You will be notified once it is reviewed.
        </p>

        <div className="flex items-center gap-3 justify-center">
          <button
            onClick={() => window.location.reload()}
            className="px-4 py-2.5 border border-white/10 rounded-lg text-sm text-[#94A3B8] hover:text-white hover:border-white/20 transition-all"
          >
            Submit Another
          </button>
          <button
            onClick={() => navigate('/')}
            className="px-4 py-2.5 bg-[#4F46E5] hover:bg-[#4338CA] text-white text-sm font-medium rounded-lg shadow-glow-sm hover:shadow-glow transition-all"
          >
            View Dashboard
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}
