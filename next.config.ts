import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  webpack(config) {
    // Add a new rule for SVGR
    config.module.rules.push({
      test: /\.svg$/i,
      use: [{ loader: '@svgr/webpack', options: { icon: true } }],
    });

    return config;
  },
  
  // Turbo pack configuration for handling SVG files with SVGR
  turbopack: {
    rules: {
      '*.svg': {
        loaders: [
          {
            loader: '@svgr/webpack',
            options: { icon: true },
          },
        ],
        as: '*.js',
      },
    },
  },
};


export default nextConfig;
