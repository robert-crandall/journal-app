import { Hono } from 'hono'
import start from './start'
import reply from './reply'
import submit from './submit'
import list from './list'
import entry from './entry'

const journal = new Hono()

// Mount all journal routes
journal.route('/start', start)
journal.route('/reply', reply)
journal.route('/submit', submit)
journal.route('/list', list)
journal.route('/entry', entry)

export default journal
