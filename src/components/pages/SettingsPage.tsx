import { useState, useEffect } from "react";
import { Settings, Moon, Sun, Bell, Globe, Trash2, Check } from "lucide-react";
import { motion } from "framer-motion";

export function SettingsPage() {
  const [dark, setDark] = useState(() => document.documentElement.classList.contains("dark"));
  const [notifications, setNotifications] = useState(true);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    const root = document.documentElement;
    if (dark) {
      root.classList.add("dark");
      localStorage.setItem("theme", "dark");
    } else {
      root.classList.remove("dark");
      localStorage.setItem("theme", "light");
    }
  }, [dark]);

  const save = () => {
    localStorage.setItem("hermes-settings", JSON.stringify({ notifications }));
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const sections = [
    {
      title: "Appearance",
      items: [
        {
          icon: dark ? Moon : Sun,
          label: "Dark Mode",
          desc: "สลับธีมระหว่างสว่างและมืด",
          control: (
            <button
              onClick={() => setDark((d) => !d)}
              className={`relative w-10 rounded-full transition-colors`}
              style={{ height: "22px", background: dark ? "var(--color-primary)" : "var(--color-muted-foreground)" + "40" }}
            >
              <span
                className="absolute top-0.5 rounded-full bg-white shadow transition-all"
                style={{ width: "18px", height: "18px", left: dark ? "20px" : "2px" }}
              />
            </button>
          ),
        },
      ],
    },
    {
      title: "Notifications",
      items: [
        {
          icon: Bell,
          label: "Toast Notifications",
          desc: "แสดงการแจ้งเตือนเมื่องานเสร็จหรือ error",
          control: (
            <button
              onClick={() => setNotifications((n) => !n)}
              className="relative w-10 rounded-full transition-colors"
              style={{ height: "22px", background: notifications ? "var(--color-status-success)" : "var(--color-muted-foreground)" + "40" }}
            >
              <span
                className="absolute top-0.5 rounded-full bg-white shadow transition-all"
                style={{ width: "18px", height: "18px", left: notifications ? "20px" : "2px" }}
              />
            </button>
          ),
        },
      ],
    },
    {
      title: "Language",
      items: [
        {
          icon: Globe,
          label: "ภาษา UI",
          desc: "ภาษาสำหรับ interface และข้อความ",
          control: (
            <select className="text-xs rounded-lg border border-border bg-background px-2 py-1 text-foreground focus:outline-none">
              <option value="th">ภาษาไทย</option>
              <option value="en">English</option>
            </select>
          ),
        },
      ],
    },
  ];

  return (
    <div className="p-6 lg:p-8 space-y-6 max-w-2xl mx-auto">
      <div>
        <h1 className="text-2xl font-black text-foreground flex items-center gap-2.5">
          <Settings className="w-6 h-6 text-primary" />
          Settings
        </h1>
        <p className="text-sm text-muted-foreground mt-1">ตั้งค่า Web App</p>
      </div>

      {sections.map(({ title, items }, si) => (
        <motion.div
          key={title}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: si * 0.07 }}
          className="rounded-2xl bg-card border border-border overflow-hidden"
        >
          <div className="px-4 py-3 border-b border-border">
            <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">{title}</span>
          </div>
          <div className="divide-y divide-border">
            {items.map(({ icon: Icon, label, desc, control }) => (
              <div key={label} className="flex items-center gap-3 px-4 py-3.5">
                <Icon className="w-4 h-4 text-primary shrink-0" />
                <div className="flex-1">
                  <div className="text-sm font-semibold text-foreground">{label}</div>
                  <div className="text-xs text-muted-foreground">{desc}</div>
                </div>
                {control}
              </div>
            ))}
          </div>
        </motion.div>
      ))}

      <div className="flex items-center gap-3">
        <button
          onClick={save}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-primary text-primary-foreground text-sm font-semibold hover:bg-primary/90 transition-colors"
        >
          {saved ? <Check className="w-4 h-4" /> : <Settings className="w-4 h-4" />}
          {saved ? "บันทึกแล้ว!" : "บันทึกการตั้งค่า"}
        </button>
        <button className="flex items-center gap-1.5 text-xs text-destructive hover:text-destructive/80 transition-colors">
          <Trash2 className="w-3.5 h-3.5" />
          รีเซ็ตทั้งหมด
        </button>
      </div>
    </div>
  );
}
