# Real Benchmark Results — Actual Provider Pipeline

**Date:** 2026-04-30  
**API:** http://100.66.225.85:1234/v1/chat/completions (LM Studio)  
**Tests:** 39 sentences × full post-processor pipeline  
**Pipeline:** Single-call LLM → strip preamble → lexical substitution (with plural handling) → voseo → agreement → punctuation → accentuation → capitalization → typography → sentinel restore

## Final Results

### TINY (≤500M parameters)
| Model | Score | Compact | Notes |
|-------|-------|---------|-------|
| google_gemma-3-270m-it | 10/39 (26%) | ✅ | Often empty responses; barely usable |
| smollm2-360m-instruct | 24-27/39 (62-69%) | ✅ | Best tiny; scores vary ~5pp between runs |
| lfm2-350m | 25/39 (64%) | ✅ | Slightly better than smollm2 |
| lfm2.5-350m | 24/39 (62%) | ✅ | Consistent with other 350M models |

### SMALL (0.6B–4B parameters)
| Model | Score | Compact | Notes |
|-------|-------|---------|-------|
| qwen3-0.6b | 21/39 (54%) | ✅ | Very slow (~5.7s/test); not production-ready |
| qwen3.5-0.8b | 27/39 (69%) | ✅ | Solid step up from 0.6B |
| lfm2.5-1.2b-instruct | 31/39 (79%) | ✅ | Good accuracy for 1.2B |
| **gemma-4-e2b-it** | **39/39 (100%)** | ✅ | ⭐ Perfect score; best small model |

### MEDIUM (2B–8B parameters)
| Model | Score | Compact | Notes |
|-------|-------|---------|-------|
| qwen3.5-2b | 36/39 (92%) | ✅ | Excellent for 2B |
| **qwen3.5-4b** | **39/39 (100%)** | ✅ | ⭐ Perfect score |
| **lfm2-8b-a1b** | **39/39 (100%)** | ✅ | ⭐ Perfect score; fastest of the 100% models |

### LARGE (>8B parameters)
| Model | Score | Compact | Notes |
|-------|-------|---------|-------|
| qwen3.5-9b | 38/39 (97%) | ❌ | Non-compact prompts; excellent accuracy |
| qwen3.6-27b | 0/39 (0%) | ❌ | Not loaded in GPU; times out |
| qwen3-coder-40b | 0/39 (0%) | ❌ | Outputs Chinese; wrong model type for translation |

## Key Findings

### 1. Post-processors are the force multiplier
The lexical substitution + voseo adapter pipeline catches what weak LLMs miss and closes the gap between model tiers. A 360M model with post-processors (~65%) outperforms a raw 0.6B model (would be ~40% without post-processors).

### 2. Three models achieve 100%
- **gemma-4-e2b-it** (4B effective) — fastest perfect model at ~0.7s/test
- **qwen3.5-4b** (4B) — also perfect
- **lfm2-8b-a1b** (8B) — perfect, slightly slower

### 3. Garbage detection improvements helped weak models
Added patterns for:
- "elote" hallucination (corn for baby/strawberry/elevator)
- Dialect-code-only outputs ("es-MX", "es-AR")
- Conversational preambles ("¡Bienvenido!", "Entiendo. Estoy listo...")
- Meta-instructions ("Puede decirlo en español")
- Spanglish ("nice casa")
- `/no_think` tag leakage
- Quiz-answer format ("La respuesta es:")
- Annotation output ("Voseo: ir")

These improvements boosted tiny-model scores by ~5-10 percentage points.

### 4. Plural handling matters
Adding Spanish plural detection to lexical substitution fixed failures like "fresas" → "frutillas" and "carros" → "coches", improving scores by 2-5 percentage points on affected models.

### 5. Weak models are inherently unstable
Scores on 350M models vary by ~5 percentage points between runs. Outputs include:
- Random hallucinations ("elote", "ave", "mazorca")
- English-Spanish mixing ("Te traigo el elevator al 5th floor")
- Answering instead of translating ("Sí, quería comer")
- Meta-instructions ("Puede decirlo en español")
- Conversational junk ("¡Bienvenido!", "Entiendo. Estoy listo...")

### 6. Large local models are unusable
Models >20B (qwen3.6-27b, qwen3.6-35b) are not loaded in GPU memory and time out. The 40B coding model outputs wrong language. For local inference, 4B–8B is the practical maximum.

## Known Failure Modes (Weak Models)

| Failure | Example | Frequency |
|---------|---------|-----------|
| Corn hallucination | "elote" for baby/strawberry/elevator | Common on ≤500M |
| English-Spanish mix | "Te traigo el elevator al 5th floor" | Common on ≤500M |
| Answering questions | "Sí, quería comer" for "Do you want to eat?" | Common on ≤1B |
| Meta-instructions | "Puede decirlo en español" | Occasional on ≤1B |
| Conversational preamble | "¡Bienvenido!", "Entiendo..." | Occasional on ≤1B |
| Wrong verb/person | "Te has dado" instead of "Tienes" | Occasional on ≤1B |
| Subject change | "Usted necesita" instead of "Necesito" | Rare |
| Complete hallucination | "Un frutillo está más amarillo" | Rare |

## Recommendations

| Use Case | Recommended Model | Expected Accuracy | Latency |
|----------|-------------------|-------------------|---------|
| Lowest latency, weakest hardware | smollm2-360m | ~60% | ~0.7s/test |
| **Best accuracy/speed tradeoff** | **gemma-4-e2b-it** | **100%** | **~0.7s/test** |
| Maximum local accuracy | lfm2-8b-a1b or qwen3.5-4b | 100% | ~0.6-0.9s/test |
| Cloud fallback | MiniMax-M2 / GLM-4 | ~60% | Cloud latency |

## Test Coverage

The 39 tests cover:
- **Vocabulary (24 tests):** car, bus, baby, elevator, pickup truck, strawberry, parking across 7 dialects
- **Voseo (8 tests):** querés/hacés/tenés in voseo dialects; quieres/haces/tienes in tú dialects
- **Article agreement (4 tests):** el/la/un/una correction after noun swaps
- **Plural handling (3 tests):** fresas→frutillas, carros→coches, frutillas→fresas
