import express from 'express';
import { corsMiddleware } from './middlewares/cors.js';
import { errorHandlerMiddleware } from './middlewares/errorHandler.js';
import { hashMiddleware } from './middlewares/hash.js';
import { loggerMiddleware } from './middlewares/logger.js';
import { sanitizationMiddleware } from './middlewares/sanitization.js';
import productosRouter from './routes/productos.routes.js';
import { settings } from './config/settings.js';

const app = express();

app.use(express.json({ limit: settings.jsonBodyLimit }));
app.use(corsMiddleware);
app.use(loggerMiddleware);
app.use(sanitizationMiddleware);
app.use(hashMiddleware);

app.use(settings.apiProductsPath, productosRouter);

app.use((req, res) => {
  res.status(404).json({
    status: 'error',
    statusCode: 404,
    message: `Ruta ${req.originalUrl} no encontrada.`
  });
});

app.use(errorHandlerMiddleware);

export default app;
