export type AuthMode = "signin" | "signup" | "forgot";
export function parseAuthMode(value: unknown): AuthMode {
  return value === "signup" || value === "forgot" ? value : "signin";
}
/** Preserve SDK callback parameters; destinations are fixed internal routes. */
export function parseAuthSearch(input: Record<string, unknown>) {
  return {
    ...input,
    mode: parseAuthMode(input["mode"]),
    flow: input["flow"] === "welcome" ? ("welcome" as const) : undefined,
  };
}
