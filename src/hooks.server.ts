import { startScheduler } from './lib/server/scheduler';
import { startWorkers } from './lib/server/queue/workers';
import config from '@/config';

const onStartup = () => {
  if (config.app.env !== 'build') {
    console.log('🚀 Server started');
    startScheduler();

    startWorkers();
  }
};
onStartup();
