import { Hono } from 'hono'
import auth from './auth'
import journal from './journal'

const routes = new Hono()

// Mount all route groups
routes.route('/auth', auth)
routes.route('/journal', journal)

export default routes
