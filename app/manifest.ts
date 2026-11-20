import type { MetadataRoute } from "next";
import { programme } from "@/lib/programme";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: `${programme.title} · Yenepoya CRE`,
    short_name: "Beyond Diagnosis",
    description: programme.aim,
    start_url: "/",
    scope: "/",
    display: "standalone",
    background_color: "#ffffff",
    theme_color: "#0c2340",
    icons: [
      { src: "/icons/icon-192.png", sizes: "192x192", type: "image/png", purpose: "any" },
      { src: "/icons/icon-512.png", sizes: "512x512", type: "image/png", purpose: "any" },
      { src: "/icons/icon-maskable-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
  };
}
