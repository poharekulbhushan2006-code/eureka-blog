import { createApp } from './app.js';

const PORT = process.env.PORT || 3000;
const app = createApp();

const server = app.listen(PORT, () => {
  console.log(`\n======================================================`);
  console.log(`  Eureka Blog — Swiss Modernism 2.0 Editorial Platform`);
  console.log(`  Running at: http://localhost:${PORT}`);
  console.log(`  Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`======================================================\n`);
});

// Graceful Shutdown
const gracefulShutdown = (signal) => {
  console.log(`\nReceived ${signal}. Shutting down Eureka Blog gracefully...`);
  server.close(() => {
    console.log('HTTP server closed. Exiting process.');
    process.exit(0);
  });

  setTimeout(() => {
    console.error('Forcing shutdown after 5s timeout.');
    process.exit(1);
  }, 5000);
};

process.on('SIGINT', () => gracefulShutdown('SIGINT'));
process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
