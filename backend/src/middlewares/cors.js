import { settings } from '../config/settings.js';

export const corsMiddleware = (req, res, next) => {
  res.header('Access-Control-Allow-Origin', settings.corsOrigin);
  res.header('Access-Control-Allow-Methods', settings.corsMethods);
  res.header('Access-Control-Allow-Headers', settings.corsAllowedHeaders);

  if (req.method === 'OPTIONS') {
    return res.status(204).end();
  }

  next();
};
