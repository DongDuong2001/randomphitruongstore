import { err, handlePrismaError, ok } from "@/lib/api-response";
import { isAdminAuthenticated } from "@/lib/admin-auth";
import {
  CurrencySettingsError,
  getCurrencySettings,
  updateCurrencySettings
} from "@/lib/currency-settings";

export async function GET() {
  if (!(await isAdminAuthenticated())) {
    return err("Unauthorized", 401);
  }

  try {
    return ok(await getCurrencySettings());
  } catch (error) {
    return handlePrismaError(error);
  }
}

export async function PATCH(request: Request) {
  if (!(await isAdminAuthenticated())) {
    return err("Unauthorized", 401);
  }

  try {
    const settings = await updateCurrencySettings({
      input: await request.json()
    });
    return ok(settings);
  } catch (error) {
    if (error instanceof SyntaxError) {
      return err("Invalid JSON payload", 400);
    }
    if (error instanceof CurrencySettingsError) {
      return err(error.message, 400, error.details);
    }
    return handlePrismaError(error);
  }
}
