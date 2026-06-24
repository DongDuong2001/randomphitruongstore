export const genericRegistrationMessage =
  "If registration is available for this email, you will receive account instructions.";

export function registrationClientResult({
  user,
  error
}: {
  user: unknown;
  error: { message?: string } | null;
}) {
  return {
    status: 201,
    body: {
      user: error ? null : user,
      message: genericRegistrationMessage
    }
  };
}
