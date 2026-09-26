import type { MetadataRoute } from "next";

const base = process.env.NEXT_PUBLIC_SITE_URL ?? "https://ajan-atolyesi.dev";

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();
  const pages = [
    "",
    "/egitim",
    "/danismanlik",
    "/saatlik",
    "/yontem",
    "/sikca-sorulanlar",
    "/iletisim",
    "/kosullar",
  ];
  return pages.map((path) => ({
    url: `${base}${path}`,
    lastModified: now,
    changeFrequency: path === "" ? "weekly" : "monthly",
    priority: path === "" ? 1 : 0.7,
  }));
}
