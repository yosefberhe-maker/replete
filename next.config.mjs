/** @type {import('next').NextConfig} */
const nextConfig = {
  async redirects() {
    return [
      {
        source: "/r/:code",
        destination: "/results/:code",
        permanent: true,
      },
    ];
  },
};

export default nextConfig;
