/**
 * LLM response extraction and sanitization.
 *
 * Handles extracting translated text from OpenAI, Anthropic, and LM Studio
 * API responses, plus stripping preamble/format-injection artifacts that
 * small models commonly emit.
 */

// Reasoning/thinking tags emitted by qwen3 and other thinking-capable models.
const THINK_TAG_PATTERN = /<think[^>]*>[\s\S]*?<\/think\s*>/g;

// Tags stripped from LLM output before preamble removal.
const REASONING_TAG_RE = /<think[\s>][\s\S]*?<\/think>|<thinking[\s>][\s\S]*?<\/thinking>|<tiz[\s>][\s\S]*?<\/tiz>/gi;

// Common conversational preambles small models emit before the actual translation.
const PREAMBLE_PATTERNS: Array<[RegExp, string]> = [
  [/^[\s\S]*?(Sure,? I can help[^\n]*\n+)/i, ""],
  [/^[\s\S]*?(Okay,? I understand[^\n]*\n+)/i, ""],
  [/^[\s\S]*?(Here is (a |the )?(translated |Spanish )?[^\n]*:\s*\n+)/i, ""],
  [/^[\s\S]*?(Here's (a |the )?(translated |Spanish )?[^\n]*:\s*\n+)/i, ""],
  [/^[\s\S]*?(Below is (a |the )?[^\n]*:\s*\n+)/i, ""],
  [/^[\s\S]*?(Let me (help|translate|provide|begin)[^\n]*\n+)/i, ""],
  [/^[\s\S]*?(Let's begin[^\n]*\n+)/i, ""],
  [/^\s*<<<\s*\n/m, ""],
  [/\n\s*>>>\s*$/m, ""],
  // Spanish conversational preambles (weak models)
  [/^\s*¡?Bienvenido!?\s*\n*/i, ""],
  [/^\s*Entiendo\.?\s*Estoy listo[^\n]*\n+/i, ""],
  [/^\s*Claro,?\s*(puedo|te puedo)[^\n]*\n+/i, ""],
];

// Chat template format markers that can be abused for prompt injection.
const FORMAT_INJECTION_PATTERNS: Array<[RegExp, string]> = [
  [/<\|im_start\|>\s*(system|assistant|user)\b[^<]*<\|im_end\|>/gi, ""],
  [/<\|im_start\|>/gi, ""],
  [/<\|im_end\|>/gi, ""],
  [/\[INST\][\s\S]*?\[\/INST\]/gi, ""],
  [/\[INST\]/gi, ""],
  [/\[\/INST\]/gi, ""],
  [/###\s*Instruction:/gi, ""],
  [/###\s*Response:/gi, ""],
  [/###\s*System:/gi, ""],
  [/<system>[\s\S]*?<\/system>/gi, ""],
  [/<system>/gi, ""],
  [/<\/system>/gi, ""],
  [/<\|assistant\|>/gi, ""],
  [/<\|user\|>/gi, ""],
  [/<\|system\|>/gi, ""],
  [/^\s*(SYSTEM|ASSISTANT|USER|INSTRUCTION)\s*:\s*/gm, ""],
];

const SANITIZE_MAP: Array<[RegExp, string]> = [
  [/—/g, "-"],
  [/–/g, "-"],
  [/‘|’/g, "'"],
  [/“|”/g, '"'],
  [/€/g, "EUR"],
  [/£/g, "GBP"],
  [/¥/g, "JPY"],
  [/…/g, "..."],
];

/**
 * Extract text from an OpenAI-format chat completion response.
 * Handles both legacy `choices[0].text` and modern `choices[0].message.content`
 * formats, including content arrays.
 */
export function extractChatCompletionText(data: unknown): string | null {
  if (!data || typeof data !== "object") return null;
  const choices = (data as { choices?: unknown }).choices;
  if (!Array.isArray(choices) || choices.length === 0) return null;
  const first = choices[0] as { message?: { content?: unknown }; text?: unknown } | undefined;
  const content = first?.message?.content ?? first?.text;
  // Modern OpenAI responses may return content as an array of parts
  if (Array.isArray(content)) {
    const text = content
      .map((part) => {
        if (!part || typeof part !== "object") return "";
        const typed = part as { type?: unknown; text?: unknown };
        if (typed.type === "text" && typeof typed.text === "string") {
          return typed.text;
        }
        const maybeText = typed.text;
        return typeof maybeText === "string" ? maybeText : "";
      })
      .join("")
      .trim();
    return text.length > 0 ? text : null;
  }
  if (typeof content !== "string" || content.trim().length === 0) return null;
  return stripReasoningTags(content.trim());
}

function stripReasoningTags(text: string): string {
  const stripped = text.replace(REASONING_TAG_RE, "").trim();
  return stripped.length > 0 ? stripped : text;
}

/**
 * Extract text from an Anthropic-format messages response.
 */
export function extractAnthropicText(data: unknown): string | null {
  if (!data || typeof data !== "object") return null;
  const content = (data as { content?: unknown }).content;
  if (!Array.isArray(content)) return null;

  const text = content
    .map((part) => {
      if (!part || typeof part !== "object") return "";
      const maybeText = (part as { text?: unknown }).text;
      return typeof maybeText === "string" ? maybeText : "";
    })
    .join("")
    .trim();

  return text.length > 0 ? text : null;
}

/**
 * Extract text from an LM Studio native response.
 */
export function extractLMStudioText(data: unknown): string | null {
  if (!data || typeof data !== "object") return null;
  const output = (data as { output?: unknown }).output;
  if (!Array.isArray(output)) return null;

  const text = output
    .map((item) => {
      if (!item || typeof item !== "object") return "";
      const typed = item as { type?: unknown; content?: unknown };
      return typed.type === "message" && typeof typed.content === "string"
        ? typed.content
        : "";
    })
    .join("")
    .trim();

  return text.length > 0 ? text : null;
}

/**
 * Dispatch to the correct extractor based on the API format string.
 * Returns the extracted text or an empty string if nothing was found.
 */
export function extractResponseText(format: string, data: unknown): string | undefined {
  switch (format) {
    case "anthropic":
      return extractAnthropicText(data) ?? undefined;
    case "lmstudio":
      return extractLMStudioText(data) ?? undefined;
    default:
      return extractChatCompletionText(data) ?? undefined;
  }
}

/**
 * Remove common preamble patterns that small models emit before the
 * actual translation output.
 */
export function stripPreamble(text: string): string {
  let result = text;
  // Strip reasoning/thinking tags first (qwen3, etc.)
  result = result.replace(THINK_TAG_PATTERN, "");
  for (const [pattern, replacement] of PREAMBLE_PATTERNS) {
    result = result.replace(pattern, replacement);
  }
  return result.trim();
}

/**
 * Remove chat-template format injection artifacts (ChatML, Llama, Alpaca, etc.).
 */
export function stripFormatInjection(text: string): string {
  let result = text;
  for (const [pattern, replacement] of FORMAT_INJECTION_PATTERNS) {
    result = result.replace(pattern, replacement);
  }
  return result;
}

/**
 * Sanitize text for inclusion in LLM prompts.
 * Strips format injection and normalises Unicode punctuation.
 */
export function sanitizeForPrompt(text: string): string {
  let result = stripFormatInjection(text);
  for (const [pattern, replacement] of SANITIZE_MAP) {
    result = result.replace(pattern, replacement);
  }
  return result;
}
