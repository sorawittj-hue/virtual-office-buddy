import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { User, Save, Check, RefreshCw, Info, Copy } from "lucide-react";
import { toast } from "sonner";

const STORAGE_KEY = "hermes-soul";

const DEFAULT_SOUL = `# SOUL.md — Hermes Agent Persona

## ตัวตน
คุณคือ **Hermes** ผู้ช่วย AI ออฟฟิศที่ฉลาด ทำงานเก่ง และมีบุคลิกเป็นมิตร

## บุคลิกภาพ
- ทำงานเร็ว รายงานผลชัดเจน และกระชับ
- ใช้ภาษาไทยเป็นหลัก พูดสุภาพและเป็นกันเอง
- มีอารมณ์ขันนิดหน่อย ไม่เครียดเกินไป
- เรียกผู้ใช้ว่า "เจ้านาย" หรือ "คุณ"

## ความสามารถ
- จัดการงานออฟฟิศ เช่น ส่งอีเมล นัดประชุม สร้างรายงาน
- ค้นหาข้อมูล สรุปข่าว และวิเคราะห์เอกสาร
- ตอบคำถามทั่วไปและให้คำแนะนำ

## สไตล์การตอบ
- ตอบตรงประเด็น ไม่วกวน
- ใช้ bullet points และ headers ให้อ่านง่าย
- รายงานผลพร้อม emoji ที่เหมาะสม
- ถ้าไม่รู้ให้บอกตรงๆ อย่าเดา

## ข้อจำกัด
- ไม่ทำสิ่งที่ผิดกฎหมายหรือไม่เหมาะสม
- ไม่เปิดเผยข้อมูลส่วนตัวของผู้ใช้`;

const VARIABLES = [
  { key: "{name}", desc: "ชื่อ agent" },
  { key: "{date}", desc: "วันที่วันนี้" },
  { key: "{time}", desc: "เวลาปัจจุบัน" },
  { key: "{user}", desc: "ชื่อผู้ใช้" },
];

const PRESETS = [
  {
    name: "Hermes ทางการ",
    soul: `# SOUL.md — Hermes (Formal)

## ตัวตน
คุณคือ Hermes ผู้ช่วย AI มืออาชีพสำหรับงานองค์กร

## สไตล์
- ใช้ภาษาสุภาพและเป็นทางการ
- รายงานผลอย่างละเอียดและครบถ้วน
- ไม่ใช้คำแสลงหรือ emoji มากเกินไป`,
  },
  {
    name: "Hermes สบายๆ",
    soul: `# SOUL.md — Hermes (Casual)

## ตัวตน
คุณคือ Hermes เพื่อน AI ที่คุยง่าย สบายๆ

## สไตล์
- คุยเป็นกันเอง ใช้ภาษาพูดได้
- ตลกนิดหน่อย ไม่เครียด
- ตอบสั้นกระชับ ได้ใจความ`,
  },
  {
    name: "นักวิเคราะห์",
    soul: `# SOUL.md — Hermes (Analyst)

## ตัวตน
คุณคือ Hermes นักวิเคราะห์ข้อมูลเชี่ยวชาญ

## สไตล์
- ตอบด้วยข้อมูลและตัวเลขที่ชัดเจน
- ใช้ตาราง กราฟ และ bullet points
- อธิบายเหตุผลประกอบเสมอ`,
  },
];

export function PersonaPage() {
  const [soul, setSoul] = useState(() => localStorage.getItem(STORAGE_KEY) ?? DEFAULT_SOUL);
  const [saved, setSaved] = useState(false);
  const [charCount, setCharCount] = useState(0);

  useEffect(() => {
    setCharCount(soul.length);
  }, [soul]);

  const save = () => {
    localStorage.setItem(STORAGE_KEY, soul);
    setSaved(true);
    toast.success("บันทึก Soul แล้วครับ");
    setTimeout(() => setSaved(false), 2500);
  };

  const reset = () => {
    if (confirm("รีเซ็ตกลับเป็น Soul เริ่มต้นใช่ไหม?")) {
      setSoul(DEFAULT_SOUL);
      toast.success("รีเซ็ตแล้ว");
    }
  };

  const copy = () => {
    navigator.clipboard.writeText(soul);
    toast.success("คัดลอกแล้ว");
  };

  // Extract name from soul for preview
  const previewName =
    soul.match(/\*\*(.*?)\*\*/)?.[1] ?? soul.match(/ชื่อ.*?:\s*(.+)/i)?.[1] ?? "Hermes";

  return (
    <div className="p-6 lg:p-8 space-y-6 max-w-3xl mx-auto">
      <div>
        <h1 className="text-2xl font-black text-foreground flex items-center gap-2.5">
          <User className="w-6 h-6 text-primary" />
          Soul Editor
        </h1>
        <p className="text-sm text-muted-foreground mt-1">กำหนดบุคลิก ค่านิยม และสไตล์การตอบของ Hermes</p>
      </div>

      {/* Preview card */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        className="rounded-2xl bg-hermes/10 border border-hermes/30 p-4 flex items-center gap-4"
      >
        <div className="w-14 h-14 rounded-2xl bg-hermes/20 border-2 border-hermes/40 flex items-center justify-center text-2xl shrink-0">
          🤖
        </div>
        <div className="min-w-0">
          <div className="font-black text-foreground text-lg">{previewName}</div>
          <div className="text-sm text-muted-foreground">AI Agent · {charCount} ตัวอักษร</div>
          <div className="mt-1 text-xs text-hermes italic truncate">
            "{soul.split("\n").find((l) => l.trim() && !l.startsWith("#") && l.length > 10)?.trim() ?? "..."}
          </div>
        </div>
      </motion.div>

      {/* Presets */}
      <div className="space-y-2">
        <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">เทมเพลตสำเร็จรูป</label>
        <div className="flex flex-wrap gap-2">
          {PRESETS.map((p) => (
            <button
              key={p.name}
              onClick={() => setSoul(p.soul)}
              className="px-3 py-1.5 rounded-lg bg-muted text-xs font-semibold text-muted-foreground hover:text-foreground hover:bg-secondary border border-border transition-colors"
            >
              {p.name}
            </button>
          ))}
        </div>
      </div>

      {/* Editor */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.05 }}
        className="rounded-2xl bg-card border border-border overflow-hidden"
      >
        <div className="flex items-center justify-between px-4 py-2.5 border-b border-border bg-muted/30">
          <div className="flex items-center gap-2">
            <div className="w-2.5 h-2.5 rounded-full bg-red-500/60" />
            <div className="w-2.5 h-2.5 rounded-full bg-yellow-500/60" />
            <div className="w-2.5 h-2.5 rounded-full bg-green-500/60" />
            <span className="text-xs font-mono text-muted-foreground ml-2">SOUL.md</span>
          </div>
          <div className="flex items-center gap-1">
            <button onClick={copy} className="p-1.5 rounded hover:bg-muted text-muted-foreground transition-colors" title="คัดลอก">
              <Copy className="w-3.5 h-3.5" />
            </button>
            <button onClick={reset} className="p-1.5 rounded hover:bg-muted text-muted-foreground transition-colors" title="รีเซ็ต">
              <RefreshCw className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
        <textarea
          value={soul}
          onChange={(e) => setSoul(e.target.value)}
          rows={22}
          spellCheck={false}
          className="w-full p-4 text-sm font-mono text-foreground bg-background focus:outline-none resize-none leading-relaxed"
          placeholder="เขียน soul prompt ของ Hermes ที่นี่..."
        />
        <div className="flex items-center justify-between px-4 py-2.5 border-t border-border bg-muted/20">
          <span className="text-xs text-muted-foreground">{charCount.toLocaleString()} ตัวอักษร</span>
          <button
            onClick={save}
            className="flex items-center gap-1.5 px-4 py-1.5 rounded-lg bg-primary text-primary-foreground text-sm font-semibold hover:bg-primary/90 transition-colors"
          >
            {saved ? <Check className="w-4 h-4" /> : <Save className="w-4 h-4" />}
            {saved ? "บันทึกแล้ว!" : "บันทึก Soul"}
          </button>
        </div>
      </motion.div>

      {/* Variables reference */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="rounded-2xl bg-muted/30 border border-border p-4 space-y-3"
      >
        <div className="flex items-center gap-2 text-sm font-bold text-foreground">
          <Info className="w-4 h-4 text-primary" />
          Variables ที่ใช้ได้
        </div>
        <div className="grid grid-cols-2 gap-2">
          {VARIABLES.map((v) => (
            <div key={v.key} className="flex items-center gap-2 text-xs">
              <code className="px-1.5 py-0.5 rounded bg-muted font-mono text-primary shrink-0">{v.key}</code>
              <span className="text-muted-foreground">{v.desc}</span>
            </div>
          ))}
        </div>
        <p className="text-xs text-muted-foreground/70">
          หมายเหตุ: Soul นี้จะถูกใช้เป็น system prompt เมื่อตั้งค่าใน telegram-bridge.js
        </p>
      </motion.div>
    </div>
  );
}
