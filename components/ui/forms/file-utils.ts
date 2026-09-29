export type FileRejectionReason = "file-invalid-type" | "file-too-large" | "file-too-small" | "too-many-files";

export interface FileRejection {
  file: File;
  reasons: FileRejectionReason[];
}

export interface FileConstraints {
  /** Same syntax as <input accept>: "image/*,.pdf,application/json" */
  accept?: string;
  maxSize?: number;
  minSize?: number;
  multiple?: boolean;
  maxFiles?: number;
}

export function matchesAccept(file: File, accept?: string): boolean {
  if (!accept) return true;
  const rules = accept.split(",").map((r) => r.trim().toLowerCase()).filter(Boolean);
  if (rules.length === 0) return true;
  const name = file.name.toLowerCase();
  const type = file.type.toLowerCase();
  return rules.some((rule) => {
    if (rule.startsWith(".")) return name.endsWith(rule);
    if (rule.endsWith("/*")) return type.startsWith(rule.slice(0, -1));
    return type === rule;
  });
}

export function validateFiles(files: File[], c: FileConstraints = {}) {
  const limit = c.multiple === false ? 1 : (c.maxFiles ?? Infinity);
  const accepted: File[] = [];
  const rejected: FileRejection[] = [];

  for (const file of files) {
    const reasons: FileRejectionReason[] = [];
    if (!matchesAccept(file, c.accept)) reasons.push("file-invalid-type");
    if (c.maxSize !== undefined && file.size > c.maxSize) reasons.push("file-too-large");
    if (c.minSize !== undefined && file.size < c.minSize) reasons.push("file-too-small");
    if (reasons.length === 0 && accepted.length >= limit) reasons.push("too-many-files");
    if (reasons.length) rejected.push({ file, reasons });
    else accepted.push(file);
  }
  return { accepted, rejected };
}

/** Programmatically set an <input type=file>'s files (so forms submit them). */
export function setInputFiles(input: HTMLInputElement | null, files: File[]) {
  if (!input || typeof DataTransfer === "undefined") return;
  try {
    const dt = new DataTransfer();
    files.forEach((f) => dt.items.add(f));
    input.files = dt.files;
  } catch {
    /* unsupported browser: ignore */
  }
}
