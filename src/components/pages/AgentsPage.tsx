import { motion } from "framer-motion";
import { Users, Circle, Loader2, CheckCircle2 } from "lucide-react";
import { useHermes } from "@/hooks/use-hermes";
import { useHermesService } from "@/lib/hermes-context";

const agents = [
  {
    id: "hermes",
    name: "Hermes",
    role: "Orchestrator",
    description: "Agent หลักที่รับคำสั่งจากเจ้านายและประสานงานทุกอย่าง",
    avatar: "🤖",
    color: "bg-hermes/20 border-hermes/40",
  },
  {
    id: "agent2",
    name: "Agent 2",
    role: "Assistant",
    description: "Agent ช่วยเหลือสำหรับงานทั่วไปและการค้นหาข้อมูล",
    avatar: "🦾",
    color: "bg-primary/20 border-primary/40",
  },
  {
    id: "mailbot",
    name: "MailBot",
    role: "Email Specialist",
    description: "ดูแลการส่ง/รับอีเมล ร่างเนื้อหา และจัดการ inbox",
    avatar: "📬",
    color: "bg-accent/20 border-accent/40",
  },
];

export function AgentsPage() {
  const { status } = useHermes();
  const { wsState } = useHermesService();
  const isConnected = wsState?.status === "connected";

  return (
    <div className="p-6 lg:p-8 space-y-6 max-w-3xl mx-auto">
      <div>
        <h1 className="text-2xl font-black text-foreground flex items-center gap-2.5">
          <Users className="w-6 h-6 text-primary" />
          Agents
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          รายชื่อ AI agents ทั้งหมดในระบบของคุณ
        </p>
      </div>

      <div className="grid gap-3">
        {agents.map((agent, i) => {
          const isMain = agent.id === "hermes";
          const agentStatus = isMain ? status : "idle";
          return (
            <motion.div
              key={agent.id}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.06 }}
              className="rounded-2xl bg-card border border-border p-4 flex items-center gap-4"
            >
              <div
                className={`w-12 h-12 rounded-2xl border-2 flex items-center justify-center text-2xl shrink-0 ${agent.color}`}
              >
                {agent.avatar}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="font-bold text-foreground">{agent.name}</span>
                  <span className="text-xs text-muted-foreground px-2 py-0.5 rounded-full bg-muted">
                    {agent.role}
                  </span>
                </div>
                <p className="text-sm text-muted-foreground mt-0.5 truncate">{agent.description}</p>
              </div>
              <div className="shrink-0 flex items-center gap-1.5 text-xs">
                {agentStatus === "working" ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 text-status-working animate-spin" />
                    <span className="text-status-working font-medium">ทำงาน</span>
                  </>
                ) : agentStatus === "success" ? (
                  <>
                    <CheckCircle2 className="w-3.5 h-3.5 text-status-success" />
                    <span className="text-status-success font-medium">เสร็จแล้ว</span>
                  </>
                ) : (
                  <>
                    <Circle className="w-3.5 h-3.5 text-status-success fill-status-success" />
                    <span className="text-muted-foreground">{isConnected || !isMain ? "Online" : "Mock"}</span>
                  </>
                )}
              </div>
            </motion.div>
          );
        })}
      </div>

      <p className="text-xs text-muted-foreground text-center italic">
        เชื่อมต่อ Hermes backend จริงผ่าน <a href="/gateway" className="text-primary hover:underline">Gateway</a> เพื่อดูสถานะ agent แบบ real-time
      </p>
    </div>
  );
}
