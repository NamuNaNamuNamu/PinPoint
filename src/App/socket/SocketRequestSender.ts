import { io, type Socket } from "socket.io-client";
import { SocketEvents } from "../../SocketEvents";

class SocketRequestSender {
    private socket: Socket;

    constructor(socket: Socket) {
        this.socket = socket;
    }

    public hello() {
        this.socket.emit(SocketEvents.HELLO, "こんにちは");

        this.socket.on(SocketEvents.HELLO, (message) => {
            console.log(message);
        } ); // 双方向通信お試し
    }
}

export const socketRequestSender = new SocketRequestSender(io("http://localhost:3001"))