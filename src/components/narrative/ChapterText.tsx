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
      className="p-2 h-full cursor-pointer"
      onMouseEnter={onHover}
      onClick={onHover}
    >
      <motion.div
        animate={{ 
          opacity: isActive ? 1 : 0.6,
          scale: isActive ? 1 : 0.95,
        }}
        transition={{ duration: 0.3 }}
        className={`h-[220px] bg-paper p-6 flex flex-col justify-start transition-all duration-300 ${isActive ? 'border-[3px] border-ink shadow-[6px_6px_0_var(--volt)] -translate-y-1 -translate-x-1' : 'border-[3px] border-ink/40'}`}
      >
        <h2 className="text-xl font-heading font-bold text-ink mb-3 line-clamp-1 uppercase">
          {title}
        </h2>
        <p className="text-sm font-medium leading-relaxed line-clamp-4 opacity-80">
          {text}
        </p>
      </motion.div>
    </div>
  );
}
