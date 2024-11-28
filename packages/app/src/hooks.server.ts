import { startScheduler } from './lib/server/scheduler';
import config from '@/config';

const onStartup = () => {
  if (config.app.env !== 'build') {
    console.log('🚀 Server started');
    startScheduler();
  }
};
onStartup();
