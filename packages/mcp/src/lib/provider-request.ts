import type { ProviderRegistry } from "@dialectos/providers";
import type { TranslateOptions } from "@dialectos/types";

export interface PreparedToolProviderRequest {
  sourceLang: string;
  targetLang: string;
  options: TranslateOptions;
}

export function prepareProviderRequest(
  registry: ProviderRegistry,
  providerName: string,
  text: string,
  sourceLang: string,
  targetLang: string,
  options: TranslateOptions
): PreparedToolProviderRequest {
  const maybeRegistry = registry as ProviderRegistry & {
    prepareRequest?: (
      name: string,
      text: string,
      sourceLang: string,
      targetLang: string,
      options: TranslateOptions
    ) => PreparedToolProviderRequest;
  };

  return maybeRegistry.prepareRequest?.(providerName, text, sourceLang, targetLang, options) ?? {
    sourceLang,
    targetLang,
    options,
  };
}
