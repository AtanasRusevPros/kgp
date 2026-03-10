import { createApp } from './app.js';
import { config } from './config.js';
import { registerShutdownHandlers } from './server-lifecycle.js';

const app = await createApp();
registerShutdownHandlers(app);

try {
  await app.listen({ port: config.port, host: '0.0.0.0' });
  console.log(`API server listening on port ${config.port}`);
} catch (err) {
  app.log.error(err);
  process.exit(1);
}
