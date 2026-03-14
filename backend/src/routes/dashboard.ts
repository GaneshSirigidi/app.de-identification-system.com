import { Hono } from 'hono'
import { getDashboardStats } from '../services/store'

const router = new Hono()

router.get('/dashboard', (c) => {
  const stats = getDashboardStats()
  return c.json(stats)
})

export default router
