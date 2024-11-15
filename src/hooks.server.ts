import { startScheduler } from './scheduler';
import { startWorker } from './workers/worker';

const onStartup = () => {
  if (process.env.NODE_ENV !== 'build') {
    console.log('🚀 Server started');
    startScheduler();

    startWorker();
  }
};
onStartup();
