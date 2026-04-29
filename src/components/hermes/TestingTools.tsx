import { useState, useRef } from "react";
import { motion } from "framer-motion";
import {
  Mail,
  Search,
  CalendarPlus,
  FileBarChart,
  FlaskConical,
  ClipboardList,
  MessageSquareReply,
  Newspaper,
  FolderOpen,
  Send,
  AlertCircle,
} from "lucide-react";

interface TestingToolsProps {
  onSimulate: (command: string) => void;
  onSimulateError: (command: string) => void;
  disabled?: boolean;
}

const presets = [
  { command: "ส่งอีเมล", icon: Mail },
  { command: "ค้นหาข้อมูล", icon: Search },
  { command: "นัดประชุม", icon: CalendarPlus },
  { command: "สร้างรายงาน", icon: FileBarChart },
  { command: "ตรวจสอบงาน", icon: ClipboardList },
  { command: "ตอบลูกค้า", icon: MessageSquareReply },
  { command: "สรุปข่าว", icon: Newspaper },
  { command: "จัดการไฟล์", icon: FolderOpen },
];

export function TestingTools({ onSimulate, onSimulateError, disabled }: TestingToolsProps) {
  const [customCommand, setCustomCommand] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  const handleCustomSubmit = () => {
    const cmd = customCommand.trim();
    if (!cmd || disabled) return;
    onSimulate(cmd);
    setCustomCommand("");
  };

  return (
    <motion.div
      initial={{ y: 30, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ delay: 0.3, type: "spring", stiffness: 200, damping: 22 }}
      className="rounded-2xl bg-card border border-border shadow-pop p-3 space-y-3"
    >
      {/* Header */}
      <div className="flex items-center gap-2 px-2 pb-2 border-b border-border">
        <FlaskConical className="w-4 h-4 text-accent" />
        <span className="text-xs font-bold uppercase tracking-wider text-card-foreground">
          เครื่องมือทดสอบ
        </span>
        <span className="ml-auto text-[10px] text-muted-foreground">
          จำลอง Webhook จาก Telegram
        </span>
      </div>

      {/* Custom command input */}
      <div className="flex gap-2 px-1">
        <div className="relative flex-1">
          <input
            ref={inputRef}
            type="text"
            value={customCommand}
            onChange={(e) => setCustomCommand(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleCustomSubmit()}
            placeholder="พิมพ์คำสั่งเอง เช่น อัพเดทสต็อกสินค้า"
            disabled={disabled}
            className="w-full rounded-xl border border-border bg-background px-3 py-2 text-xs text-card-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring disabled:opacity-50 disabled:cursor-not-allowed"
          />
        </div>
        <motion.button
          whileHover={{ scale: disabled || !customCommand.trim() ? 1 : 1.04 }}
          whileTap={{ scale: 0.95 }}
          disabled={disabled || !customCommand.trim()}
          onClick={handleCustomSubmit}
          className="flex items-center gap-1.5 rounded-xl bg-primary text-primary-foreground px-3 py-2 text-xs font-semibold shadow-soft disabled:opacity-50 disabled:cursor-not-allowed transition-opacity"
        >
          <Send className="w-3.5 h-3.5" />
          ส่ง
        </motion.button>
      </div>

      {/* Preset buttons */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
        {presets.map(({ command, icon: Icon }) => (
          <motion.button
            key={command}
            whileHover={{ scale: disabled ? 1 : 1.04, y: disabled ? 0 : -2 }}
            whileTap={{ scale: 0.96 }}
            disabled={disabled}
            onClick={() => onSimulate(command)}
            className="group flex flex-col items-center justify-center gap-1.5 rounded-xl border border-border bg-background hover:bg-secondary px-3 py-3 text-xs font-semibold text-card-foreground disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            <Icon className="w-4 h-4 text-primary group-hover:text-accent transition-colors" />
            <span>{command}</span>
          </motion.button>
        ))}
      </div>

      {/* Error simulation */}
      <div className="flex justify-end px-1 pt-1 border-t border-border/60">
        <motion.button
          whileHover={{ scale: disabled ? 1 : 1.04 }}
          whileTap={{ scale: 0.95 }}
          disabled={disabled}
          onClick={() => onSimulateError("ทดสอบ Error")}
          className="flex items-center gap-1.5 rounded-xl border border-destructive/40 bg-destructive/5 hover:bg-destructive/10 px-3 py-1.5 text-[11px] font-semibold text-destructive disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          <AlertCircle className="w-3 h-3" />
          จำลอง Error
        </motion.button>
      </div>
    </motion.div>
  );
}
