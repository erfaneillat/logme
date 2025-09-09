export interface ModelPricing {
    inputPer1K: number; // USD per 1K input tokens
    outputPer1K: number; // USD per 1K output tokens
}

const defaultPricingMap: Record<string, ModelPricing> = {
    // Source: OpenAI pricing docs (values represent USD per 1K tokens)
    // Keep this map minimal; prefer overriding via env JSON below
    'gpt-4o-mini-2024-07-18': { inputPer1K: 0.00015, outputPer1K: 0.0006 },
    'gpt-4o-mini-2025-08-07': { inputPer1K: 0.00025, outputPer1K: 0.002 },
};

/**
 * Reads pricing from OPENAI_PRICING_JSON env var if provided.
 * Example:
 *   OPENAI_PRICING_JSON='{"gpt-4o-mini": {"inputPer1K": 0.0002, "outputPer1K": 0.0008}}'
 */
function normalizeBase(model: string): string {
    // strip trailing versioned date suffix like -YYYY-MM-DD if present
    return model.replace(/-\d{4}-\d{2}-\d{2}$/i, '');
}

function findPricingByLooseMatch(model: string, map: Record<string, ModelPricing>): ModelPricing | null {
    const base = normalizeBase(model);
    // 1) exact
    if (map[model]) return map[model];
    // 2) try base exact
    if (map[base]) return map[base];
    // 3) any key whose base matches
    for (const key of Object.keys(map)) {
        const keyBase = normalizeBase(key);
        if (keyBase === base) return map[key] ?? null;
        if (key.startsWith(base) || base.startsWith(keyBase)) return map[key] ?? null;
    }
    return null;
}

export function getPricingForModel(model: string): ModelPricing | null {
    const envJson = process.env.OPENAI_PRICING_JSON;
    if (envJson) {
        try {
            const parsed = JSON.parse(envJson) as Record<string, ModelPricing>;
            const envMatch = findPricingByLooseMatch(model, parsed);
            if (envMatch) return envMatch;
        } catch (_) {
            // ignore malformed env
        }
    }
    const def = findPricingByLooseMatch(model, defaultPricingMap);
    return def ?? null;
}

export function calculateOpenAICostUSD(
    model: string,
    promptTokens: number,
    completionTokens: number
): number | null {
    const pricing = getPricingForModel(model);
    if (!pricing) return null;
    const inputCost = (promptTokens / 1000) * pricing.inputPer1K;
    const outputCost = (completionTokens / 1000) * pricing.outputPer1K;
    return inputCost + outputCost;
}

export function formatUSD(amount: number): string {
    return `$${amount.toFixed(6)}`;
}

export function roundTo6(amount: number): number {
    return Math.round(amount * 1e6) / 1e6;
}


