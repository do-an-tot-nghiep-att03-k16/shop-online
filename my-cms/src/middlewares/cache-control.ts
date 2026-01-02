/**
 * Cache-Control middleware for API responses
 * Thêm Cache-Control headers cho các API endpoints
 */

export default (config, { strapi }) => {
  return async (ctx, next) => {
    await next();

    // Chỉ áp dụng cho GET requests
    if (ctx.method !== 'GET') {
      return;
    }

    const path = ctx.request.path;

    // Không cache admin routes
    if (path.startsWith('/admin')) {
      ctx.set('Cache-Control', 'no-store, no-cache, must-revalidate, private');
      return;
    }

    // Cache API responses
    if (path.startsWith('/api/')) {
      // Setting API - cache lâu nhất (24 hours)
      if (path.includes('/api/setting')) {
        ctx.set('Cache-Control', 'public, max-age=86400, s-maxage=86400'); // 24 hours
        ctx.set('Vary', 'Accept-Encoding');
        return;
      }

      // Home configuration - cache 2 hours
      if (path.includes('/api/home-configuration')) {
        ctx.set('Cache-Control', 'public, max-age=7200, s-maxage=7200'); // 2 hours
        ctx.set('Vary', 'Accept-Encoding');
        return;
      }

      // Blogs - cache 1 hour
      if (path.includes('/api/blog')) {
        ctx.set('Cache-Control', 'public, max-age=3600, s-maxage=3600'); // 1 hour
        ctx.set('Vary', 'Accept-Encoding');
        return;
      }

      // Categories - cache 4 hours
      if (path.includes('/api/categor')) {
        ctx.set('Cache-Control', 'public, max-age=14400, s-maxage=14400'); // 4 hours
        ctx.set('Vary', 'Accept-Encoding');
        return;
      }

      // Coupons - cache 30 minutes
      if (path.includes('/api/coupon')) {
        ctx.set('Cache-Control', 'public, max-age=1800, s-maxage=1800'); // 30 minutes
        ctx.set('Vary', 'Accept-Encoding');
        return;
      }

      // Default cho các API khác - cache 10 minutes
      ctx.set('Cache-Control', 'public, max-age=600, s-maxage=600');
      ctx.set('Vary', 'Accept-Encoding');
      return;
    }

    // Uploads (images, files) - cache 30 days
    if (path.startsWith('/uploads/')) {
      ctx.set('Cache-Control', 'public, max-age=2592000, immutable'); // 30 days
      ctx.set('Vary', 'Accept-Encoding');
      return;
    }
  };
};
