/** @type {import('next').NextConfig} */
const nextConfig = {
  // Allow ngrok HTTPS tunnel during local MiniPay testing
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          { key: "Access-Control-Allow-Origin", value: "*" },
        ],
      },
    ];
  },
};

export default nextConfig;
