import createNextIntlPlugin from 'next-intl/plugin';

const withNextIntl = createNextIntlPlugin('../../packages/i18n/src/request.ts');

export default withNextIntl({ experimental: { serverActions: { bodySizeLimit: '12mb' } } });
