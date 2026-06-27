const localUploadImagePattern = /^\/uploads\/[A-Za-z0-9][A-Za-z0-9._-]*\.(?:jpe?g|png|webp)$/i;
const supabaseUploadImagePattern = /^https:\/\/[a-z0-9-]+\.supabase\.co\/storage\/v1\/object\/public\/uploads\/[A-Za-z0-9][A-Za-z0-9._-]*\.(?:jpe?g|png|webp)$/i;

export function safeInquiryImageUrl(value: string | null | undefined) {
  const trimmed = value?.trim();
  if (!trimmed) return null;
  if (localUploadImagePattern.test(trimmed)) return trimmed;
  if (supabaseUploadImagePattern.test(trimmed)) return trimmed;
  return null;
}

export function safeInquiryLinkUrl(value: string | null | undefined) {
  const imageUrl = safeInquiryImageUrl(value);
  if (imageUrl) return imageUrl;

  try {
    const url = new URL(value ?? "");
    return url.protocol === "https:" ? url.toString() : null;
  } catch {
    return null;
  }
}

export function isSafeInquiryImageUrl(value: string | null | undefined) {
  return safeInquiryImageUrl(value) !== null;
}
