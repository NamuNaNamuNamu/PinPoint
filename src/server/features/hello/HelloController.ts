import type { Socket } from "socket.io";
import { SocketEvents } from "../../../SocketEvents";

class HelloController {
    public hello = (socket: Socket ,message: string) => {
        console.log(message);
        console.log(`socketID: ${socket.id} より今から返信します。`);
        socket.emit(SocketEvents.HELLO, "Hello from server!");
    };
}

export const helloController = new HelloController();