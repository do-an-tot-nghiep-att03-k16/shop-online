export default [
  'strapi::logger',
  'strapi::errors',
  // Custom security with cache control
  {
    name: 'strapi::security',
    config: {
      contentSecurityPolicy: {
        useDefaults: true,
        directives: {
          'connect-src': ["'self'", 'https:'],
          'img-src': [
            "'self'",
            'data:',
            'blob:',
            'https://cms.aristia.shop',
          ],
          'media-src': ["'self'", 'data:', 'blob:', 'https://cms.aristia.shop'],
          upgradeInsecureRequests: null,
        },
      },
    },
  },
  'strapi::cors',
  'strapi::poweredBy',
  'strapi::query',
  'strapi::body',
  'strapi::session',
  'strapi::favicon',
  // Custom public middleware with cache control
  {
    name: 'strapi::public',
    config: {
      defer: false,
      etag: true,
      // Cache static files (uploads) for 30 days
      maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days in milliseconds
    },
  },
  // Custom cache-control middleware for API responses
  'global::cache-control',
];
