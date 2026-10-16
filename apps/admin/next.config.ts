import createNextIntlPlugin from 'next-intl/plugin';

const withNextIntl = createNextIntlPlugin('../../packages/i18n/src/request.ts');

export default withNextIntl({
  experimental: { serverActions: { bodySizeLimit: '12mb' } },
  async headers() {
    const dev = process.env.NODE_ENV !== 'production';
    return [{ source: '/:path*', headers: [
      { key: 'Content-Security-Policy', value: `default-src 'self'; script-src 'self' 'unsafe-inline'${dev ? " 'unsafe-eval'" : ''}; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:${dev ? ' http:' : ''}; connect-src 'self' https: wss:${dev ? ' http: ws:' : ''}; frame-ancestors 'none'; object-src 'none'; base-uri 'self'; form-action 'self'` },
      { key: 'X-Content-Type-Options', value: 'nosniff' },
      { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
      { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=()' },
      ...(process.env.NODE_ENV === 'production' ? [{ key: 'Strict-Transport-Security', value: 'max-age=31536000; includeSubDomains' }] : []),
    ] }];
  },
});
