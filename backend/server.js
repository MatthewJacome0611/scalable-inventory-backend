import 'dotenv/config';
import app from './src/app.js';
import { Database } from './src/config/Database.js';
import { settings } from './src/config/settings.js';

async function bootstrap() {
  try {
    await Database.getInstance().testConnection();

    const server = app.listen(settings.port, () => {
      console.log(`[Servidor iniciado] API ejecutándose en el puerto ${settings.port}`);
      console.log(`[Endpoint base] http://localhost:${settings.port}${settings.apiProductsPath}`);
    });

    server.on('error', (error) => {
      console.error('[Error de servidor] No fue posible iniciar HTTP:', error.message);
      process.exitCode = 1;
    });
  } catch (error) {
    console.error('[Error de arranque] No fue posible iniciar la aplicación:', error.message);
    process.exitCode = 1;
  }
}

bootstrap();
