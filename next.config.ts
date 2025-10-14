/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'export',

  // Add this section to disable image optimization
  images: {
    unoptimized: true,
  },
};

module.exports = nextConfig;