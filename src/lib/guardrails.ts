// Guardrails — client-side input/output safety checks.
// All detection is local (regex + keyword lists), no external API calls.

export type GuardrailSeverity = "block" | "warn";

export interface GuardrailViolation {
  ruleId: string;
  ruleName: string;
  severity: GuardrailSeverity;
  message: string;
  matched?: string;
}

export interface GuardrailResult {
  safe: boolean; // false = at least one "block" rule triggered
  violations: GuardrailViolation[];
}

export interface GuardrailRule {
  id: string;
  name: string;
  desc: string;
  severity: GuardrailSeverity;
  category: "input" | "output" | "cost";
  defaultEnabled: boolean;
}

// ─── Rule registry ────────────────────────────────────────────────────────────

export const GUARDRAIL_RULES: GuardrailRule[] = [
  // Input
  {
    id: "prompt_injection",
    name: "Prompt Injection",
    desc: "ตรวจจับการพยายาม override system prompt หรือ hijack คำสั่ง",
    severity: "block",
    category: "input",
    defaultEnabled: true,
  },
  {
    id: "jailbreak",
    name: "Jailbreak Detection",
    desc: "ตรวจจับ pattern jailbreak เช่น DAN, roleplay เพื่อหลีกเลี่ยงกฎ",
    severity: "block",
    category: "input",
    defaultEnabled: true,
  },
  {
    id: "harmful_content",
    name: "Harmful Content Filter",
    desc: "บล็อกคำขอที่เป็นอันตรายชัดเจน เช่น malware, อาวุธ, สิ่งผิดกฎหมาย",
    severity: "block",
    category: "input",
    defaultEnabled: true,
  },
  {
    id: "pii_input",
    name: "PII Input Detection",
    desc: "เตือนเมื่อข้อความมีข้อมูลส่วนตัว เช่น เบอร์โทร, เลขบัตรฯ, email",
    severity: "warn",
    category: "input",
    defaultEnabled: true,
  },
  {
    id: "max_length",
    name: "Max Message Length",
    desc: "จำกัดความยาว input ไม่เกิน 4,000 ตัวอักษร ป้องกัน token abuse",
    severity: "warn",
    category: "input",
    defaultEnabled: true,
  },
  // Output
  {
    id: "pii_output",
    name: "PII Output Detection",
    desc: "เตือนเมื่อ AI ตอบกลับมาพร้อมข้อมูลส่วนตัว",
    severity: "warn",
    category: "output",
    defaultEnabled: true,
  },
  {
    id: "toxic_output",
    name: "Toxic Output Filter",
    desc: "ตรวจจับ response ที่มีเนื้อหาเป็นอันตรายหรือไม่เหมาะสม",
    severity: "warn",
    category: "output",
    defaultEnabled: true,
  },
  // Cost
  {
    id: "cost_limit",
    name: "Session Cost Limit",
    desc: "เตือนเมื่อค่าใช้จ่ายในการสนทนาเกิน $0.50 ต่อ session",
    severity: "warn",
    category: "cost",
    defaultEnabled: true,
  },
];

// ─── Detection patterns ────────────────────────────────────────────────────────

const PROMPT_INJECTION_PATTERNS = [
  /ignore\s+(all\s+)?previous\s+instructions?/i,
  /forget\s+(everything|all|your\s+(previous|prior|above))/i,
  /override\s+(your\s+)?(system\s+)?prompt/i,
  /disregard\s+(your\s+)?(previous\s+)?instructions?/i,
  /new\s+instructions?:\s/i,
  /system\s*:\s*you\s+are\s+now/i,
  /\[system\]/i,
  /<\s*system\s*>/i,
  /\|\|[^|]+\|\|/, // ||injection||
  /<!--.*instructions.*-->/i,
];

const JAILBREAK_PATTERNS = [
  /\bDAN\b/,
  /do\s+anything\s+now/i,
  /jailbreak/i,
  /pretend\s+(you\s+)?(have\s+)?no\s+(restrictions?|limits?|rules?|guidelines?)/i,
  /act\s+as\s+(if\s+you\s+(are|were)\s+)?(an?\s+)?(unrestricted|unfiltered|uncensored)/i,
  /you\s+are\s+now\s+(an?\s+)?(unrestricted|unfiltered|evil|bad)/i,
  /enable\s+(dev(eloper)?\s+)?mode/i,
  /grandma\s+exploit/i,
  /hypothetically\s+speaking.*how\s+to/i,
  /roleplay\s+(as\s+)?(an?\s+)?(evil|hacker|criminal)/i,
];

const HARMFUL_PATTERNS = [
  // Malware / hacking
  /how\s+to\s+(create|make|write|code|build)\s+(a\s+)?(virus|malware|ransomware|keylogger|trojan|backdoor|rootkit)/i,
  /\b(exploit|payload|shell(code)?|reverse\s+shell)\s+(code|script|generator)/i,
  // Weapons
  /how\s+to\s+(make|create|build|synthesize)\s+(a\s+)?(bomb|explosive|weapon\s+of\s+mass)/i,
  /synthesis\s+(of\s+)?(chemical\s+)?weapon/i,
  // Drugs
  /how\s+to\s+(make|synthesize|cook)\s+(meth|methamphetamine|heroin|fentanyl|crystal)/i,
  // Violence / harm
  /how\s+to\s+(kill|murder|harm|hurt|poison)\s+(someone|a\s+person|people)/i,
  /step[\s-]by[\s-]step.*(?:kill|murder|attack|harm)/i,
  // CSAM indicators
  /child\s+(porn|sexual|exploitation)/i,
  /\bcsam\b/i,
];

// Thai + international PII patterns
const PII_PATTERNS: Array<{ pattern: RegExp; label: string }> = [
  // Thai national ID (13 digits, with or without dashes)
  { pattern: /\b\d{1}[-\s]?\d{4}[-\s]?\d{5}[-\s]?\d{2}[-\s]?\d{1}\b/, label: "เลขบัตรประชาชน" },
  // Thai mobile (08x, 09x, 06x)
  { pattern: /\b0[689]\d{8}\b/, label: "เบอร์โทรศัพท์ไทย" },
  // International phone with country code
  { pattern: /\+\d{1,3}[\s-]?\d{3,4}[\s-]?\d{3,4}[\s-]?\d{3,4}/, label: "หมายเลขโทรศัพท์" },
  // Email
  { pattern: /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/, label: "อีเมล" },
  // Credit / debit card (4 groups of 4 digits)
  { pattern: /\b\d{4}[\s-]\d{4}[\s-]\d{4}[\s-]\d{4}\b/, label: "เลขบัตรเครดิต" },
  // Thai bank account (10-12 digits)
  { pattern: /\b\d{3}-\d{1}-\d{5}-\d{1}\b/, label: "เลขบัญชีธนาคาร" },
  // Passport
  { pattern: /\b[A-Z]{1,2}\d{6,9}\b/, label: "เลขพาสปอร์ต" },
];

const TOXIC_OUTPUT_PATTERNS = [
  /detailed\s+instructions?\s+(for|to)\s+(make|create|build)\s+(a\s+)?(bomb|weapon|malware)/i,
  /step\s+\d+[:.]\s*(acquire|obtain|synthesize|assemble)\s+(explosive|chemical\s+weapon)/i,
  // Explicit personal threats
  /i\s+(will|am\s+going\s+to)\s+(kill|harm|murder|hurt)\s+(you|them)/i,
];

const MAX_INPUT_LENGTH = 4000;
const SESSION_COST_WARN_USD = 0.5;

// ─── Config storage ───────────────────────────────────────────────────────────

const STORAGE_KEY = "hermes-guardrails-config";

export function loadGuardrailConfig(): Record<string, boolean> {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return JSON.parse(raw);
  } catch {
    /* ignore */
  }
  return Object.fromEntries(GUARDRAIL_RULES.map((r) => [r.id, r.defaultEnabled]));
}

export function saveGuardrailConfig(config: Record<string, boolean>) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(config));
  } catch {
    /* ignore */
  }
}

// ─── Core check functions ─────────────────────────────────────────────────────

export function checkInput(text: string, config: Record<string, boolean>): GuardrailResult {
  const violations: GuardrailViolation[] = [];

  // 1. Max length
  if (config["max_length"] !== false && text.length > MAX_INPUT_LENGTH) {
    violations.push({
      ruleId: "max_length",
      ruleName: "Max Message Length",
      severity: "warn",
      message: `ข้อความยาวเกินไป (${text.length.toLocaleString()} / ${MAX_INPUT_LENGTH.toLocaleString()} ตัวอักษร) อาจใช้ token มากผิดปกติ`,
    });
  }

  // 2. Prompt injection
  if (config["prompt_injection"] !== false) {
    for (const pattern of PROMPT_INJECTION_PATTERNS) {
      const match = text.match(pattern);
      if (match) {
        violations.push({
          ruleId: "prompt_injection",
          ruleName: "Prompt Injection",
          severity: "block",
          message: "ตรวจพบ pattern ที่พยายาม override คำสั่งของระบบ",
          matched: match[0],
        });
        break;
      }
    }
  }

  // 3. Jailbreak
  if (config["jailbreak"] !== false) {
    for (const pattern of JAILBREAK_PATTERNS) {
      const match = text.match(pattern);
      if (match) {
        violations.push({
          ruleId: "jailbreak",
          ruleName: "Jailbreak Detection",
          severity: "block",
          message: "ตรวจพบ pattern jailbreak ที่พยายามหลีกเลี่ยงกฎความปลอดภัย",
          matched: match[0],
        });
        break;
      }
    }
  }

  // 4. Harmful content
  if (config["harmful_content"] !== false) {
    for (const pattern of HARMFUL_PATTERNS) {
      const match = text.match(pattern);
      if (match) {
        violations.push({
          ruleId: "harmful_content",
          ruleName: "Harmful Content Filter",
          severity: "block",
          message: "ตรวจพบคำขอที่เป็นอันตรายหรือผิดกฎหมาย ไม่สามารถดำเนินการได้",
          matched: match[0],
        });
        break;
      }
    }
  }

  // 5. PII input
  if (config["pii_input"] !== false) {
    const found: string[] = [];
    for (const { pattern, label } of PII_PATTERNS) {
      if (pattern.test(text)) found.push(label);
    }
    if (found.length > 0) {
      violations.push({
        ruleId: "pii_input",
        ruleName: "PII Input Detection",
        severity: "warn",
        message: `ข้อความมีข้อมูลส่วนตัว: ${found.join(", ")} — แน่ใจหรือไม่ที่จะส่งข้อมูลนี้ไปยัง AI?`,
        matched: found.join(", "),
      });
    }
  }

  const safe = !violations.some((v) => v.severity === "block");
  return { safe, violations };
}

export function checkOutput(text: string, config: Record<string, boolean>): GuardrailResult {
  const violations: GuardrailViolation[] = [];

  // 1. PII leakage in response
  if (config["pii_output"] !== false) {
    const found: string[] = [];
    for (const { pattern, label } of PII_PATTERNS) {
      if (pattern.test(text)) found.push(label);
    }
    if (found.length > 0) {
      violations.push({
        ruleId: "pii_output",
        ruleName: "PII Output Detection",
        severity: "warn",
        message: `AI ตอบกลับมาพร้อม ${found.join(", ")} — ระวังการแชร์ข้อมูลนี้`,
        matched: found.join(", "),
      });
    }
  }

  // 2. Toxic output
  if (config["toxic_output"] !== false) {
    for (const pattern of TOXIC_OUTPUT_PATTERNS) {
      const match = text.match(pattern);
      if (match) {
        violations.push({
          ruleId: "toxic_output",
          ruleName: "Toxic Output Filter",
          severity: "warn",
          message: "AI ตอบกลับมาพร้อมเนื้อหาที่อาจเป็นอันตราย — โปรดระวัง",
          matched: match[0],
        });
        break;
      }
    }
  }

  const safe = !violations.some((v) => v.severity === "block");
  return { safe, violations };
}

export function checkCost(
  sessionCostUsd: number,
  config: Record<string, boolean>,
): GuardrailResult {
  const violations: GuardrailViolation[] = [];
  if (config["cost_limit"] !== false && sessionCostUsd >= SESSION_COST_WARN_USD) {
    violations.push({
      ruleId: "cost_limit",
      ruleName: "Session Cost Limit",
      severity: "warn",
      message: `ค่าใช้จ่ายในการสนทนาเกิน $${SESSION_COST_WARN_USD} แล้ว (ปัจจุบัน: $${sessionCostUsd.toFixed(4)})`,
    });
  }
  return { safe: true, violations };
}
