import { Socket } from "socket.io";
import { SocketEvents } from "../../SocketEvents";
import { roomController } from "../features/room/RoomController";
import { helloController } from "../features/hello/HelloController";
import { excalidrawSyncController } from "../features/excalidrawSync/ExcalidrawSyncController";

class SocketController {
    public register(socket: Socket) {
        socket.on(SocketEvents.HELLO, (message) => {
            helloController.hello(socket, message)
        } ); // 双方向通信お試し

        socket.on(SocketEvents.JOIN_ROOM, (message) => {
            const roomId = message;
            roomController.joinRoom(socket, roomId);
        });

        socket.on(SocketEvents.SYNC_ELEMENTS, (message) => {
            const elements = message;
            excalidrawSyncController.send(socket, elements);
        });
    }
}

export const socketController = new SocketController()