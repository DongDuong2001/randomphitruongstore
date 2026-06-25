import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  assertValidAdminBootstrapPassword,
  EnvironmentValidationError,
  validateRuntimeEnvironment
} from "../src/lib/env-validation";
import {
  sePayConfigFromEnvironment,
  sePayIpnSecretFromEnvironment
} from "../src/lib/sepay";
import { registerStartupValidation } from "../src/lib/startup-validation";

describe("production environment validation", () => {
  it("does not block local development placeholders outside production", () => {
    assert.doesNotThrow(() => validateRuntimeEnvironment({ NODE_ENV: "development" }));
  });

  it("rejects production placeholder and weak values at startup", () => {
    assert.throws(
      () => validateRuntimeEnvironment({
        NODE_ENV: "production",
        DATABASE_URL: "postgresql://postgres:postgres@localhost:5432/app",
        NEXT_PUBLIC_SITE_URL: "http://localhost:3000",
        NEXT_PUBLIC_SUPABASE_URL: "https://your-project-ref.supabase.co",
        NEXT_PUBLIC_SUPABASE_ANON_KEY: "your-anon-key",
        SEPAY_ENVIRONMENT: "sandbox",
        SEPAY_MERCHANT_ID: "your-merchant-id",
        SEPAY_MERCHANT_SECRET_KEY: "your-merchant-secret-key",
        SEPAY_IPN_SECRET_KEY: "the-X-Secret-Key-configured-in-SePay",
        ADMIN_BOOTSTRAP_PASSWORD: "change-this-password"
      }),
      (error: unknown) => {
        assert.ok(error instanceof EnvironmentValidationError);
        assert.match(error.message, /DATABASE_URL must not point to a local database/);
        assert.match(error.message, /SEPAY_ENVIRONMENT must be set to production/);
        assert.match(error.message, /ADMIN_BOOTSTRAP_PASSWORD must not use/);
        assert.equal(error.message.includes("postgresql://postgres:postgres"), false);
        return true;
      }
    );
  });

  it("accepts the production shape required by the app runtime", () => {
    assert.doesNotThrow(() => validateRuntimeEnvironment(validProductionEnv()));
  });

  it("rejects replace-with placeholders copied from the example env", () => {
    assert.throws(
      () => validateRuntimeEnvironment(validProductionEnv({
        ADMIN_BOOTSTRAP_PASSWORD: "replace-with-a-long-random-admin-password",
        SEPAY_SANDBOX_SECRET: "replace-with-a-long-random-sandbox-secret"
      })),
      (error: unknown) => {
        assert.ok(error instanceof EnvironmentValidationError);
        assert.match(error.message, /ADMIN_BOOTSTRAP_PASSWORD must not use/);
        assert.match(error.message, /SEPAY_SANDBOX_SECRET must not use/);
        return true;
      }
    );
  });

  it("validates the Supabase service role key used by upload storage", () => {
    assert.throws(
      () => validateRuntimeEnvironment(validProductionEnv({
        UPLOAD_DRIVER: "supabase",
        SUPABASE_SERVICE_ROLE_KEY: "your-service-role-key"
      })),
      (error: unknown) => {
        assert.ok(error instanceof EnvironmentValidationError);
        assert.match(error.message, /SUPABASE_SERVICE_ROLE_KEY must be at least 32/);
        assert.match(error.message, /SUPABASE_SERVICE_ROLE_KEY must not use/);
        return true;
      }
    );

    assert.throws(
      () => validateRuntimeEnvironment(validProductionEnv({
        UPLOAD_DRIVER: "supabase"
      })),
      /SUPABASE_SERVICE_ROLE_KEY is required/
    );

    assert.doesNotThrow(() => validateRuntimeEnvironment(validProductionEnv({
      UPLOAD_DRIVER: "supabase",
      SUPABASE_SERVICE_ROLE_KEY: "supabase-service-role-live-key-32-chars"
    })));
  });

  it("is exposed through the startup validation entry point used by instrumentation", () => {
    withEnv(
      {
        NODE_ENV: "production",
        DATABASE_URL: "postgresql://postgres:postgres@localhost:5432/app",
        NEXT_PUBLIC_SITE_URL: "http://localhost:3000",
        NEXT_PUBLIC_SUPABASE_URL: "https://your-project-ref.supabase.co",
        NEXT_PUBLIC_SUPABASE_ANON_KEY: "your-anon-key",
        SEPAY_ENVIRONMENT: "sandbox"
      },
      () => {
        assert.throws(() => registerStartupValidation(), EnvironmentValidationError);
      }
    );
  });

  it("validates the bootstrap admin password before seeding an admin account", () => {
    assert.throws(
      () => assertValidAdminBootstrapPassword("change-this-password"),
      EnvironmentValidationError
    );
    assert.doesNotThrow(() =>
      assertValidAdminBootstrapPassword("CorrectHorseBatteryStaple42")
    );
  });

  it("requires a dedicated strong SePay IPN secret in production", () => {
    withEnv(validProductionEnv({ SEPAY_IPN_SECRET_KEY: "short-ipn-secret" }), () => {
      assert.throws(() => sePayIpnSecretFromEnvironment(), EnvironmentValidationError);
    });

    withEnv(validProductionEnv(), () => {
      assert.equal(
        sePayConfigFromEnvironment().environment,
        "production"
      );
      assert.equal(
        sePayIpnSecretFromEnvironment(),
        validProductionEnv().SEPAY_IPN_SECRET_KEY
      );
    });
  });
});

function validProductionEnv(
  overrides: Record<string, string | undefined> = {}
): Record<string, string | undefined> {
  return {
    NODE_ENV: "production",
    DATABASE_URL:
      "postgresql://app_user:CorrectHorseBatteryStaple42@db.randomphitruong.vn:5432/store?schema=public",
    NEXT_PUBLIC_SITE_URL: "https://randomphitruong.vn",
    NEXT_PUBLIC_SUPABASE_URL: "https://abcxyzproject.supabase.co",
    NEXT_PUBLIC_SUPABASE_ANON_KEY:
      "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.public-anon-key-value",
    SEPAY_ENVIRONMENT: "production",
    SEPAY_MERCHANT_ID: "merchant-live-123",
    SEPAY_MERCHANT_SECRET_KEY: "merchant-live-secret-value-32-chars",
    SEPAY_IPN_SECRET_KEY: "ipn-live-secret-value-with-32-chars",
    ...overrides
  };
}

function withEnv(values: Record<string, string | undefined>, test: () => void) {
  const previous = new Map(
    Object.keys(values).map((key) => [key, process.env[key]])
  );

  try {
    for (const [key, value] of Object.entries(values)) {
      if (value === undefined) {
        delete process.env[key];
      } else {
        process.env[key] = value;
      }
    }
    test();
  } finally {
    for (const [key, value] of previous) {
      if (value === undefined) {
        delete process.env[key];
      } else {
        process.env[key] = value;
      }
    }
  }
}
