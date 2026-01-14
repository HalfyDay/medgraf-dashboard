export const runtime = "nodejs";

export async function register() {
  if (process.env.NEXT_RUNTIME === "edge") {
    return;
  }
  const { setupConsoleFileLogging } = await import("@/server/consoleLogger");
  setupConsoleFileLogging();
}
