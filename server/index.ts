import { createServer } from 'http'
import { Server } from 'socket.io'
import { registerHandlers } from './socketHandlers'

/** 
* creation of the server and socket.io setup
*/

const httpServer = createServer()
const io = new Server(httpServer, { cors: { origin: '*' } })

io.on('connection', (socket) => {
  registerHandlers(io, socket)
})

httpServer.listen(4001)