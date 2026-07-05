import app from './app';
import { env } from './config/env';

app.listen(env.port, () => {
  console.log(`🚀 Planner backend running on http://localhost:${env.port}`);
  console.log(`   CORS origin: ${env.corsOrigin}`);
  console.log(`   Environment: ${process.env.NODE_ENV || 'development'}`);
});
