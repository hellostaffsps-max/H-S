/**
 * file-security.ts
 * Centralized, type-safe file upload security utilities.
 * Used across all file upload points in the application.
 */

// ─── Allowed MIME types per category ───────────────────────────────────────

export const ALLOWED_IMAGE_TYPES: readonly string[] = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
];

export const ALLOWED_CV_TYPES: readonly string[] = [
  "application/pdf",
];

export const ALLOWED_RECEIPT_TYPES: readonly string[] = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "application/pdf",
];

// ─── File size limits (bytes) ───────────────────────────────────────────────

export const MAX_AVATAR_SIZE    = 3 * 1024 * 1024;   // 3 MB
export const MAX_IMAGE_SIZE     = 5 * 1024 * 1024;   // 5 MB
export const MAX_CV_SIZE        = 5 * 1024 * 1024;   // 5 MB
export const MAX_RECEIPT_SIZE   = 5 * 1024 * 1024;   // 5 MB

// ─── Arabic display names ───────────────────────────────────────────────────

const HUMAN_READABLE: Record<string, string> = {
  "image/jpeg":       "JPG",
  "image/png":        "PNG",
  "image/webp":       "WebP",
  "image/gif":        "GIF",
  "application/pdf":  "PDF",
};

function formatBytes(bytes: number): string {
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} كيلوبايت`;
  return `${(bytes / (1024 * 1024)).toFixed(0)} ميجابايت`;
}

// ─── Core validator ─────────────────────────────────────────────────────────

export interface FileValidationResult {
  valid: boolean;
  error?: string;
}

/**
 * Validates a file against allowed MIME types and maximum size.
 *
 * @param file         - The File object to validate.
 * @param allowedTypes - Array of allowed MIME type strings.
 * @param maxBytes     - Maximum allowed file size in bytes.
 * @returns            { valid: true } or { valid: false, error: "Arabic message" }
 */
export function validateFile(
  file: File,
  allowedTypes: readonly string[],
  maxBytes: number
): FileValidationResult {
  // 1. MIME type check (client-side)
  if (!allowedTypes.includes(file.type)) {
    const readable = allowedTypes
      .map((t) => HUMAN_READABLE[t] ?? t)
      .join("، ");
    return {
      valid: false,
      error: `نوع الملف غير مدعوم. الصيغ المسموحة هي: ${readable} فقط.`,
    };
  }

  // 2. File extension double-check (guards against spoofed MIME types)
  const ext = file.name.split(".").pop()?.toLowerCase() ?? "";
  const allowedExtensions = allowedTypes.flatMap((t) => {
    switch (t) {
      case "image/jpeg": return ["jpg", "jpeg"];
      case "image/png":  return ["png"];
      case "image/webp": return ["webp"];
      case "image/gif":  return ["gif"];
      case "application/pdf": return ["pdf"];
      default: return [];
    }
  });

  if (!allowedExtensions.includes(ext)) {
    const readable = allowedTypes
      .map((t) => HUMAN_READABLE[t] ?? t)
      .join("، ");
    return {
      valid: false,
      error: `امتداد الملف (.${ext}) غير مدعوم. الصيغ المسموحة هي: ${readable} فقط.`,
    };
  }

  // 3. File size check
  if (file.size > maxBytes) {
    return {
      valid: false,
      error: `حجم الملف (${formatBytes(file.size)}) يتجاوز الحد المسموح (${formatBytes(maxBytes)}).`,
    };
  }

  // 4. Zero-byte / empty file check
  if (file.size === 0) {
    return { valid: false, error: "الملف فارغ أو تالف. يرجى اختيار ملف آخر." };
  }

  return { valid: true };
}

// ─── Convenience wrappers ───────────────────────────────────────────────────

export const validateImageFile   = (f: File) => validateFile(f, ALLOWED_IMAGE_TYPES,   MAX_IMAGE_SIZE);
export const validateAvatarFile  = (f: File) => validateFile(f, ALLOWED_IMAGE_TYPES,   MAX_AVATAR_SIZE);
export const validateCVFile      = (f: File) => validateFile(f, ALLOWED_CV_TYPES,       MAX_CV_SIZE);
export const validateReceiptFile = (f: File) => validateFile(f, ALLOWED_RECEIPT_TYPES,  MAX_RECEIPT_SIZE);
