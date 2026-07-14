import { Server } from "socket.io";

class SocketLogger {
    outputAllSockets(io: Server, eventString: string) {
        console.log("===== Sockets =====");
        console.log(eventString);

        for (const socket of io.sockets.sockets.values()) {
            console.log({
                id: socket.id,
                rooms: [...socket.rooms],
                connected: socket.connected,
            });
        }
        
        console.log("=============\n");
    }
}

export const socketLogger = new SocketLogger();