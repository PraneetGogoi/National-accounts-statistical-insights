import { ReactNode, useRef } from "react";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger, useGSAP);

interface BrutalistCardProps {
  children: ReactNode;
  className?: string;
  delay?: number;
  onClick?: () => void;
}

export function BrutalistCard({ children, className = "", delay = 0, onClick }: BrutalistCardProps) {
  const cardRef = useRef<HTMLDivElement>(null);

  useGSAP(() => {
    if (!cardRef.current) return;
    const el = cardRef.current;

    // Magnetic effect
    const bound = 0.15;
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

    // Scroll trigger entrance
    gsap.from(el, {
      scrollTrigger: {
        trigger: el,
        start: 'top 90%',
      },
      y: 80,
      opacity: 0,
      duration: 1.1,
      delay: delay,
      ease: 'elastic.out(1, 0.6)'
    });

    return () => {
      el.removeEventListener('mousemove', onMouseMove);
      el.removeEventListener('mouseleave', onMouseLeave);
    };
  }, { scope: cardRef, dependencies: [delay] });

  return (
    <div 
      ref={cardRef} 
      className={`b-card magnetic ${onClick ? 'cursor-pointer' : ''} ${className}`}
      tabIndex={onClick ? 0 : undefined}
      onClick={onClick}
    >
      {children}
    </div>
  );
}
