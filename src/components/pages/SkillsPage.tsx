import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
  Sparkles,
  Mail,
  Search,
  CalendarPlus,
  FileBarChart,
  ClipboardList,
  MessageSquareReply,
  Newspaper,
  FolderOpen,
  Globe,
  Database,
  Code2,
  Terminal,
  Mic,
  Image,
  Zap,
  FileText,
  GitBranch,
  MessageCircle,
  ShoppingCart,
  Clock,
} from "lucide-react";
import { useHermesService } from "@/lib/hermes-context";
import { toast } from "sonner";
import { useNavigate } from "@tanstack/react-router";

// ─── Toolset definitions ──────────────────────────────────────────────────────
const ALL_SKILLS = [
  // Active by default
  {
    id: "email",
    icon: Mail,
    name: "ส่งอีเมล",
    desc: "ร่าง ตรวจทาน และส่งอีเมลอัตโนมัติผ่าน SMTP / Gmail",
    category: "Communication",
    defaultEnabled: true,
    tryPrompt: "ส่งอีเมลทดสอบถึงตัวเอง",
  },
  {
    id: "calendar",
    icon: CalendarPlus,
    name: "นัดประชุม",
    desc: "ตรวจสอบปฏิทิน หาเวลาว่าง สร้าง iCal และส่งคำเชิญ",
    category: "Calendar",
    defaultEnabled: true,
    tryPrompt: "นัดประชุมวันพรุ่งนี้เวลา 10:00",
  },
  {
    id: "websearch",
    icon: Search,
    name: "ค้นหาเว็บ",
    desc: "ค้นหาด้วย DuckDuckGo / SerpAPI และสรุปผลลัพธ์",
    category: "Research",
    defaultEnabled: true,
    tryPrompt: "ค้นหาข่าวล่าสุดเกี่ยวกับ AI",
  },
  {
    id: "report",
    icon: FileBarChart,
    name: "สร้างรายงาน",
    desc: "ดึงข้อมูล ประมวลผล และสร้าง PDF / Markdown report",
    category: "Analytics",
    defaultEnabled: true,
    tryPrompt: "สร้างรายงานสรุปงานประจำสัปดาห์",
  },
  {
    id: "tasks",
    icon: ClipboardList,
    name: "ตรวจสอบงาน",
    desc: "ดึง task list จาก Notion / Jira และแจ้งเตือน deadline",
    category: "Productivity",
    defaultEnabled: true,
    tryPrompt: "แสดง task ที่ยังไม่เสร็จของฉัน",
  },
  {
    id: "reply",
    icon: MessageSquareReply,
    name: "ตอบลูกค้า",
    desc: "ค้นหาคำตอบจาก knowledge base แล้วตอบกลับอัตโนมัติ",
    category: "Customer",
    defaultEnabled: true,
    tryPrompt: "ตอบคำถามลูกค้าเกี่ยวกับสินค้า",
  },
  {
    id: "news",
    icon: Newspaper,
    name: "สรุปข่าว",
    desc: "คัดสรรข่าว RSS จากหลายแหล่ง สรุปเป็น digest รายวัน",
    category: "Research",
    defaultEnabled: true,
    tryPrompt: "สรุปข่าวเทคโนโลยีวันนี้",
  },
  {
    id: "files",
    icon: FolderOpen,
    name: "จัดการไฟล์",
    desc: "จัดหมวดหมู่ ลบไฟล์ซ้ำ rename และสร้างรายงานการจัดการ",
    category: "Productivity",
    defaultEnabled: true,
    tryPrompt: "จัดระเบียบโฟลเดอร์ Downloads",
  },
  {
    id: "terminal",
    icon: Terminal,
    name: "รัน Terminal",
    desc: "รันคำสั่ง shell, script, และ CLI tools ได้ปลอดภัย",
    category: "Dev",
    defaultEnabled: true,
    tryPrompt: "รัน ls -la แล้วสรุปผล",
  },
  {
    id: "codeexec",
    icon: Code2,
    name: "รันโค้ด",
    desc: "รัน Python / JS sandbox — คำนวณ วิเคราะห์ข้อมูล ทดสอบ",
    category: "Dev",
    defaultEnabled: true,
    tryPrompt: "คำนวณ fibonacci(20) ด้วย Python",
  },
  {
    id: "tts",
    icon: Mic,
    name: "Text-to-Speech",
    desc: "แปลงข้อความเป็นเสียงด้วย ElevenLabs / OpenAI TTS",
    category: "Media",
    defaultEnabled: false,
    tryPrompt: "แปลง 'สวัสดีครับ' เป็นเสียง",
  },
  {
    id: "imagegen",
    icon: Image,
    name: "สร้างภาพ",
    desc: "สร้างภาพด้วย DALL·E 3, Stable Diffusion, หรือ Flux",
    category: "Media",
    defaultEnabled: false,
    tryPrompt: "สร้างภาพ: แมวอวกาศในจักรวาล",
  },
  {
    id: "scraping",
    icon: Globe,
    name: "Web Scraping",
    desc: "ดึงข้อมูลจากเว็บไซต์ด้วย Playwright / Cheerio",
    category: "Research",
    defaultEnabled: false,
    tryPrompt: "ดึงข้อมูลราคาจากเว็บ e-commerce",
  },
  {
    id: "database",
    icon: Database,
    name: "Database Query",
    desc: "รัน SQL ต่อ PostgreSQL / SQLite และส่งออกผลลัพธ์",
    category: "Analytics",
    defaultEnabled: false,
    tryPrompt: "นับจำนวน users ในฐานข้อมูล",
  },
  {
    id: "codereview",
    icon: GitBranch,
    name: "Code Review",
    desc: "ตรวจสอบโค้ด หา bug แนะนำ refactoring และ security issue",
    category: "Dev",
    defaultEnabled: false,
    tryPrompt: "review โค้ด Python function นี้",
  },
  {
    id: "summarize",
    icon: FileText,
    name: "สรุปเอกสาร",
    desc: "อ่านและสรุป PDF, Word, เว็บ URL ให้เข้าใจง่าย",
    category: "Research",
    defaultEnabled: false,
    tryPrompt: "สรุปเอกสาร PDF นี้ให้ฉัน",
  },
  {
    id: "reminder",
    icon: Clock,
    name: "ตั้งเตือน",
    desc: "ตั้ง reminder ผ่าน Telegram / Discord ในเวลาที่กำหนด",
    category: "Productivity",
    defaultEnabled: false,
    tryPrompt: "เตือนฉัน 30 นาทีก่อนประชุม",
  },
  {
    id: "ecommerce",
    icon: ShoppingCart,
    name: "E-commerce",
    desc: "เชื่อมต่อ Shopify / WooCommerce จัดการ order และสต็อก",
    category: "Customer",
    defaultEnabled: false,
    tryPrompt: "แสดง order ล่าสุด 5 รายการ",
  },
  {
    id: "chat_history",
    icon: MessageCircle,
    name: "Chat History",
    desc: "ค้นหาและสรุปประวัติการสนทนาจาก session ก่อนหน้า",
    category: "Memory",
    defaultEnabled: false,
    tryPrompt: "สรุปสิ่งที่คุยกันเมื่อสัปดาห์ที่แล้ว",
  },
  {
    id: "automation",
    icon: Zap,
    name: "Automation Trigger",
    desc: "ทริกเกอร์ webhook และ automation workflow ไปยัง Zapier / n8n",
    category: "Productivity",
    defaultEnabled: false,
    tryPrompt: "ส่ง webhook ไปยัง Zapier",
  },
];

const categoryColors: Record<string, string> = {
  Communication: "bg-blue-500/10 text-blue-400",
  Calendar: "bg-purple-500/10 text-purple-400",
  Research: "bg-green-500/10 text-green-400",
  Analytics: "bg-orange-500/10 text-orange-400",
  Productivity: "bg-cyan-500/10 text-cyan-400",
  Customer: "bg-pink-500/10 text-pink-400",
  Dev: "bg-yellow-500/10 text-yellow-400",
  Media: "bg-rose-500/10 text-rose-400",
  Memory: "bg-indigo-500/10 text-indigo-400",
};

const ALL_CATEGORIES = ["ทั้งหมด", ...Array.from(new Set(ALL_SKILLS.map((s) => s.category)))];

const STORAGE_KEY = "hermes-skills-enabled";

function loadEnabled(): Record<string, boolean> {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return JSON.parse(raw);
  } catch {
    /* ignore */
  }
  return Object.fromEntries(ALL_SKILLS.map((s) => [s.id, s.defaultEnabled]));
}

// ─── Main component ───────────────────────────────────────────────────────────
export function SkillsPage() {
  const { wsState } = useHermesService();
  const navigate = useNavigate();
  const isConnected = wsState?.status === "connected";
  const [enabled, setEnabled] = useState<Record<string, boolean>>(loadEnabled);
  const [filterCat, setFilterCat] = useState("ทั้งหมด");
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(enabled));
    } catch {
      /* ignore */
    }
  }, [enabled]);

  const toggle = (id: string) => {
    setEnabled((prev) => {
      const next = { ...prev, [id]: !prev[id] };
      toast.success(next[id] ? "เปิดใช้งานแล้ว" : "ปิดใช้งานแล้ว");
      return next;
    });
  };

  const tryInChat = (prompt: string) => {
    localStorage.setItem("hermes-chat-prefill", prompt);
    navigate({ to: "/chat" });
    toast.success("เปิด Chat พร้อมคำสั่งตัวอย่างแล้ว");
  };

  const filtered = ALL_SKILLS.filter((s) => {
    const matchCat = filterCat === "ทั้งหมด" || s.category === filterCat;
    const matchSearch =
      !searchQuery.trim() ||
      s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.desc.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.category.toLowerCase().includes(searchQuery.toLowerCase());
    return matchCat && matchSearch;
  });

  const enabledCount = Object.values(enabled).filter(Boolean).length;

  return (
    <div className="p-6 lg:p-8 space-y-6 max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-foreground flex items-center gap-2.5">
            <Sparkles className="w-6 h-6 text-primary" />
            Skills & Tools
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            {enabledCount} / {ALL_SKILLS.length} skills เปิดใช้งาน — ความสามารถทั้งหมดของ Hermes
            Agent
          </p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <span
            className={`text-xs px-2.5 py-1.5 rounded-lg font-semibold ${
              isConnected
                ? "bg-status-success/10 text-status-success"
                : "bg-muted text-muted-foreground"
            }`}
          >
            {isConnected ? "⚡ Live" : "Mock Mode"}
          </span>
        </div>
      </div>

      {/* Search + filter */}
      <div className="flex flex-col sm:flex-row gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
          <input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="ค้นหา skill…"
            className="w-full pl-9 pr-3 py-2 rounded-xl border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring"
          />
        </div>
        <div className="flex gap-1.5 flex-wrap">
          {ALL_CATEGORIES.map((cat) => (
            <button
              key={cat}
              onClick={() => setFilterCat(cat)}
              className={`px-2.5 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                filterCat === cat
                  ? "bg-primary text-primary-foreground"
                  : "bg-muted text-muted-foreground hover:text-foreground"
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Skills grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
        {filtered.map(({ id, icon: Icon, name, desc, category, tryPrompt }, i) => {
          const isEnabled = enabled[id] ?? false;
          return (
            <motion.div
              key={id}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.03 }}
              className={`rounded-2xl bg-card border p-4 space-y-3 transition-all ${
                isEnabled ? "border-border" : "border-border/40 opacity-60"
              }`}
            >
              {/* Top row */}
              <div className="flex items-start justify-between gap-2">
                <div
                  className={`w-9 h-9 rounded-xl flex items-center justify-center ${isEnabled ? "bg-primary/10" : "bg-muted"}`}
                >
                  <Icon
                    className={`w-4.5 h-4.5 ${isEnabled ? "text-primary" : "text-muted-foreground"}`}
                  />
                </div>
                {/* Toggle switch */}
                <button
                  onClick={() => toggle(id)}
                  className={`relative w-9 h-5 rounded-full transition-colors shrink-0 mt-0.5 ${
                    isEnabled ? "bg-primary" : "bg-muted-foreground/30"
                  }`}
                  title={isEnabled ? "ปิดใช้งาน" : "เปิดใช้งาน"}
                >
                  <span
                    className={`absolute top-0.5 left-0.5 w-4 h-4 rounded-full bg-white shadow transition-transform ${
                      isEnabled ? "translate-x-4" : "translate-x-0"
                    }`}
                  />
                </button>
              </div>

              {/* Info */}
              <div>
                <div className="font-semibold text-sm text-foreground leading-tight">{name}</div>
                <div className="text-xs text-muted-foreground leading-relaxed mt-1">{desc}</div>
              </div>

              {/* Footer */}
              <div className="flex items-center justify-between gap-2">
                <span
                  className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${categoryColors[category] ?? "bg-muted text-muted-foreground"}`}
                >
                  {category}
                </span>
                {isEnabled && (
                  <button
                    onClick={() => tryInChat(tryPrompt)}
                    className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-primary/10 text-primary hover:bg-primary/20 transition-colors"
                  >
                    ลองใช้ →
                  </button>
                )}
              </div>
            </motion.div>
          );
        })}
      </div>

      {filtered.length === 0 && (
        <div className="text-center py-12 text-muted-foreground text-sm">ไม่พบ skill ที่ค้นหา</div>
      )}
    </div>
  );
}
