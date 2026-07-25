import { motion } from "framer-motion";

interface ChapterTextProps {
  id: number;
  title: string;
  text: string;
  isActive: boolean;
  onHover: () => void;
}

export function ChapterText({ id, title, text, isActive, onHover }: ChapterTextProps) {
  if (id === 6) return null;

  return (
    <div 
      className="p-2 h-full cursor-pointer relative"
      onMouseEnter={onHover}
      onClick={onHover}
    >
      {/* Connecting line to the previous card */}
      {id > 0 && (
        <div className={`absolute top-12 -left-1/2 w-full h-[3px] z-0 transition-colors duration-300 ${isActive ? 'bg-ink' : 'bg-ink/20 border-t border-b border-ink/10'}`} />
      )}
      
      <motion.div
        animate={{ 
          opacity: isActive ? 1 : 0.6,
          scale: isActive ? 1 : 0.95,
        }}
        transition={{ duration: 0.3 }}
        className={`relative z-10 min-h-[220px] bg-paper p-6 flex flex-col justify-start transition-all duration-300 ${isActive ? 'border-[3px] border-ink shadow-[6px_6px_0_var(--volt)] -translate-y-1 -translate-x-1' : 'border-[3px] border-ink/40'}`}
      >
        <div className="flex items-center gap-3 mb-4">
          <span className={`font-numbers text-xs font-bold px-2 py-1 shadow-[2px_2px_0_var(--ink)] ${isActive ? 'bg-volt text-ink border-[2px] border-ink' : 'bg-paper text-ink border-[2px] border-ink/40 opacity-70'}`}>
            {String(id + 1).padStart(2, '0')}
          </span>
          <h2 className={`text-xl font-heading font-bold text-ink uppercase m-0 leading-tight transition-all duration-300 ${isActive ? '' : 'line-clamp-1'}`}>
            {title}
          </h2>
        </div>
        <p className={`text-sm font-medium leading-relaxed opacity-80 transition-all duration-300 ${isActive ? '' : 'line-clamp-3'}`}>
          {text}
        </p>
      </motion.div>
    </div>
  );
}
