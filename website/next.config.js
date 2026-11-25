/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  async redirects() {
    return [
      {
        source: "/",
        destination: "/v4",
        permanent: false,
      },
      {
        source: "/changelog",
        destination: "/v4/changelog/1",
        permanent: false,
      },
      {
        source: "/commit/:sha",
        destination: "/v3/commit/:sha",
        permanent: false,
      },
      {
        source: "/def/:name",
        destination: "/v3/def/:name",
        permanent: false,
      },
      {
        source: "/inductive/:name",
        destination: "/v3/inductive/:name",
        permanent: false,
      },
      {
        source: "/structure/:name",
        destination: "/v3/structure/:name",
        permanent: false,
      },
      {
        source: "/theorem/:name",
        destination: "/v3/theorem/:name",
        permanent: false,
      },
      {
        source: "/changelog/:page",
        destination: "/v3/changelog/:page",
        permanent: false,
      },
    ];
  },
};

module.exports = nextConfig;
