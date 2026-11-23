import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // tesseract.js starts a worker thread from its own folder, so it must stay outside the bundle.
  serverExternalPackages: ["@electric-sql/pglite", "tesseract.js"],
  // The free OCR engine reads its language data and WebAssembly core from node_modules at run time.
  outputFileTracingIncludes: {
    "/api/**/*": [
      "./node_modules/@tesseract.js-data/eng/4.0.0_best_int/**",
      "./node_modules/tesseract.js/**",
      "./node_modules/tesseract.js-core/**",
      "./public/brand/yenepoya-medical-college.png",
    ],
  },
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          { key: "X-Frame-Options", value: "DENY" },
          { key: "Content-Security-Policy", value: "frame-ancestors 'none'" },
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
        ],
      },
    ];
  },
};

export default nextConfig;
