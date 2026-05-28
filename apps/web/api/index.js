import { handle } from 'hono/vercel';

export default async (req, res) => {
  // Load the Hono app dynamically from the build output
  const appModule = await import('../build/server/index.js');
  const app = appModule.default;
  
  // Handle the request using Hono's Vercel adapter
  const handler = handle(app);
  return handler(req, res);
};
