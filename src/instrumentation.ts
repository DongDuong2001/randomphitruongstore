import { registerStartupValidation } from "@/lib/startup-validation";

export function register() {
  try {
    registerStartupValidation();
  } catch (error) {
    if (process.env.NODE_ENV === "production") {
      console.error(error instanceof Error
        ? error.message
        : "Production environment validation failed.");
      exitProcess(1);
    }
    throw error;
  }
}

function exitProcess(code: number): never {
  const nodeProcess = (globalThis as {
    process?: { exit?: (code?: number) => never };
  }).process;

  if (typeof nodeProcess?.exit === "function") {
    nodeProcess.exit(code);
  }

  throw new Error("Production environment validation failed.");
}
