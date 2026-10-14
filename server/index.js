import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';
import { config } from './config.js';
import { configureSecurity } from './middleware/security.js';
import { requestLogger } from './middleware/logger.js';
import apiRouter from './routes/api.js';
import { errorHandler } from './middleware/errorHandler.js';
import { serveSeoFiles, injectSeoIntoHtml } from './services/seoMiddleware.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, '..');
const distPath = path.resolve(projectRoot, 'dist');
const rootIndexPath = path.resolve(projectRoot, 'index.html');

const app = express();

// 1. Logger
app.use(requestLogger);

// 2. Security headers, CORS, body parsers (50kb limit)
configureSecurity(app);

// 3. Technical SEO Static Handlers (sitemap.xml, robots.txt, Google verification)
app.use(serveSeoFiles);

// 4. API Router
app.use('/api', apiRouter);

// 5. Production Static File Serving & SEO-Injected SPA Fallback
const hasDistFolder = fs.existsSync(distPath);

if (config.isProduction || hasDistFolder) {
  app.use(express.static(distPath));

  // SPA fallback for frontend client routing with Dynamic SEO Head Injection
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
    const targetIndex = fs.existsSync(indexPath) ? indexPath : rootIndexPath;

    if (fs.existsSync(targetIndex)) {
      try {
        const rawHtml = fs.readFileSync(targetIndex, 'utf8');
        const enrichedHtml = injectSeoIntoHtml(rawHtml, req.path);
        res.setHeader('Content-Type', 'text/html; charset=utf-8');
        return res.send(enrichedHtml);
      } catch (err) {
        return res.sendFile(targetIndex);
      }
    } else {
      next();
    }
  });
} else {
  // In development, handle public page visits directly on Express with SEO injection
  app.get('*', (req, res, next) => {
    if (req.path.startsWith('/api')) {
      return next();
    }
    if (fs.existsSync(rootIndexPath)) {
      try {
        const rawHtml = fs.readFileSync(rootIndexPath, 'utf8');
        const enrichedHtml = injectSeoIntoHtml(rawHtml, req.path);
        res.setHeader('Content-Type', 'text/html; charset=utf-8');
        return res.send(enrichedHtml);
      } catch {
        return res.sendFile(rootIndexPath);
      }
    }
    res.json({
      message: 'Instagram Scraper API Server is running.',
      environment: config.nodeEnv,
      frontendUrl: config.appOrigin,
      healthCheck: '/api/health'
    });
  });
}

// 6. Global Error Handler
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
