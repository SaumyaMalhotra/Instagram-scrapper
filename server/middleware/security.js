import helmet from 'helmet';
import cors from 'cors';
import express from 'express';
import { config } from '../config.js';

export function configureSecurity(app) {
  // Trust proxy for platforms like Render, Railway, Fly.io, Heroku
  app.set('trust proxy', 1);

  // Helmet for secure HTTP headers
  app.use(
    helmet({
      contentSecurityPolicy: {
        directives: {
          defaultSrc: ["'self'"],
          scriptSrc: ["'self'", "'unsafe-inline'"],
          styleSrc: ["'self'", "'unsafe-inline'", 'https://fonts.googleapis.com'],
          fontSrc: ["'self'", 'https://fonts.gstatic.com'],
          imgSrc: ["'self'", 'data:', 'blob:', 'https:', 'http:'],
          mediaSrc: ["'self'", 'blob:', 'https:', 'http:'],
          connectSrc: ["'self'", 'https://api.apify.com', 'http://localhost:*']
        }
      },
      crossOriginEmbedderPolicy: false
    })
  );

  // CORS configuration
  if (!config.isProduction) {
    // In dev, allow requests from Vite dev server
    app.use(
      cors({
        origin: [config.appOrigin, 'http://localhost:5173', 'http://127.0.0.1:5173'],
        credentials: true
      })
    );
  } else {
    // In production, same origin or configured domain
    app.use(
      cors({
        origin: (origin, callback) => {
          // If no origin (e.g. same origin or server-to-server), allow
          if (!origin || origin === config.appOrigin) {
            callback(null, true);
          } else {
            callback(null, false);
          }
        },
        credentials: true
      })
    );
  }

  // Webhook raw parser for Razorpay (must be registered before express.json)
  app.use('/api/razorpay/webhook', express.raw({ type: '*/*' }));

  // Request body size limit: 50kb for normal JSON payloads
  app.use(express.json({ limit: '50kb' }));
  app.use(express.urlencoded({ extended: false, limit: '50kb' }));
}
