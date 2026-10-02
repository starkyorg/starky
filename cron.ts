import { refreshDiscordServer } from './discord';
import { networks } from './configs/networks.json';
import { starkyModules } from './configs/modules.json';
import { logger } from './utils/logger';

export async function runCronJobs() {
  logger.info('Starting scheduled cron jobs...');
  try {
    await refreshDiscordServer();
    logger.info('Cron jobs completed successfully.');
  } catch (error) {
    logger.error('Error executing cron jobs:', error);
  }
}

export async function refreshDiscordServer() {
  try {
    // Fetch all user configurations (assuming a getUserConfigs function exists)
    const userConfigs = await getUserConfigs();
    
    const configsToRefresh = userConfigs.filter(config => {
      const module = starkyModules.find(m => m.id === config.moduleId);
      const network = networks.find(n => n.id === config.networkId);

      if (!module || !network) {
        logger.warn(`Skipping config ${config.id}: Module or Network not found.`);
        return false;
      }

      // Dual-condition check: both module and network must have cron enabled
      const shouldRefresh = module.refreshInCron === true && network.cron === true;
      
      return shouldRefresh;
    });

    logger.info(`Found ${configsToRefresh.length} configurations to refresh based on dual-condition cron settings.`);

    for (const config of configsToRefresh) {
      try {
        await refreshConfig(config);
      } catch (err) {
        logger.error(`Failed to refresh config ${config.id}:`, err);
      }
    }
  } catch (error) {
    logger.error('Error in refreshDiscordServer cron task:', error);
    throw error;
  }
}

// Mock functions for context - these would be imported from actual services
async function getUserConfigs() { return []; }
async function refreshConfig(config: any) { return; }
