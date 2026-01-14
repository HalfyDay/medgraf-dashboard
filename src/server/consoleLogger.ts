type ConsoleMethod = (...args: unknown[]) => void;

const globalKey = Symbol.for("medgraf.consoleLogger.initialized");

function sanitizeLine(input: string): string {
  return input.replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g, " ");
}

function stripAnsi(input: string): string {
  return input
    .replace(/\u001b\[[0-?]*[ -/]*[@-~]/g, "")
    .replace(/\[(?:\d{1,3};?)*m/g, "");
}

function formatArg(arg: unknown, inspect: (value: unknown) => string): string {
  if (arg instanceof Error) {
    return arg.stack || arg.message;
  }
  if (typeof arg === "string") {
    return arg;
  }
  return inspect(arg);
}

type WriteLine = (level: string, args: unknown[]) => void;

async function createLogWriter(logFile: string): Promise<WriteLine> {
  const fs = await import("node:fs");
  const path = await import("node:path");
  const util = await import("node:util");
  const inspect = (value: unknown) => util.inspect(value, { depth: 5, breakLength: 120 });

  const logDir = path.dirname(logFile);
  fs.mkdirSync(logDir, { recursive: true });
  const stream = fs.createWriteStream(logFile, { flags: "a" });

  return (level: string, args: unknown[]) => {
    const rendered = args.map((arg) => formatArg(arg, inspect)).join(" ");
    const cleaned = sanitizeLine(stripAnsi(rendered));
    const line = `${new Date().toISOString()} ${level} ${cleaned}`;
    stream.write(`${line}\n`);
  };
}

export function setupConsoleFileLogging() {
  const g = globalThis as { [globalKey]?: boolean };
  if (g[globalKey]) {
    return;
  }
  g[globalKey] = true;

  const logFile = process.env.LOG_FILE || "logs/app.log";
  const writeLinePromise = createLogWriter(logFile);

  const original: Record<string, ConsoleMethod> = {
    log: console.log.bind(console),
    info: console.info.bind(console),
    warn: console.warn.bind(console),
    error: console.error.bind(console),
    debug: (console.debug || console.log).bind(console),
  };

  console.log = (...args: unknown[]) => {
    original.log(...args);
    writeLinePromise.then((writeLine) => writeLine("INFO", args));
  };
  console.info = (...args: unknown[]) => {
    original.info(...args);
    writeLinePromise.then((writeLine) => writeLine("INFO", args));
  };
  console.warn = (...args: unknown[]) => {
    original.warn(...args);
    writeLinePromise.then((writeLine) => writeLine("WARN", args));
  };
  console.error = (...args: unknown[]) => {
    original.error(...args);
    writeLinePromise.then((writeLine) => writeLine("ERROR", args));
  };
  console.debug = (...args: unknown[]) => {
    original.debug(...args);
    writeLinePromise.then((writeLine) => writeLine("DEBUG", args));
  };
}
