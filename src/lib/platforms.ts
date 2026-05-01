export interface PlatformInfo {
  id: string;
  label: string;
  emoji: string;
  category: "messaging" | "email" | "voice" | "social" | "automation";
  envKeys: string[];
  description: string;
  color: string;
  website?: string;
}

export const PLATFORMS: PlatformInfo[] = [
  // Messaging
  { id: "telegram", label: "Telegram", emoji: "✈️", category: "messaging", envKeys: ["TELEGRAM_BOT_TOKEN", "TELEGRAM_ALLOWED_USERS"], description: "Bot สำหรับ Telegram chat", color: "#0088cc", website: "https://t.me" },
  { id: "discord", label: "Discord", emoji: "🎮", category: "messaging", envKeys: ["DISCORD_BOT_TOKEN", "DISCORD_ALLOWED_USERS"], description: "Discord bot ใน server", color: "#5865f2" },
  { id: "slack", label: "Slack", emoji: "💼", category: "messaging", envKeys: ["SLACK_BOT_TOKEN", "SLACK_APP_TOKEN", "SLACK_ALLOWED_USERS"], description: "Slack bot สำหรับ workspace", color: "#4a154b" },
  { id: "whatsapp", label: "WhatsApp", emoji: "💚", category: "messaging", envKeys: ["WHATSAPP_ENABLED", "WHATSAPP_ALLOWED_USERS"], description: "WhatsApp via Baileys", color: "#25d366" },
  { id: "signal", label: "Signal", emoji: "🔒", category: "messaging", envKeys: ["SIGNAL_PHONE_NUMBER"], description: "Signal Messenger (E2E)", color: "#3a76f0" },
  { id: "matrix", label: "Matrix", emoji: "🌐", category: "messaging", envKeys: ["MATRIX_HOMESERVER", "MATRIX_USER_ID", "MATRIX_PASSWORD"], description: "Matrix decentralized chat", color: "#000000" },
  { id: "mattermost", label: "Mattermost", emoji: "📢", category: "messaging", envKeys: ["MATTERMOST_URL", "MATTERMOST_TOKEN"], description: "Open-source Slack alternative", color: "#0058cc" },
  { id: "irc", label: "IRC", emoji: "📟", category: "messaging", envKeys: ["IRC_SERVER", "IRC_NICK"], description: "Internet Relay Chat (plugin)", color: "#666666" },

  // Chinese platforms
  { id: "dingtalk", label: "DingTalk", emoji: "🔔", category: "messaging", envKeys: ["DINGTALK_APP_KEY", "DINGTALK_APP_SECRET"], description: "อาลีบาบา enterprise IM", color: "#1296db" },
  { id: "feishu", label: "Feishu / Lark", emoji: "🪶", category: "messaging", envKeys: ["FEISHU_APP_ID", "FEISHU_APP_SECRET"], description: "ByteDance enterprise suite", color: "#00d6b9" },
  { id: "wecom", label: "WeCom", emoji: "🏢", category: "messaging", envKeys: ["WECOM_CORP_ID", "WECOM_AGENT_ID"], description: "Tencent enterprise WeChat", color: "#07c160" },
  { id: "wechat", label: "WeChat", emoji: "💬", category: "messaging", envKeys: ["WECHAT_APP_ID", "WECHAT_APP_SECRET"], description: "WeChat official account", color: "#07c160" },
  { id: "qq", label: "QQ", emoji: "🐧", category: "messaging", envKeys: ["QQ_BOT_TOKEN"], description: "Tencent QQ bot", color: "#12b7f5" },
  { id: "yuanbao", label: "Yuanbao", emoji: "💰", category: "messaging", envKeys: ["YUANBAO_TOKEN"], description: "Tencent Yuanbao", color: "#ff6b00" },
  { id: "xiaomi", label: "Xiaomi", emoji: "📱", category: "messaging", envKeys: ["XIAOMI_API_KEY"], description: "Xiaomi MiAI assistant", color: "#ff6900" },

  // Email
  { id: "email", label: "Email (IMAP/SMTP)", emoji: "📧", category: "email", envKeys: ["EMAIL_ADDRESS", "EMAIL_PASSWORD", "IMAP_HOST", "SMTP_HOST"], description: "อ่าน/ส่ง email อัตโนมัติ", color: "#ea4335" },
  { id: "gmail", label: "Gmail", emoji: "📩", category: "email", envKeys: ["GMAIL_CREDENTIALS_PATH"], description: "Gmail via OAuth", color: "#ea4335" },

  // SMS
  { id: "sms", label: "SMS (Twilio)", emoji: "📱", category: "messaging", envKeys: ["TWILIO_ACCOUNT_SID", "TWILIO_AUTH_TOKEN", "TWILIO_PHONE"], description: "ส่ง/รับ SMS via Twilio", color: "#f22f46" },
  { id: "bluebubbles", label: "BlueBubbles (iMessage)", emoji: "🫧", category: "messaging", envKeys: ["BLUEBUBBLES_URL", "BLUEBUBBLES_PASSWORD"], description: "iMessage bridge สำหรับ Mac", color: "#3b82f6" },

  // Automation
  { id: "homeassistant", label: "Home Assistant", emoji: "🏠", category: "automation", envKeys: ["HOMEASSISTANT_URL", "HOMEASSISTANT_TOKEN"], description: "ควบคุม smart home", color: "#41bdf5" },
  { id: "webhook", label: "Webhook Receiver", emoji: "🪝", category: "automation", envKeys: ["WEBHOOK_PORT", "WEBHOOK_SECRET"], description: "รับ event จาก GitHub/GitLab/etc", color: "#a855f7" },

  // Voice
  { id: "voice", label: "Voice (STT/TTS)", emoji: "🎙️", category: "voice", envKeys: ["VOICE_TOOLS_OPENAI_KEY", "STT_GROQ_MODEL"], description: "Speech-to-text + text-to-speech", color: "#10b981" },

  // Social
  { id: "twitter", label: "Twitter / X", emoji: "🐦", category: "social", envKeys: ["TWITTER_BEARER_TOKEN"], description: "โพสต์/อ่าน tweets", color: "#000000" },
  { id: "github", label: "GitHub", emoji: "🐙", category: "automation", envKeys: ["GITHUB_TOKEN", "GITHUB_APP_ID"], description: "GitHub issues, PRs, webhooks", color: "#181717" },
];

export const CATEGORY_LABELS = {
  messaging: "ข้อความ",
  email: "อีเมล",
  voice: "เสียง",
  social: "โซเชียล",
  automation: "อัตโนมัติ",
};
