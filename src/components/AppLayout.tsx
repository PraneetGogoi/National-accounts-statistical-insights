import { ReactNode, useRef } from "react";
import { NavLink } from "react-router-dom";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";
import { useTheme } from "./ThemeProvider";
import { Sun, Moon } from "lucide-react";
import { GlobalGooField } from "./ui/brutal/GlobalGooField";

gsap.registerPlugin(useGSAP);

export function AppLayout({ children }: { children: ReactNode }) {
  const mastheadRef = useRef<HTMLDivElement>(null);
  const { theme, toggleTheme } = useTheme();

  useGSAP(() => {
    if (!mastheadRef.current) return;
    const magnetics = mastheadRef.current.querySelectorAll('.magnetic');
    
    magnetics.forEach(el => {
      let bound = 0.4;
      el.addEventListener('mousemove', (e: any) => {
        const r = el.getBoundingClientRect();
        const x = (e.clientX - r.left - r.width/2) * bound;
        const y = (e.clientY - r.top - r.height/2) * bound;
        gsap.to(el, { x, y, duration: 0.4, ease: 'power3.out' });
      });
      el.addEventListener('mouseleave', () => {
        gsap.to(el, { x: 0, y: 0, duration: 1.1, ease: 'elastic.out(1, 0.35)' });
      });
    });
  }, { scope: mastheadRef });

  return (
    <div className="min-h-screen bg-paper text-ink font-body overflow-x-hidden relative">
      <GlobalGooField />
      <div 
        ref={mastheadRef}
        className="fixed top-0 left-0 right-0 z-50 flex justify-between items-center px-6 py-4 border-b-[3px] border-ink bg-paper"
      >
        <div className="font-heading font-bold text-2xl tracking-tighter magnetic">
          <NavLink to="/">NAS<span className="text-volt">/</span>LEDGER</NavLink>
        </div>
        <nav className="flex gap-3 items-center">
          <NavLink to="/narrative" className="pill magnetic">001 / NARRATIVE</NavLink>
          <NavLink to="/dashboard" className="pill magnetic">002 / DASHBOARD</NavLink>
          <NavLink to="/sectors" className="pill magnetic">003 / SECTORAL</NavLink>
          <button onClick={toggleTheme} className="pill magnetic !px-3" aria-label="Toggle theme">
            {theme === "dark" ? <Sun size={18} /> : <Moon size={18} />}
          </button>
        </nav>
      </div>

      <main className="w-full relative pt-20">
        {children}
      </main>
      
      <footer className="font-numbers text-sm flex justify-between px-6 py-8 mt-20 opacity-70">
        <span>NAS INDIA — NATIONAL ACCOUNTS STATISTICS</span>
        <span></span>
      </footer>
    </div>
  );
}
