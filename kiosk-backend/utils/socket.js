// utils/socket.js
import { Server } from 'socket.io';
let io;

export function init(server) {
    io = new Server(server, {
        cors: {
            origin: '*',
            methods: ['GET', 'POST']
        }
    });
    return io;
}

export function getIO() {
    if (!io) {
        throw new Error('Socket.io not initialized!');
    }
    return io;
}
