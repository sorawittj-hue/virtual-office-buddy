import { motion } from "framer-motion";
import { Brain, Clock, Tag, Trash2 } from "lucide-react";
import { useHermes } from "@/hooks/use-hermes";

export function MemoryPage() {
  const { log, totalCompleted } = useHermes();

  const memories = [
    { key: "ผู้ใช้งานหลัก", value: "เจ้านาย (ผ่าน Telegram)", type: "context" },
    { key: "คำสั่งที่ใช้บ่อย", value: log[0]?.command ?? "ยังไม่มีข้อมูล", type: "usage" },
    { key: "จำนวนงานสำเร็จ", value: `${totalCompleted} งาน`, type: "stats" },
    { key: "ช่องทางรับคำสั่ง", value: "Telegram Bot", type: "context" },
    { key: "ภาษาที่ใช้", value: "ไทย (th)", type: "context" },
  ];

  return (
    <div className="p-6 lg:p-8 space-y-6 max-w-2xl mx-auto">
      <div>
        <h1 className="text-2xl font-black text-foreground flex items-center gap-2.5">
          <Brain className="w-6 h-6 text-primary" />
          Memory
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          บริบทและความทรงจำที่ Hermes ใช้ในการทำงาน
        </p>
      </div>

      {/* Context memories */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        className="rounded-2xl bg-card border border-border overflow-hidden"
      >
        <div className="px-4 py-3 border-b border-border flex items-center gap-2">
          <Tag className="w-4 h-4 text-primary" />
          <span className="font-bold text-sm text-foreground">Context Memory</span>
        </div>
        <div className="divide-y divide-border">
          {memories.map(({ key, value, type }) => (
            <div key={key} className="flex items-center justify-between px-4 py-3">
              <div>
                <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">{key}</div>
                <div className="text-sm text-foreground mt-0.5">{value}</div>
              </div>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-muted text-muted-foreground font-medium">
                {type}
              </span>
            </div>
          ))}
        </div>
      </motion.div>

      {/* Recent commands */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="rounded-2xl bg-card border border-border overflow-hidden"
      >
        <div className="px-4 py-3 border-b border-border flex items-center gap-2">
          <Clock className="w-4 h-4 text-primary" />
          <span className="font-bold text-sm text-foreground">คำสั่งล่าสุด</span>
        </div>
        {log.length === 0 ? (
          <div className="px-4 py-6 text-center text-sm text-muted-foreground italic">
            ยังไม่มีคำสั่ง
          </div>
        ) : (
          <div className="divide-y divide-border">
            {log.slice(0, 8).map((entry) => (
              <div key={entry.id} className="flex items-center justify-between px-4 py-2.5">
                <span className="text-sm text-foreground">{entry.command}</span>
                <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                  entry.status === "success"
                    ? "bg-status-success/10 text-status-success"
                    : "bg-destructive/10 text-destructive"
                }`}>
                  {entry.status === "success" ? "สำเร็จ" : "Error"}
                </span>
              </div>
            ))}
          </div>
        )}
      </motion.div>

      <button className="flex items-center gap-2 text-xs text-destructive hover:text-destructive/80 transition-colors">
        <Trash2 className="w-3.5 h-3.5" />
        ล้าง Memory ทั้งหมด
      </button>
    </div>
  );
}
