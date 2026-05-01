export type ProviderId =
  | "openrouter"
  | "openai"
  | "anthropic"
  | "google"
  | "groq"
  | "xai"
  | "mistral"
  | "deepseek"
  | "together"
  | "fireworks"
  | "cohere"
  | "ollama"
  | "lmstudio"
  | "vllm"
  | "llamacpp"
  | "huggingface"
  | "custom";

export type ModelCategory = "chat" | "reasoning" | "code" | "vision" | "free" | "fast" | "embedding";

export interface ProviderInfo {
  id: ProviderId;
  label: string;
  url: string;
  placeholder: string;
  color: string;
  docsUrl?: string;
  apiKeyPattern?: string;
  needsKey?: boolean;
  supportsStreaming?: boolean;
}

export const PROVIDERS: ProviderInfo[] = [
  {
    id: "openrouter",
    label: "OpenRouter",
    url: "https://openrouter.ai/api/v1",
    placeholder: "nousresearch/hermes-3-llama-3.1-405b:free",
    color: "#7c3aed",
    docsUrl: "https://openrouter.ai/docs",
    apiKeyPattern: "sk-or-...",
    needsKey: true,
    supportsStreaming: true,
  },
  {
    id: "openai",
    label: "OpenAI",
    url: "https://api.openai.com/v1",
    placeholder: "gpt-4o",
    color: "#10a37f",
    docsUrl: "https://platform.openai.com/docs",
    apiKeyPattern: "sk-...",
    needsKey: true,
    supportsStreaming: true,
  },
  {
    id: "anthropic",
    label: "Anthropic",
    url: "https://api.anthropic.com",
    placeholder: "claude-sonnet-4-6",
    color: "#d97706",
    docsUrl: "https://docs.anthropic.com",
    apiKeyPattern: "sk-ant-...",
    needsKey: true,
    supportsStreaming: true,
  },
  {
    id: "google",
    label: "Google Gemini",
    url: "https://generativelanguage.googleapis.com/v1beta",
    placeholder: "gemini-2.0-flash-exp",
    color: "#4285f4",
    docsUrl: "https://ai.google.dev",
    apiKeyPattern: "AIza...",
    needsKey: true,
    supportsStreaming: true,
  },
  {
    id: "groq",
    label: "Groq",
    url: "https://api.groq.com/openai/v1",
    placeholder: "llama-3.3-70b-versatile",
    color: "#f55036",
    docsUrl: "https://console.groq.com/docs",
    apiKeyPattern: "gsk_...",
    needsKey: true,
    supportsStreaming: true,
  },
  {
    id: "xai",
    label: "xAI Grok",
    url: "https://api.x.ai/v1",
    placeholder: "grok-2-latest",
    color: "#000000",
    docsUrl: "https://docs.x.ai",
    apiKeyPattern: "xai-...",
    needsKey: true,
    supportsStreaming: true,
  },
  {
    id: "mistral",
    label: "Mistral AI",
    url: "https://api.mistral.ai/v1",
    placeholder: "mistral-large-latest",
    color: "#fa520f",
    docsUrl: "https://docs.mistral.ai",
    needsKey: true,
    supportsStreaming: true,
  },
  {
    id: "deepseek",
    label: "DeepSeek",
    url: "https://api.deepseek.com/v1",
    placeholder: "deepseek-chat",
    color: "#1e40af",
    docsUrl: "https://platform.deepseek.com/docs",
    needsKey: true,
    supportsStreaming: true,
  },
  {
    id: "together",
    label: "Together AI",
    url: "https://api.together.xyz/v1",
    placeholder: "meta-llama/Llama-3.3-70B-Instruct-Turbo",
    color: "#0f766e",
    docsUrl: "https://docs.together.ai",
    needsKey: true,
    supportsStreaming: true,
  },
  {
    id: "fireworks",
    label: "Fireworks",
    url: "https://api.fireworks.ai/inference/v1",
    placeholder: "accounts/fireworks/models/llama-v3p3-70b-instruct",
    color: "#dc2626",
    docsUrl: "https://docs.fireworks.ai",
    needsKey: true,
    supportsStreaming: true,
  },
  {
    id: "cohere",
    label: "Cohere",
    url: "https://api.cohere.com/v1",
    placeholder: "command-r-plus",
    color: "#39594d",
    docsUrl: "https://docs.cohere.com",
    needsKey: true,
    supportsStreaming: true,
  },
  {
    id: "ollama",
    label: "Ollama (local)",
    url: "http://localhost:11434/v1",
    placeholder: "nous-hermes2",
    color: "#0369a1",
    docsUrl: "https://ollama.com",
    needsKey: false,
    supportsStreaming: true,
  },
  {
    id: "lmstudio",
    label: "LM Studio (local)",
    url: "http://localhost:1234/v1",
    placeholder: "local-model",
    color: "#6d28d9",
    docsUrl: "https://lmstudio.ai",
    needsKey: false,
    supportsStreaming: true,
  },
  {
    id: "vllm",
    label: "vLLM (local)",
    url: "http://localhost:8000/v1",
    placeholder: "meta-llama/Llama-3.3-70B-Instruct",
    color: "#065f46",
    docsUrl: "https://docs.vllm.ai",
    needsKey: false,
    supportsStreaming: true,
  },
  {
    id: "llamacpp",
    label: "llama.cpp (local)",
    url: "http://localhost:8080/v1",
    placeholder: "gpt-3.5-turbo",
    color: "#92400e",
    docsUrl: "https://github.com/ggerganov/llama.cpp",
    needsKey: false,
    supportsStreaming: true,
  },
  {
    id: "huggingface",
    label: "HuggingFace",
    url: "https://api-inference.huggingface.co/v1",
    placeholder: "meta-llama/Llama-3.3-70B-Instruct",
    color: "#ffd21e",
    docsUrl: "https://huggingface.co/docs/api-inference",
    apiKeyPattern: "hf_...",
    needsKey: true,
    supportsStreaming: true,
  },
  {
    id: "custom",
    label: "Custom",
    url: "",
    placeholder: "your-model-id",
    color: "#6b7280",
    needsKey: false,
    supportsStreaming: true,
  },
];

export function providerInfo(id: string): ProviderInfo {
  return PROVIDERS.find((p) => p.id === id) ?? PROVIDERS[PROVIDERS.length - 1];
}

export interface ModelPreset {
  name: string;
  desc: string;
  emoji: string;
  category: ModelCategory;
  modelId: string;
  provider: ProviderId;
  baseUrl: string;
}

export const MODEL_PRESETS: ModelPreset[] = [
  {
    name: "Hermes 3 405B (Free)",
    desc: "Nous Research flagship — ฟรี ผ่าน OpenRouter",
    emoji: "🌟",
    category: "free",
    modelId: "nousresearch/hermes-3-llama-3.1-405b:free",
    provider: "openrouter",
    baseUrl: "https://openrouter.ai/api/v1",
  },
  {
    name: "Hermes 3 70B (Free)",
    desc: "เร็วกว่า 405B — ฟรี",
    emoji: "⚡",
    category: "free",
    modelId: "nousresearch/hermes-3-llama-3.1-70b:free",
    provider: "openrouter",
    baseUrl: "https://openrouter.ai/api/v1",
  },
  {
    name: "Llama 3.3 70B (Groq)",
    desc: "เร็วโคตร — Groq LPU",
    emoji: "🚀",
    category: "fast",
    modelId: "llama-3.3-70b-versatile",
    provider: "groq",
    baseUrl: "https://api.groq.com/openai/v1",
  },
  {
    name: "Claude Sonnet 4.6",
    desc: "Anthropic flagship — coding & reasoning",
    emoji: "🧠",
    category: "code",
    modelId: "claude-sonnet-4-6",
    provider: "anthropic",
    baseUrl: "https://api.anthropic.com",
  },
  {
    name: "Claude Opus 4.7",
    desc: "Anthropic — สูงสุด สำหรับงานยาก",
    emoji: "💎",
    category: "reasoning",
    modelId: "claude-opus-4-7",
    provider: "anthropic",
    baseUrl: "https://api.anthropic.com",
  },
  {
    name: "GPT-4o",
    desc: "OpenAI multimodal — รูป + เสียง",
    emoji: "👁️",
    category: "vision",
    modelId: "gpt-4o",
    provider: "openai",
    baseUrl: "https://api.openai.com/v1",
  },
  {
    name: "Gemini 2.0 Flash",
    desc: "Google — เร็ว + multimodal",
    emoji: "✨",
    category: "vision",
    modelId: "gemini-2.0-flash-exp",
    provider: "google",
    baseUrl: "https://generativelanguage.googleapis.com/v1beta",
  },
  {
    name: "DeepSeek V3",
    desc: "ราคาถูก คุณภาพสูง",
    emoji: "🐳",
    category: "chat",
    modelId: "deepseek-chat",
    provider: "deepseek",
    baseUrl: "https://api.deepseek.com/v1",
  },
  {
    name: "Grok 2",
    desc: "xAI — ทันสมัย ตอบตรง",
    emoji: "🤖",
    category: "chat",
    modelId: "grok-2-latest",
    provider: "xai",
    baseUrl: "https://api.x.ai/v1",
  },
  {
    name: "Mistral Large",
    desc: "European AI — multilingual",
    emoji: "🇪🇺",
    category: "chat",
    modelId: "mistral-large-latest",
    provider: "mistral",
    baseUrl: "https://api.mistral.ai/v1",
  },
  {
    name: "Nous Hermes 2 (Local)",
    desc: "รันบนเครื่องตัวเอง — ไม่ต้องใช้ internet",
    emoji: "🏠",
    category: "chat",
    modelId: "nous-hermes2",
    provider: "ollama",
    baseUrl: "http://localhost:11434/v1",
  },
];

export const CATEGORY_INFO: Record<ModelCategory, { label: string; emoji: string; color: string }> = {
  free: { label: "ฟรี", emoji: "🆓", color: "#10b981" },
  fast: { label: "เร็ว", emoji: "⚡", color: "#f59e0b" },
  reasoning: { label: "คิดลึก", emoji: "🧠", color: "#8b5cf6" },
  code: { label: "เขียนโค้ด", emoji: "💻", color: "#06b6d4" },
  vision: { label: "เห็นภาพ", emoji: "👁️", color: "#ec4899" },
  chat: { label: "พูดคุย", emoji: "💬", color: "#6366f1" },
  embedding: { label: "Embedding", emoji: "🔢", color: "#64748b" },
};
