import { serve } from '@hono/node-server'
import { Hono } from 'hono'
import { cors } from 'hono/cors'
import { logger } from 'hono/logger'
import deidentifyRoutes from './routes/deidentify'
import dashboardRoutes from './routes/dashboard'

const app = new Hono()

// Middleware
app.use('*', logger())
app.use(
  '*',
  cors({
    origin: '*',
    allowMethods: ['GET', 'POST', 'OPTIONS'],
    allowHeaders: ['Content-Type', 'Authorization'],
  }),
)

// Routes
app.route('/api', deidentifyRoutes)
app.route('/api', dashboardRoutes)

// Health check
app.get('/health', (c) =>
  c.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    version: '1.0.0',
  }),
)

// 404 fallback
app.notFound((c) => c.json({ error: 'Route not found' }, 404))

// Start server
const port = parseInt(process.env.PORT || '3001', 10)

serve(
  {
    fetch: app.fetch,
    port,
  },
  (info) => {
    console.log(`\n🏥 HIPAA De-identification API`)
    console.log(`   Running on http://localhost:${info.port}`)
    console.log(`   Health: http://localhost:${info.port}/health\n`)
  },
)
