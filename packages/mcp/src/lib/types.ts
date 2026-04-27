/**
 * Shared MCP tool types
 */

export interface ToolResult {
  content: Array<{ type: "text"; text: string }>;
  isError?: boolean;
  [key: string]: unknown;
}

export interface BaseToolOptions {
  registry?: import("@dialectos/providers").ProviderRegistry;
  rateLimiter?: import("@dialectos/security").RateLimiter;
}
