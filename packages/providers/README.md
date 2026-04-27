# @dialectos/providers

Translation providers with circuit breaker, retry logic, model-agnostic LLM compatibility, and capability negotiation.

## Supported Providers

| Provider | Auth Required | Dialect Support | Max Payload |
|----------|---------------|-----------------|-------------|
| LLM | Optional by gateway | Semantic dialect-aware (OpenAI/Anthropic/LM Studio-compatible) | 50,000 chars default |
| DeepL | ✅ API key | Native/approximate | 50,000 chars |
| LibreTranslate | Optional | None | 5,000 chars |
| MyMemory | ❌ Free | None | 500 chars |

## Usage

```typescript
import { ProviderRegistry, LLMProvider, DeepLProvider, LibreTranslateProvider, MyMemoryProvider } from "@dialectos/providers";

const registry = new ProviderRegistry();

// Register semantic provider first
registry.register(new LLMProvider({
  endpoint: process.env.LLM_API_URL,
  model: process.env.LLM_MODEL,
  apiKey: process.env.LLM_API_KEY,
  apiFormat: process.env.LLM_API_FORMAT === "anthropic"
    ? "anthropic"
    : process.env.LLM_API_FORMAT === "lmstudio"
      ? "lmstudio"
      : "openai",
}));

// Register fallback utilities
registry.register(new DeepLProvider(process.env.DEEPL_AUTH_KEY));
registry.register(new LibreTranslateProvider({ endpoint: "https://libretranslate.de" }));
registry.register(new MyMemoryProvider());

// Get best available provider; semantic dialect providers are preferred
const provider = registry.getAuto();
const result = await provider.translate("Hello", "en", "es");
```

### LLM compatibility

Use `LLM_API_FORMAT=openai` for OpenAI-compatible chat-completions gateways, `LLM_API_FORMAT=anthropic` for Anthropic-compatible messages gateways, and `LLM_API_FORMAT=lmstudio` for LM Studio native REST with just-in-time local model loading.

```bash
LLM_API_URL="https://api.anthropic.com/v1/messages"
LLM_MODEL="claude-sonnet-4-5"
LLM_API_KEY="..."
LLM_API_FORMAT="anthropic"
```


```bash
LM_STUDIO_URL="http://127.0.0.1:1234"
LLM_MODEL="publisher/model-key-or-api-identifier"
LLM_API_FORMAT="lmstudio"
```

LM Studio mode calls the native `/api/v1/models`, `/api/v1/models/load`, and `/api/v1/chat` endpoints so a downloaded local model can be loaded on demand before dialect evaluation.

## Capability Negotiation

```typescript
// Check if a provider supports a language
const errors = registry.validateRequest("deepl", text, "en", "es-MX", { formality: "formal" });
if (errors.length > 0) {
  console.log(errors[0].reason); // "Provider does not support dialect variants"
}
```

## Chaos Testing

```typescript
import { ChaosProvider } from "@dialectos/providers";

const chaos = new ChaosProvider(realProvider, { mode: "http-5xx", failOnCalls: [1, 2] });
// Injects deterministic failures for resilience testing
```
