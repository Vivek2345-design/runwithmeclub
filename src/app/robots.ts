import type { MetadataRoute } from "next";
import { env } from "@/lib/env";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: { userAgent: "*", allow: "/", disallow: ["/api/", "/admin", "/dashboard", "/activities", "/plan", "/calendar", "/my-events", "/challenges", "/goals", "/records", "/community", "/profile", "/login", "/signup"] },
    sitemap: `${env.appUrl}/sitemap.xml`,
  };
}
