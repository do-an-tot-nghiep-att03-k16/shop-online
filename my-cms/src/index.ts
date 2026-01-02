import cron from 'node-cron';
import path from 'path';
import fs from 'fs';

export default {
  /**
   * An asynchronous register function that runs before
   * your application is initialized.
   *
   * This gives you an opportunity to extend code.
   */
  register(/* { strapi }: { strapi: Core.Strapi } */) {},

  /**
   * An asynchronous bootstrap function that runs before
   * your application gets started.
   *
   * This gives you an opportunity to set up your data model,
   * run jobs, or perform some special logic.
   */
  async bootstrap({ strapi }) {
    console.log('🚀 Strapi CMS Bootstrap started...');

    // Chỉ chạy cron job ở production
    if (process.env.NODE_ENV === 'production') {
      console.log('🔄 Starting backend sync scheduler...');

      // Import sync function
      const syncScriptPath = path.join(__dirname, '../scripts/sync-backend-data.js');
      
      if (fs.existsSync(syncScriptPath)) {
        try {
          const { syncAll } = require(syncScriptPath);

          // Schedule sync mỗi 2 giờ
          cron.schedule('0 */2 * * *', async () => {
            const now = new Date().toLocaleString('vi-VN');
            console.log(`\n⏰ [${now}] Scheduled backend sync triggered...`);
            
            try {
              await syncAll();
              console.log(`✅ [${now}] Backend sync completed successfully`);
            } catch (error) {
              console.error(`❌ [${now}] Backend sync failed:`, error.message);
              // Log to Strapi logger
              strapi.log.error('Backend sync failed:', error);
            }
          }, {
            scheduled: true,
            timezone: "Asia/Ho_Chi_Minh"
          });

          console.log('✅ Backend sync scheduler started (every 2 hours)');

          // Optional: Run initial sync khi CMS start
          if (process.env.SYNC_ON_START === 'true') {
            console.log('🚀 Running initial backend sync...');
            setTimeout(async () => {
              try {
                await syncAll();
                console.log('✅ Initial backend sync completed');
              } catch (error) {
                console.error('❌ Initial backend sync failed:', error.message);
              }
            }, 5000); // Đợi 5s để CMS khởi động xong
          }
        } catch (error) {
          console.error('❌ Failed to setup backend sync scheduler:', error);
        }
      } else {
        console.warn('⚠️  Sync script not found at:', syncScriptPath);
      }
    } else {
      console.log('ℹ️  Backend sync scheduler disabled (not in production mode)');
    }
  },
};
