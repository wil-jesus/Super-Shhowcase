const CANONICAL_ORIGIN = "https://showcase-two-eosin.vercel.app";

// Alias showcase-yeshua3 e URLs de deploy showcase-<hash>-yeshua3; o domínio canônico não casa.
const NON_CANONICAL_HOST = "showcase(?:-[a-z0-9-]+)?-yeshua3\\.vercel\\.app";

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  async redirects() {
    // Previews também usam showcase-<hash>-yeshua3.vercel.app; só produção redireciona.
    if (process.env.VERCEL_ENV !== "production") return [];

    return [
      {
        source: "/:path*",
        has: [{ type: "host", value: NON_CANONICAL_HOST }],
        destination: `${CANONICAL_ORIGIN}/:path*`,
        permanent: true,
      },
    ];
  },
};

export default nextConfig;