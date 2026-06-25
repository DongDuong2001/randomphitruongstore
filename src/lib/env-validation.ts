export class EnvironmentValidationError extends Error {
  constructor(public readonly issues: string[]) {
    super([
      "Production environment validation failed.",
      ...issues.map((issue) => `- ${issue}`)
    ].join("\n"));
    this.name = "EnvironmentValidationError";
  }
}

type Environment = Record<string, string | undefined>;

type ConfiguredValueOptions = {
  minLength?: number;
  required?: boolean;
};

const weakOrPlaceholderValues = new Set([
  "change-this-password",
  "change-this-long-random-secret",
  "password",
  "postgres",
  "replace-with-a-long-random-admin-password",
  "replace-with-a-long-random-sandbox-secret",
  "secret",
  "shared-password",
  "test-secret",
  "your-admin-password",
  "your-anon-key",
  "your-service-role-key",
  "your-merchant-id",
  "your-merchant-secret-key",
  "the-x-secret-key-configured-in-sepay"
]);

const placeholderFragments = [
  "change-this",
  "replace-with",
  "your-",
  "placeholder"
];

const uploadDrivers = new Set(["local", "supabase"]);

const localDatabaseHosts = new Set([
  "localhost",
  "127.0.0.1",
  "0.0.0.0",
  "::1"
]);

export function validateRuntimeEnvironment(env: Environment = process.env) {
  if (env.NODE_ENV !== "production") return;

  const issues: string[] = [];

  addProductionDatabaseIssues(env.DATABASE_URL, issues);
  addUrlIssues("NEXT_PUBLIC_SITE_URL", env.NEXT_PUBLIC_SITE_URL, issues);
  addUrlIssues("NEXT_PUBLIC_SUPABASE_URL", env.NEXT_PUBLIC_SUPABASE_URL, issues);
  addConfiguredValueIssues("NEXT_PUBLIC_SUPABASE_ANON_KEY", env.NEXT_PUBLIC_SUPABASE_ANON_KEY, issues, {
    minLength: 20
  });
  addProductionUploadIssues(env, issues);

  if (env.SEPAY_ENVIRONMENT !== "production") {
    issues.push("SEPAY_ENVIRONMENT must be set to production when NODE_ENV=production.");
  }
  addConfiguredValueIssues("SEPAY_MERCHANT_ID", env.SEPAY_MERCHANT_ID, issues, {
    minLength: 3
  });
  addConfiguredValueIssues("SEPAY_MERCHANT_SECRET_KEY", env.SEPAY_MERCHANT_SECRET_KEY, issues, {
    minLength: 24
  });
  addConfiguredValueIssues("SEPAY_IPN_SECRET_KEY", env.SEPAY_IPN_SECRET_KEY, issues, {
    minLength: 32
  });

  if (env.ADMIN_BOOTSTRAP_PASSWORD) {
    addConfiguredValueIssues("ADMIN_BOOTSTRAP_PASSWORD", env.ADMIN_BOOTSTRAP_PASSWORD, issues, {
      minLength: 12
    });
  }

  if (env.SEPAY_SANDBOX_SECRET) {
    addConfiguredValueIssues("SEPAY_SANDBOX_SECRET", env.SEPAY_SANDBOX_SECRET, issues, {
      minLength: 32
    });
  }

  throwIfIssues(issues);
}

export function assertValidAdminBootstrapPassword(password: string) {
  const issues: string[] = [];
  addConfiguredValueIssues("ADMIN_BOOTSTRAP_PASSWORD", password, issues, {
    minLength: 12
  });
  throwIfIssues(issues);
}

export function assertProductionConfiguredValue(
  name: string,
  value: string | undefined,
  options: ConfiguredValueOptions = {},
  env: Environment = process.env
) {
  if (env.NODE_ENV !== "production") return;

  const issues: string[] = [];
  addConfiguredValueIssues(name, value, issues, options);
  throwIfIssues(issues);
}

function addProductionDatabaseIssues(value: string | undefined, issues: string[]) {
  addConfiguredValueIssues("DATABASE_URL", value, issues, { minLength: 1 });
  if (!value) return;

  let url: URL;
  try {
    url = new URL(value);
  } catch {
    issues.push("DATABASE_URL must be a valid PostgreSQL connection URL.");
    return;
  }

  if (url.protocol !== "postgresql:" && url.protocol !== "postgres:") {
    issues.push("DATABASE_URL must use the postgresql protocol.");
  }
  if (localDatabaseHosts.has(url.hostname)) {
    issues.push("DATABASE_URL must not point to a local database in production.");
  }
  if (!url.password) {
    issues.push("DATABASE_URL must include a database password in production.");
  } else {
    addConfiguredValueIssues("DATABASE_URL password", url.password, issues, {
      minLength: 12
    });
  }
}

function addUrlIssues(
  name: string,
  value: string | undefined,
  issues: string[]
) {
  addConfiguredValueIssues(name, value, issues, { minLength: 1 });
  if (!value) return;

  let url: URL;
  try {
    url = new URL(value);
  } catch {
    issues.push(`${name} must be a valid URL.`);
    return;
  }

  if (url.protocol !== "https:") {
    issues.push(`${name} must use HTTPS in production.`);
  }
  if (localDatabaseHosts.has(url.hostname)) {
    issues.push(`${name} must not point to localhost in production.`);
  }
}

function addProductionUploadIssues(env: Environment, issues: string[]) {
  const uploadDriver = env.UPLOAD_DRIVER?.trim() || "local";
  if (!uploadDrivers.has(uploadDriver)) {
    issues.push("UPLOAD_DRIVER must be either local or supabase.");
  }

  addConfiguredValueIssues(
    "SUPABASE_SERVICE_ROLE_KEY",
    env.SUPABASE_SERVICE_ROLE_KEY,
    issues,
    {
      minLength: 32,
      required: uploadDriver === "supabase"
    }
  );
}

function addConfiguredValueIssues(
  name: string,
  value: string | undefined,
  issues: string[],
  { minLength = 32, required = true }: ConfiguredValueOptions = {}
) {
  const trimmed = value?.trim() ?? "";
  if (!trimmed) {
    if (required) issues.push(`${name} is required.`);
    return;
  }

  if (trimmed.length < minLength) {
    issues.push(`${name} must be at least ${minLength} characters.`);
  }
  if (looksLikePlaceholder(trimmed)) {
    issues.push(`${name} must not use a default or placeholder value.`);
  }
}

function looksLikePlaceholder(value: string) {
  const normalized = value.trim().toLowerCase();
  return weakOrPlaceholderValues.has(normalized) ||
    placeholderFragments.some((fragment) => normalized.includes(fragment));
}

function throwIfIssues(issues: string[]) {
  if (issues.length > 0) {
    throw new EnvironmentValidationError(issues);
  }
}
