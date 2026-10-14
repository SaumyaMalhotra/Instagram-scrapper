import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';
import { config } from './config.js';
import { configureSecurity } from './middleware/security.js';
import { requestLogger } from './middleware/logger.js';
import apiRouter from './routes/api.js';
import { errorHandler } from './middleware/errorHandler.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, '..');
const distPath = path.resolve(projectRoot, 'dist');

const app = express();

// 1. Logger
app.use(requestLogger);

// 2. Security headers, CORS, body parsers (50kb limit)
configureSecurity(app);

// 3. API Router
app.use('/api', apiRouter);

// 4. Production Static File Serving (Vite build)
const hasDistFolder = fs.existsSync(distPath);

if (config.isProduction || hasDistFolder) {
  app.use(express.static(distPath));

  // SPA fallback for frontend client routing
  app.get('*', (req, res, next) => {
    // If request starts with /api, pass to 404 / error handler
    if (req.path.startsWith('/api')) {
      return res.status(404).json({
        error: {
          code: 'not_found',
          message: `Endpoint ${req.path} not found.`
        }
      });
    }

    const indexPath = path.join(distPath, 'index.html');
    if (fs.existsSync(indexPath)) {
      res.sendFile(indexPath);
    } else {
      next();
    }
  });
} else {
  // Helpful route in development if visiting Express port directly
  app.get('/', (req, res) => {
    res.json({
      message: 'Instagram Scraper API Server is running.',
      environment: config.nodeEnv,
      frontendUrl: config.appOrigin,
      healthCheck: '/api/health'
    });
  });
}

// 5. Global Error Handler
app.use(errorHandler);

// Start server
app.listen(config.port, () => {
  console.log(`====================================================`);
  console.log(` Instagram Post Scraper Server started successfully`);
  console.log(` Environment : ${config.nodeEnv}`);
  console.log(` Listening on: http://localhost:${config.port}`);
  console.log(` Health check: http://localhost:${config.port}/api/health`);
  console.log(` Access Gate : ${config.hasAccessPassword ? 'ENABLED (Password Required)' : 'DISABLED (Public)'}`);
  console.log(` Concurrency : Up to ${config.maxConcurrentRuns} simultaneous runs`);
  console.log(` Max Posts   : Up to ${config.maxResultsPerProfile} posts per profile`);
  console.log(`====================================================`);
});
