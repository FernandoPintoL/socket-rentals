# Socket URL Environment Configuration

## Changes Made

To make the socket server adapt its URL based on the environment (local or production), the following changes were made:

1. Added environment variables to `server.js`:
   ```javascript
   const APP_ENV = process.env.APP_ENV || 'local';
   const APP_URL_LOCAL = process.env.APP_URL_LOCAL || 'http://localhost:4000';
   const APP_URL_PROD = process.env.APP_URL_PROD || 'https://web-production-5f93.up.railway.app/';
   ```

2. Modified the server startup log message to use the appropriate URL based on the environment:
   ```javascript
   server.listen(PORT, () => {
       const appUrl = APP_ENV === 'production' ? APP_URL_PROD : APP_URL_LOCAL;
       console.log(`Servidor de control IoT en ${appUrl}`);
   });
   ```

## How It Works

- When `APP_ENV` is set to `local` in the `.env` file, the server will use `APP_URL_LOCAL`
- When `APP_ENV` is set to `production` in the `.env` file, the server will use `APP_URL_PROD`

## Testing

To test these changes:

1. For local development:
   - Set `APP_ENV=local` in the `.env` file
   - Run the server with `npm start` or `npm run dev`
   - The server should log: `Servidor de control IoT en http://localhost:4000`

2. For production:
   - Set `APP_ENV=production` in the `.env` file
   - Run the server with `npm start`
   - The server should log: `Servidor de control IoT en https://web-production-5f93.up.railway.app/`

You can also run the test script to see how different APP_ENV values affect the URL:
```
node test-env.js
```

## Client-Side Connection

The client-side socket connection in `index.html` uses a relative URL (`const socket = io();`), which means it will automatically connect to the same host that served the page. This ensures that the socket connection adapts to whatever URL the server is running on, whether it's local or production.