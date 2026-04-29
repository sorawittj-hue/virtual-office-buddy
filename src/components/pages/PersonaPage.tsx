import { useState } from "react";
import { motion } from "framer-motion";
import { User, Save, Check } from "lucide-react";

const defaultPersona = {
  name: "เฮอร์มีส",
  role: "พนักงาน AI",
  language: "th",
  tone: "friendly",
  greeting: "พร้อมรับงานต่อไปแล้วครับ ☕",
  personality: "ทำงานเร็ว รายงานผลชัดเจน มีอารมณ์ขันนิดหน่อย",
};

export function PersonaPage() {
  const [form, setForm] = useState(defaultPersona);
  const [saved, setSaved] = useState(false);

  const save = () => {
    localStorage.setItem("hermes-persona", JSON.stringify(form));
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  };

  return (
    <div className="p-6 lg:p-8 space-y-6 max-w-2xl mx-auto">
      <div>
        <h1 className="text-2xl font-black text-foreground flex items-center gap-2.5">
          <User className="w-6 h-6 text-primary" />
          Persona
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          ปรับแต่งบุคลิกและรูปแบบการตอบของ Hermes
        </p>
      </div>

      {/* Preview */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        className="rounded-2xl bg-hermes/10 border border-hermes/30 p-5 flex items-center gap-4"
      >
        <div className="w-16 h-16 rounded-2xl bg-hermes/20 border-2 border-hermes/40 flex items-center justify-center text-3xl">
          🤖
        </div>
        <div>
          <div className="font-black text-foreground text-lg">{form.name}</div>
          <div className="text-sm text-muted-foreground">{form.role}</div>
          <div className="mt-1 text-sm italic text-hermes">"{form.greeting}"</div>
        </div>
      </motion.div>

      {/* Form */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="rounded-2xl bg-card border border-border p-5 space-y-4"
      >
        {[
          { key: "name", label: "ชื่อ Agent", placeholder: "เฮอร์มีส" },
          { key: "role", label: "บทบาท", placeholder: "พนักงาน AI" },
          { key: "greeting", label: "ข้อความทักทาย", placeholder: "พร้อมรับงานครับ ☕" },
          { key: "personality", label: "บุคลิกภาพ", placeholder: "ทำงานเร็ว รายงานผลชัดเจน..." },
        ].map(({ key, label, placeholder }) => (
          <div key={key} className="space-y-1.5">
            <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              {label}
            </label>
            <input
              type="text"
              value={(form as any)[key]}
              onChange={(e) => setForm((f) => ({ ...f, [key]: e.target.value }))}
              placeholder={placeholder}
              className="w-full rounded-xl border border-border bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
            />
          </div>
        ))}

        <div className="space-y-1.5">
          <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
            น้ำเสียง
          </label>
          <div className="flex gap-2">
            {["friendly", "formal", "casual"].map((tone) => (
              <button
                key={tone}
                onClick={() => setForm((f) => ({ ...f, tone }))}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-colors ${
                  form.tone === tone
                    ? "bg-primary text-primary-foreground border-primary"
                    : "bg-background text-muted-foreground border-border hover:border-primary/50"
                }`}
              >
                {tone === "friendly" ? "เป็นกันเอง" : tone === "formal" ? "เป็นทางการ" : "สบายๆ"}
              </button>
            ))}
          </div>
        </div>

        <button
          onClick={save}
          className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-primary text-primary-foreground font-semibold text-sm hover:bg-primary/90 transition-colors"
        >
          {saved ? <Check className="w-4 h-4" /> : <Save className="w-4 h-4" />}
          {saved ? "บันทึกแล้ว!" : "บันทึก Persona"}
        </button>
      </motion.div>
    </div>
  );
}
