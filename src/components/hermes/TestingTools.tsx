import { motion } from "framer-motion";
import { Mail, Search, CalendarPlus, FileBarChart, FlaskConical } from "lucide-react";

interface TestingToolsProps {
  onSimulate: (command: string) => void;
  disabled?: boolean;
}

const tools = [
  { command: "ส่งอีเมล", icon: Mail },
  { command: "ค้นหาข้อมูล", icon: Search },
  { command: "นัดประชุม", icon: CalendarPlus },
  { command: "สร้างรายงาน", icon: FileBarChart },
];

export function TestingTools({ onSimulate, disabled }: TestingToolsProps) {
  return (
    <motion.div
      initial={{ y: 30, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ delay: 0.3, type: "spring", stiffness: 200, damping: 22 }}
      className="rounded-2xl bg-card border border-border shadow-pop p-3"
    >
      <div className="flex items-center gap-2 px-2 pb-2 border-b border-border mb-2">
        <FlaskConical className="w-4 h-4 text-accent" />
        <span className="text-xs font-bold uppercase tracking-wider text-card-foreground">
          เครื่องมือทดสอบ
        </span>
        <span className="ml-auto text-[10px] text-muted-foreground">
          จำลอง Webhook จาก Telegram
        </span>
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
        {tools.map(({ command, icon: Icon }) => (
          <motion.button
            key={command}
            whileHover={{ scale: disabled ? 1 : 1.04, y: disabled ? 0 : -2 }}
            whileTap={{ scale: 0.96 }}
            disabled={disabled}
            onClick={() => onSimulate(command)}
            className="group flex flex-col items-center justify-center gap-1.5 rounded-xl border border-border bg-background hover:bg-secondary px-3 py-3 text-xs font-semibold text-card-foreground disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            <Icon className="w-4 h-4 text-primary group-hover:text-accent transition-colors" />
            <span>จำลอง: {command}</span>
          </motion.button>
        ))}
      </div>
    </motion.div>
  );
}
