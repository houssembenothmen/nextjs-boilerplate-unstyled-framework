import type { Metadata } from "next";

export interface PageMetadataInput {
  title: string;
  description?: string;
  /** Appended after `title`, e.g. "Users – Acme Admin". Default: undefined (no suffix). */
  siteName?: string;
  image?: string;
  noIndex?: boolean;
  path?: string;
  baseUrl?: string;
}

/** Builds a Next.js `Metadata` object (for `export const metadata` / `generateMetadata`) with sane OG/Twitter defaults. */
export function pageMetadata({ title, description, siteName, image, noIndex, path, baseUrl }: PageMetadataInput): Metadata {
  const fullTitle = siteName ? `${title} – ${siteName}` : title;
  const url = baseUrl && path ? new URL(path, baseUrl).toString() : undefined;
  return {
    title: fullTitle,
    description,
    robots: noIndex ? { index: false, follow: false } : undefined,
    alternates: url ? { canonical: url } : undefined,
    openGraph: { title: fullTitle, description, url, siteName, images: image ? [image] : undefined, type: "website" },
    twitter: { card: image ? "summary_large_image" : "summary", title: fullTitle, description, images: image ? [image] : undefined },
  };
}
