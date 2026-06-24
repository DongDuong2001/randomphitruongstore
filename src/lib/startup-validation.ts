import { validateRuntimeEnvironment } from "@/lib/env-validation";

export function registerStartupValidation() {
  validateRuntimeEnvironment();
}
