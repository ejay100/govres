/**
 * GOVRES — Logger Utility
 */

import winston from 'winston';
import path from 'path';
import { existsSync, mkdirSync } from 'fs';

const logDir = path.resolve(process.cwd(), 'logs');

if (!existsSync(logDir)) {
  mkdirSync(logDir, { recursive: true });
}

export const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.errors({ stack: true }),
    winston.format.json()
  ),
  defaultMeta: { service: 'govres-api' },
  transports: [
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.colorize(),
        winston.format.simple()
      ),
    }),
    new winston.transports.File({ filename: path.join(logDir, 'error.log'), level: 'error' }),
    new winston.transports.File({ filename: path.join(logDir, 'combined.log') }),
    new winston.transports.File({ filename: path.join(logDir, 'audit.log'), level: 'info' }),
  ],
});
