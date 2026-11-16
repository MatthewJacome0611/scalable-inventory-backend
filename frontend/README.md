# Frontend de productos

Interfaz web independiente del backend. El frontend corre en el puerto `5173` por defecto y llama a la API de productos en el puerto `5051`.

## Iniciar

1. Verifica que `frontend/.env` tenga la URL de API correcta. Puedes usar `.env.example` como referencia:

   ```env
   FRONTEND_PORT=5173
   API_BASE_URL=http://localhost:5051/api/v1/productos
   ```

2. Desde esta carpeta ejecuta:

   ```powershell
   npm start
   ```

3. Abre `http://localhost:5173/`.

En otra terminal, inicia por separado la API desde `backend/`:

```powershell
npm start
```

El backend debe permitir el origen del frontend en `CORS_ORIGIN`. El valor `*` funciona para desarrollo local; para restringirlo, usa `CORS_ORIGIN=http://localhost:5173` en el `.env` del backend y reinicia ese servidor.

Si cambias el puerto o la ruta de la API, actualiza `API_BASE_URL` en `frontend/.env`. No pongas credenciales de base de datos en la configuración del frontend.
