import { ReactNode, useRef, useState, useEffect } from "react";
import { NavLink } from "react-router-dom";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";
import { useTheme } from "./ThemeProvider";
import { Sun, Moon } from "lucide-react";
import { GlobalGooField } from "./ui/brutal/GlobalGooField";

gsap.registerPlugin(useGSAP);

const CHARS = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789@#$%&*";
const WORDS = ["LEDGER", "DATA", "INSIGHTS", "RECORDS", "MACRO"];

function DynamicLogo() {
  const [wordIndex, setWordIndex] = useState(0);
  const [text, setText] = useState(WORDS[0]);
  const [isHovering, setIsHovering] = useState(false);

  // Scramble animation effect whenever wordIndex changes or hover state changes
  useEffect(() => {
    let targetWord = WORDS[wordIndex];
    if (isHovering) {
      targetWord = "SYSTEM";
    }
    
    let iterations = 0;
    
    const interval = setInterval(() => {
      setText(prev => {
        // Handle varying lengths by padding or truncating during animation
        const maxLength = Math.max(prev.length, targetWord.length);
        const result = [];
        
        for (let i = 0; i < maxLength; i++) {
          if (i < iterations) {
            result.push(targetWord[i] || "");
          } else {
            result.push(CHARS[Math.floor(Math.random() * CHARS.length)]);
          }
        }
        return result.join("");
      });
      
      iterations += 1/2; // Speed of decoding
      if (iterations >= Math.max(text.length, targetWord.length)) {
        clearInterval(interval);
        setText(targetWord);
      }
    }, 40);
    
    return () => clearInterval(interval);
  }, [wordIndex, isHovering]);

  // Continuous loop to change words every 4 seconds
  useEffect(() => {
    if (isHovering) return;
    
    const cycle = setInterval(() => {
      setWordIndex(prev => (prev + 1) % WORDS.length);
    }, 3500);
    
    return () => clearInterval(cycle);
  }, [isHovering]);

  return (
    <NavLink 
      to="/" 
      className="flex items-center min-w-[180px]"
      onMouseEnter={() => setIsHovering(true)}
      onMouseLeave={() => setIsHovering(false)}
    >
      NAS<span className="text-volt mx-[2px] animate-pulse">/</span>{text}
    </NavLink>
  );
}

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
      {/* <GlobalGooField /> */}
      <div 
        ref={mastheadRef}
        className="fixed top-0 left-0 right-0 z-50 flex justify-between items-center px-6 py-4 border-b-[3px] border-ink bg-paper"
      >
        <div className="font-heading font-bold text-2xl tracking-tighter magnetic inline-block cursor-pointer">
          <DynamicLogo />
        </div>
        <nav className="flex gap-3 items-center">
          <NavLink to="/narrative" className="pill magnetic">001 / NARRATIVE</NavLink>
          <NavLink to="/dashboard" className="pill magnetic">002 / DASHBOARD</NavLink>
          <NavLink to="/sectors" className="pill magnetic">003 / SECTORAL</NavLink>
          <NavLink to="/gdp" className="pill magnetic">004 / SEASONALITY</NavLink>
          <button onClick={toggleTheme} className="pill magnetic !px-3" aria-label="Toggle theme">
            {theme === "dark" ? <Sun size={18} /> : <Moon size={18} />}
          </button>
        </nav>
      </div>

      <main className="w-full relative pt-20">
        {children}
      </main>
      
      <footer className="font-numbers text-sm flex justify-between px-6 py-8 mt-20 opacity-70 relative chibi-footer">
        <span>NAS INDIA — NATIONAL ACCOUNTS STATISTICS</span>
        <span></span>
      </footer>
    </div>
  );
}
