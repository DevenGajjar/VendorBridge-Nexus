import { useRef, useEffect } from 'react';
import gsap from 'gsap';
import { vendorBarData } from '@/data/mockData';

export function ActiveVendorsChart() {
  const barRefs = useRef<(HTMLDivElement | null)[]>([]);

  useEffect(() => {
    barRefs.current.forEach((bar, i) => {
      if (!bar) return;
      gsap.fromTo(
        bar,
        { scaleY: 0 },
        {
          scaleY: 1,
          duration: 0.8,
          delay: i * 0.15,
          ease: 'back.out(1.7)',
          transformOrigin: 'bottom',
        }
      );
    });

    return () => {
      barRefs.current.forEach((bar) => {
        if (bar) gsap.killTweensOf(bar);
      });
    };
  }, []);

  const handleMouseEnter = (index: number) => {
    barRefs.current.forEach((bar, i) => {
      if (!bar) return;
      gsap.to(bar, {
        scaleY: i === index ? vendorBarData[i] + 0.1 : vendorBarData[i] * 0.8,
        duration: 0.3,
        ease: 'power2.out',
        transformOrigin: 'bottom',
      });
    });
  };

  const handleMouseLeave = () => {
    barRefs.current.forEach((bar, i) => {
      if (!bar) return;
      gsap.to(bar, {
        scaleY: vendorBarData[i],
        duration: 0.3,
        ease: 'power2.out',
        transformOrigin: 'bottom',
      });
    });
  };

  return (
    <div className="flex items-end gap-2 h-16 w-full px-4">
      {vendorBarData.map((val, i) => (
        <div
          key={i}
          ref={(el) => { barRefs.current[i] = el; }}
          className="w-full bg-[#4F46E5] rounded-t-md opacity-80 hover:opacity-100 transition-opacity cursor-pointer"
          style={{ height: `${val * 100}%` }}
          onMouseEnter={() => handleMouseEnter(i)}
          onMouseLeave={handleMouseLeave}
        />
      ))}
    </div>
  );
}
