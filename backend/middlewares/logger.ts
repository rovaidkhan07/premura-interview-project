import { Request, Response, NextFunction } from 'express';

export const logger = {
  info: (...args: any[]) => console.log(`[INFO] [${new Date().toISOString()}]`, ...args),
  warn: (...args: any[]) => console.warn(`[WARN] [${new Date().toISOString()}]`, ...args),
  error: (...args: any[]) => console.error(`[ERROR] [${new Date().toISOString()}]`, ...args)
};

export const requestLogger = (req: Request, res: Response, next: NextFunction) => {
  const start = Date.now();
  logger.info(`${req.method} ${req.path}`);

  res.on('finish', () => {
    const duration = Date.now() - start;
    logger.info(`${req.method} ${req.path} ${res.statusCode} ${duration}ms`);
  });

  next();
};