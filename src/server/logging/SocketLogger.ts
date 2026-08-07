import { Server, type DefaultEventsMap } from "socket.io";

class SocketLogger {
    private io: Server<DefaultEventsMap, DefaultEventsMap, DefaultEventsMap, any> | null;

    constructor() {
        this.io = null;
    }

    public setIo(io: Server<DefaultEventsMap, DefaultEventsMap, DefaultEventsMap, any>) {
        this.io = io;
    }

    public outputAllSockets({
        event, socketId
    }: Props) {
        if (!this.io) {
            throw Error("io が未設定");
        }

        console.log("===== Sockets =====");
        console.log(`${event}: ${socketId}`);

        for (const socket of this.io.sockets.sockets.values()) {
            console.log({
                id: socket.id,
                rooms: [...socket.rooms],
                connected: socket.connected,
            });
        }
        
        console.log("=============\n");
    }
}

type Props = {
    event: string,
    socketId: string
}

export const socketLogger = new SocketLogger();