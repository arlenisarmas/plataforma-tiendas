import createNextIntlPlugin from 'next-intl/plugin';

const withNextIntl = createNextIntlPlugin('../../packages/i18n/src/request.ts');

export default withNextIntl({
  async headers() {
    const common = [
      { key: 'X-Content-Type-Options', value: 'nosniff' },
      { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
      { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=()' },
      ...(process.env.NODE_ENV === 'production' ? [{ key: 'Strict-Transport-Security', value: 'max-age=31536000; includeSubDomains' }] : []),
    ];
    return [
      { source: '/:path*', headers: common },
      { source: '/((?!preview).*)', headers: [{ key: 'Content-Security-Policy', value: "default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; connect-src 'self' https: wss:; frame-ancestors 'none'; object-src 'none'; base-uri 'self'; form-action 'self'" }] },
      { source: '/preview/:path*', headers: [{ key: 'Content-Security-Policy', value: "default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; connect-src 'self' https: wss:; frame-ancestors 'self'; object-src 'none'; base-uri 'self'" }] },
    ];
  },
});
