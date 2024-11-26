import { type ConnectionOptions, Worker } from 'bullmq';
import { config as dotenvConfig } from 'dotenv';

dotenvConfig();

export function startWorker() {
  const connection: ConnectionOptions = {
    host: process.env.REDIS_HOST ?? 'localhost',
    port: Number(process.env.REDIS_PORT) ?? 6379,
    password: process.env.REDIS_PASSWORD ?? ''
  };

  const worker = new Worker(
    'test',
    async (job) => {
      console.log('job ran', job.id);
    },
    { connection }
  );

  worker.on('completed', (job) => {
    console.log(job.id);
  });
}
