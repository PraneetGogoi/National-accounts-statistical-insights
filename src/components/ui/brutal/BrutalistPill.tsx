import { ReactNode, useRef } from "react";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";

gsap.registerPlugin(useGSAP);

interface BrutalistPillProps {
  children: ReactNode;
  className?: string;
  onClick?: () => void;
  active?: boolean;
}

export function BrutalistPill({ children, className = "", onClick, active }: BrutalistPillProps) {
  const ref = useRef<HTMLButtonElement>(null);

  useGSAP(() => {
    if (!ref.current) return;
    const el = ref.current;
    
    // Magnetic effect
    const bound = 0.4;
    const onMouseMove = (e: MouseEvent) => {
      const r = el.getBoundingClientRect();
      const x = (e.clientX - r.left - r.width / 2) * bound;
      const y = (e.clientY - r.top - r.height / 2) * bound;
      gsap.to(el, { x, y, duration: 0.4, ease: 'power3.out' });
    };
    const onMouseLeave = () => {
      gsap.to(el, { x: 0, y: 0, duration: 1.1, ease: 'elastic.out(1, 0.35)' });
    };

    el.addEventListener('mousemove', onMouseMove);
    el.addEventListener('mouseleave', onMouseLeave);
    
    return () => {
      el.removeEventListener('mousemove', onMouseMove);
      el.removeEventListener('mouseleave', onMouseLeave);
    };
  }, { scope: ref });

  return (
    <button 
      ref={ref}
      onClick={onClick}
      className={`pill magnetic ${active ? '!bg-ink !text-paper' : ''} ${className}`}
    >
      {children}
    </button>
  );
}
