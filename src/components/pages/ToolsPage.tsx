import { useState } from "react";
import { motion } from "framer-motion";
import { Wrench, Mail, Calendar, Search, FileText, MessageSquare, Globe, Database, GitBranch } from "lucide-react";

const tools = [
  { icon: Mail, name: "SMTP / Email", desc: "ส่งและรับอีเมลผ่าน SMTP/IMAP", enabled: true, config: "smtp.example.com:587" },
  { icon: Calendar, name: "Google Calendar", desc: "ดู/สร้าง/แก้ไข event ในปฏิทิน", enabled: true, config: "OAuth 2.0 Connected" },
  { icon: Search, name: "Web Search", desc: "ค้นหาข้อมูลบนอินเทอร์เน็ต", enabled: true, config: "Brave Search API" },
  { icon: FileText, name: "Google Drive", desc: "อ่าน/เขียน/อัปโหลดไฟล์ใน Drive", enabled: false, config: "ยังไม่ได้ตั้งค่า" },
  { icon: MessageSquare, name: "Telegram Bot", desc: "รับคำสั่งและส่งผลลัพธ์กลับ Telegram", enabled: true, config: "Bot: @HermesAgentBot" },
  { icon: Globe, name: "HTTP Client", desc: "เรียก external API ใดก็ได้", enabled: true, config: "Unlimited" },
  { icon: Database, name: "PostgreSQL", desc: "เชื่อมต่อและ query ฐานข้อมูล", enabled: false, config: "ยังไม่ได้ตั้งค่า" },
  { icon: GitBranch, name: "GitHub", desc: "อ่าน repo สร้าง PR และ comment", enabled: false, config: "ยังไม่ได้ตั้งค่า" },
];

export function ToolsPage() {
  const [states, setStates] = useState<Record<string, boolean>>(
    Object.fromEntries(tools.map((t) => [t.name, t.enabled]))
  );

  const toggle = (name: string) =>
    setStates((s) => ({ ...s, [name]: !s[name] }));

  return (
    <div className="p-6 lg:p-8 space-y-6 max-w-3xl mx-auto">
      <div>
        <h1 className="text-2xl font-black text-foreground flex items-center gap-2.5">
          <Wrench className="w-6 h-6 text-primary" />
          Tools
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          เครื่องมือและการเชื่อมต่อที่ Hermes ใช้ทำงาน
        </p>
      </div>

      <div className="space-y-2">
        {tools.map(({ icon: Icon, name, desc, config }, i) => {
          const on = states[name];
          return (
            <motion.div
              key={name}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.04 }}
              className="flex items-center gap-4 rounded-2xl bg-card border border-border px-4 py-3"
            >
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${on ? "bg-primary/10" : "bg-muted"}`}>
                <Icon className={`w-5 h-5 ${on ? "text-primary" : "text-muted-foreground"}`} />
              </div>
              <div className="flex-1 min-w-0">
                <div className="font-semibold text-sm text-foreground">{name}</div>
                <div className="text-xs text-muted-foreground">{desc}</div>
                <div className={`text-[10px] mt-0.5 font-mono ${on ? "text-status-success" : "text-muted-foreground/50"}`}>
                  {config}
                </div>
              </div>
              {/* Toggle */}
              <button
                onClick={() => toggle(name)}
                className={`relative w-10 h-5.5 rounded-full transition-colors shrink-0 ${on ? "bg-primary" : "bg-muted-foreground/30"}`}
                style={{ height: "22px" }}
              >
                <span
                  className={`absolute top-0.5 w-4.5 h-4.5 rounded-full bg-white shadow transition-all ${on ? "left-[22px]" : "left-0.5"}`}
                  style={{ width: "18px", height: "18px", left: on ? "20px" : "2px" }}
                />
              </button>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
