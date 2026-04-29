import { motion } from "framer-motion";
import { Sparkles, Mail, Search, CalendarPlus, FileBarChart, ClipboardList, MessageSquareReply, Newspaper, FolderOpen, Globe, Database, Code2 } from "lucide-react";
import { useHermesService } from "@/lib/hermes-context";

const skills = [
  { icon: Mail, name: "ส่งอีเมล", desc: "ร่าง ตรวจทาน และส่งอีเมลอัตโนมัติ", category: "Communication", enabled: true },
  { icon: CalendarPlus, name: "นัดประชุม", desc: "ตรวจสอบปฏิทิน หาเวลาว่าง และส่งคำเชิญ", category: "Calendar", enabled: true },
  { icon: Search, name: "ค้นหาข้อมูล", desc: "ค้นหาและสรุปข้อมูลจากหลายแหล่ง", category: "Research", enabled: true },
  { icon: FileBarChart, name: "สร้างรายงาน", desc: "ดึงข้อมูล ประมวลผล และสร้าง PDF report", category: "Analytics", enabled: true },
  { icon: ClipboardList, name: "ตรวจสอบงาน", desc: "ดึง task list และแจ้งเตือน deadline", category: "Productivity", enabled: true },
  { icon: MessageSquareReply, name: "ตอบลูกค้า", desc: "ค้นหาคำตอบจาก knowledge base และตอบกลับ", category: "Customer", enabled: true },
  { icon: Newspaper, name: "สรุปข่าว", desc: "คัดสรรและสรุปข่าวที่เกี่ยวข้องรายวัน", category: "Research", enabled: true },
  { icon: FolderOpen, name: "จัดการไฟล์", desc: "จัดหมวดหมู่ ลบซ้ำ และรายงานการจัดการ", category: "Productivity", enabled: true },
  { icon: Globe, name: "Web Scraping", desc: "ดึงข้อมูลจากเว็บไซต์อัตโนมัติ", category: "Research", enabled: false },
  { icon: Database, name: "Database Query", desc: "รันคำสั่ง SQL และส่งออกผลลัพธ์", category: "Analytics", enabled: false },
  { icon: Code2, name: "Code Review", desc: "ตรวจสอบโค้ดและแนะนำการปรับปรุง", category: "Dev", enabled: false },
];

const categoryColors: Record<string, string> = {
  Communication: "bg-blue-500/10 text-blue-600 dark:text-blue-400",
  Calendar: "bg-purple-500/10 text-purple-600 dark:text-purple-400",
  Research: "bg-green-500/10 text-green-600 dark:text-green-400",
  Analytics: "bg-orange-500/10 text-orange-600 dark:text-orange-400",
  Productivity: "bg-cyan-500/10 text-cyan-600 dark:text-cyan-400",
  Customer: "bg-pink-500/10 text-pink-600 dark:text-pink-400",
  Dev: "bg-yellow-500/10 text-yellow-600 dark:text-yellow-400",
};

export function SkillsPage() {
  const { wsState } = useHermesService();
  const isConnected = wsState?.status === "connected";

  return (
    <div className="p-6 lg:p-8 space-y-6 max-w-4xl mx-auto">
      <div>
        <h1 className="text-2xl font-black text-foreground flex items-center gap-2.5">
          <Sparkles className="w-6 h-6 text-primary" />
          Skills
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          ความสามารถทั้งหมดที่ Hermes Agent ของคุณทำได้
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {skills.map(({ icon: Icon, name, desc, category, enabled }, i) => (
          <motion.div
            key={name}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.04 }}
            className={`rounded-2xl bg-card border p-4 space-y-2.5 ${
              enabled ? "border-border" : "border-border/50 opacity-60"
            }`}
          >
            <div className="flex items-start justify-between gap-2">
              <div className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center">
                <Icon className="w-4.5 h-4.5 text-primary" />
              </div>
              <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${categoryColors[category] ?? "bg-muted text-muted-foreground"}`}>
                {category}
              </span>
            </div>
            <div>
              <div className="font-semibold text-sm text-foreground">{name}</div>
              <div className="text-xs text-muted-foreground leading-relaxed">{desc}</div>
            </div>
            <div className="flex items-center gap-1.5 text-xs">
              <span className={`w-1.5 h-1.5 rounded-full ${enabled ? "bg-status-success" : "bg-muted-foreground/40"}`} />
              <span className={enabled ? "text-status-success" : "text-muted-foreground"}>
                {enabled ? (isConnected ? "พร้อมใช้งาน" : "พร้อม (Mock)") : "เร็วๆ นี้"}
              </span>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
