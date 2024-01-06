const PARTYKIT_HOST = process.env.NEXT_PUBLIC_PARTYKIT_HOST || '127.0.0.1:1999'
const PARTYKIT_PROTOCOL =
  PARTYKIT_HOST?.startsWith('localhost') ||
  PARTYKIT_HOST?.startsWith('127.0.0.1')
    ? 'http'
    : 'https'
const PARTYKIT_URL = `${PARTYKIT_PROTOCOL}://${PARTYKIT_HOST}`

/** @type {import('next').NextConfig} */
module.exports = {
  reactStrictMode: true,
  basePath: '/talk',
  experimental: {
    serverActions: true
  },
  webpack: (config, { isServer }) => {
    if (!isServer) {
      config.externals.push({ bufferutil: "bufferutil", "utf-8-validate": "utf-8-validate", "supports-color": "supports-color" }); 
    }

    return config;
  },
  rewrites: async () => [
    {
      // forward room authentication request to partykit
      source: '/chat/:roomId/auth',
      // include connection id in the query
      has: [{ type: 'query', key: '_pk', value: '(?<pk>.*)' }],
      destination: PARTYKIT_URL + '/parties/chat/:roomId/auth?_pk=:pk'
    }
  ],
  images: {
    domains: ['localhost', 'avatars.githubusercontent.com', 'pbs.twimg.com'],
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**.githubusercontent.com'
      }
    ]
  },
  async redirects() {
    return [
      {
        source: '/',
        destination: '/talk',
        basePath: false,
        permanent: false
      },
      {
        source: '/sign-in',
        destination: '/talk/sign-in',
        basePath: false,
        permanent: false
      }
    ]
  }
}
