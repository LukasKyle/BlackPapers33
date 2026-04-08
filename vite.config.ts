import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  const devAllowedHost = env.VITE_DEV_ALLOWED_HOST?.trim();

  return {
    plugins: [
      react(),
      {
        name: 'block-markdown-files',
        configureServer(server) {
          server.middlewares.use((req, res, next) => {
            const url = req.url || '';
            if (/\.md($|\?)/i.test(url)) {
              res.statusCode = 404;
              res.end('Not Found');
              return;
            }
            next();
          });
        },
        configurePreviewServer(server) {
          server.middlewares.use((req, res, next) => {
            const url = req.url || '';
            if (/\.md($|\?)/i.test(url)) {
              res.statusCode = 404;
              res.end('Not Found');
              return;
            }
            next();
          });
        }
      }
    ],
    server: {
      host: '0.0.0.0',
      port: 5173,
      ...(devAllowedHost ? { allowedHosts: [devAllowedHost] } : {})
    }
  };
});
