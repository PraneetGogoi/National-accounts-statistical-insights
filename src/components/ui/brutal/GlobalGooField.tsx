import { useRef } from "react";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";

export function GlobalGooField() {
  const containerRef = useRef<HTMLDivElement>(null);

  useGSAP(() => {
    const field = containerRef.current;
    if (!field) return;

    field.innerHTML = '';
    const blobs: HTMLDivElement[] = [];
    for (let i = 0; i < 4; i++) {
      const b = document.createElement('div');
      // Low opacity to ensure it's a subtle background effect and doesn't hurt performance
      b.className = 'absolute rounded-full bg-volt opacity-5 will-change-transform'; 
      const size = 150 + Math.random() * 200;
      b.style.width = size + 'px';
      b.style.height = size + 'px';
      b.style.left = (10 + Math.random() * 80) + '%';
      b.style.top = (10 + Math.random() * 80) + '%';
      field.appendChild(b);
      blobs.push(b);
      
      gsap.to(b, {
        x: () => gsap.utils.random(-100, 100),
        y: () => gsap.utils.random(-100, 100),
        duration: 8 + Math.random() * 5, // slow
        repeat: -1,
        yoyo: true,
        ease: 'sine.inOut'
      });
    }

    // Drift toward cursor globally
    const onMouseMove = (e: MouseEvent) => {
      const mx = e.clientX, my = e.clientY;
      blobs.forEach((b) => {
        const br = b.getBoundingClientRect();
        const bx = br.left + br.width / 2;
        const by = br.top + br.height / 2;
        const dx = (mx - bx) * 0.02; // very weak pull
        const dy = (my - by) * 0.02;
        gsap.to(b, { x: `+=${dx}`, y: `+=${dy}`, duration: 2, ease: 'power2.out' });
      });
    };
    
    window.addEventListener('mousemove', onMouseMove);
    return () => window.removeEventListener('mousemove', onMouseMove);
  }, { scope: containerRef });

  return (
    <>
      <svg className="hidden">
        <defs>
          <filter id="global-goo">
            <feGaussianBlur in="SourceGraphic" stdDeviation="15" result="blur" />
            <feColorMatrix in="blur" mode="matrix" values="1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 25 -10" result="goo" />
            <feComposite in="SourceGraphic" in2="goo" operator="atop" />
          </filter>
        </defs>
      </svg>
      <div 
        id="globalGooField" 
        ref={containerRef} 
        className="fixed inset-0 pointer-events-none z-[0] overflow-hidden mix-blend-multiply" 
        style={{ filter: 'url(#global-goo)' }}
      />
    </>
  );
}
