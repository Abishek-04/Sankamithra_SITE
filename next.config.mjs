/** @type {import('next').NextConfig} */
const nextConfig = {
  /* Fully static output — every route is pre-rendered HTML, deployable to the
     same static host the old site used. No Node server, no runtime fetch. */
  output: "export",


  /* Static hosts serve /products/ as /products/index.html */
  trailingSlash: true,

  /* dev only: Next 16 blocks /_next/* from a non-canonical origin,
     which breaks HMR when you browse via 127.0.0.1 instead of localhost */
  allowedDevOrigins: ["127.0.0.1"],

  compress: true,
  poweredByHeader: false,
  reactStrictMode: true,

  /* CSS stays external: one file cached across all 97 pages beats inlining
     ~70 KB into every document. */
};

export default nextConfig;
