import { startScheduler } from './scheduler';
import { startWorkers } from './lib/server/queue/workers';

const onStartup = () => {
  if (process.env.NODE_ENV !== 'build') {
    console.log('🚀 Server started');
    startScheduler();

    startWorkers();
  }
};
onStartup();
