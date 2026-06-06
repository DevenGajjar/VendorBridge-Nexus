import { useRef, useEffect } from 'react';
import gsap from 'gsap';

export function VendorRatingRing() {
  const circleRef = useRef<SVGCircleElement>(null);
  const radius = 30;
  const circumference = 2 * Math.PI * radius;

  useEffect(() => {
    if (!circleRef.current) return;
    const progress = 4.6 / 5.0;
    const dashoffset = circumference - progress * circumference;

    gsap.fromTo(
      circleRef.current,
      { strokeDashoffset: circumference },
      { strokeDashoffset: dashoffset, duration: 1.5, ease: 'power3.out', delay: 0.5 }
    );

    return () => {
      gsap.killTweensOf(circleRef.current);
    };
  }, []);

  return (
    <div className="relative w-20 h-20 flex items-center justify-center">
      <svg className="transform -rotate-90 w-full h-full">
        <circle
          cx="40"
          cy="40"
          r={radius}
          stroke="#1B2240"
          strokeWidth="6"
          fill="transparent"
        />
        <circle
          cx="40"
          cy="40"
          r={radius}
          stroke="#4F46E5"
          strokeWidth="6"
          fill="transparent"
          strokeDasharray={circumference}
          strokeLinecap="round"
          ref={circleRef}
        />
      </svg>
      <div className="absolute text-white font-mono font-bold text-lg">4.6</div>
    </div>
  );
}
