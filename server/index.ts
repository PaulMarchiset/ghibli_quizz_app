import { createServer } from 'http'
import { Server } from 'socket.io'
import { registerHandlers } from './socketHandlers'

/** 
* creation of the server and socket.io setup
*/

const httpServer = createServer()
const io = new Server(httpServer, { cors: { origin: '*' } })
const PORT = Number(process.env.PORT ?? 4001)

io.on('connection', (socket) => {
  registerHandlers(io, socket)
})

httpServer.listen(PORT)