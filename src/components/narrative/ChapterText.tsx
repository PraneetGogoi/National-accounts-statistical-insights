import { motion } from "framer-motion";

interface ChapterTextProps {
  id: number;
  title: string;
  text: string;
  isActive: boolean;
  onHover: () => void;
}

export function ChapterText({ id, title, text, isActive, onHover }: ChapterTextProps) {
  // Hide the last chapter since it's just a transition chapter from the old scrolly logic
  if (id === 6) return null;

  return (
    <div 
      className="p-2 h-full cursor-pointer"
      onMouseEnter={onHover}
      onClick={onHover}
    >
      <motion.div
        animate={{ 
          opacity: isActive ? 1 : 0.4,
          scale: isActive ? 1 : 0.95,
          borderColor: isActive ? "hsl(var(--primary))" : "hsl(var(--border))"
        }}
        transition={{ duration: 0.3 }}
        className="h-[220px] bg-background/90 backdrop-blur-xl p-6 rounded-2xl shadow-xl border-2 flex flex-col justify-start"
      >
        <h2 className="text-xl font-heading font-bold text-foreground mb-3 line-clamp-1">
          {title}
        </h2>
        <p className="text-sm text-muted-foreground font-body leading-relaxed line-clamp-4">
          {text}
        </p>
      </motion.div>
    </div>
  );
}
