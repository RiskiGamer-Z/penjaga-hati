import { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://penjaga-hati.vercel.app";
  
  return {
    rules: {
      userAgent: "*",
      allow: ["/", "/auth/login", "/auth/register", "/diagnose", "/booking"],
      disallow: ["/admin/", "/mitra/", "/owner/", "/user/", "/api/"],
    },
    sitemap: `${baseUrl}/sitemap.xml`,
  };
}
