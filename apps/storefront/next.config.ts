import createNextIntlPlugin from 'next-intl/plugin';

const withNextIntl = createNextIntlPlugin('../../packages/i18n/src/request.ts');

export default withNextIntl({
  async headers() {
    const dev = process.env.NODE_ENV !== 'production';
    const adminOrigin = process.env.NEXT_PUBLIC_ADMIN_URL
      ? new URL(process.env.NEXT_PUBLIC_ADMIN_URL).origin : 'http://localhost:3001';
    const baseCsp = `default-src 'self'; script-src 'self' 'unsafe-inline'${dev ? " 'unsafe-eval'" : ''}; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:${dev ? ' http:' : ''}; connect-src 'self' https: wss:${dev ? ' http: ws:' : ''}; object-src 'none'; base-uri 'self'`;
    const common = [
      { key: 'X-Content-Type-Options', value: 'nosniff' },
      { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
      { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=()' },
      ...(process.env.NODE_ENV === 'production' ? [{ key: 'Strict-Transport-Security', value: 'max-age=31536000; includeSubDomains' }] : []),
    ];
    return [
      { source: '/:path*', headers: common },
      { source: '/((?!preview).*)', headers: [{ key: 'Content-Security-Policy', value: `${baseCsp}; frame-ancestors 'none'; form-action 'self'` }] },
      { source: '/preview/:path*', headers: [{ key: 'Content-Security-Policy', value: `${baseCsp}; frame-ancestors 'self' ${adminOrigin}` }] },
    ];
  },
});
