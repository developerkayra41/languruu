const createNextIntlPlugin = require("next-intl/plugin");
const createMDX = require("@next/mdx");

const withNextIntl = createNextIntlPlugin("./app/i18n/request.ts");
const withMDX = createMDX({});

const nextConfig = {
  pageExtensions: ["ts", "tsx", "js", "jsx", "md", "mdx"],
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "**.supabase.co",
      },
      {
        protocol: "https",
        hostname: "lh3.googleusercontent.com",
      },
      {
        protocol: "https",
        hostname: "flagsapi.com",
      },
    ],
  },
};

module.exports = withNextIntl(withMDX(nextConfig));
