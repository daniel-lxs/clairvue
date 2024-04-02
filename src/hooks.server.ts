import { startScheduler } from './scheduler';

const onStartup = () => {
  console.log('🚀 Server started');
  startScheduler();
};
onStartup();
