import { io, type Socket } from "socket.io-client";
import { SocketEvents } from "../../SocketEvents";
import type { ExcalidrawElement } from "@excalidraw/excalidraw/element/types";
import type { ExcalidrawImperativeAPI } from "@excalidraw/excalidraw/types";
import { reconcileElements } from "@excalidraw/excalidraw";
import type { ReconciledExcalidrawElement } from "@excalidraw/excalidraw/data/reconcile";

class SocketRequestSender {
    private socket: Socket;

    constructor(socket: Socket) {
        this.socket = socket;
    }

    public hello() {
        this.socket.emit(SocketEvents.HELLO, "こんにちは");

        this.socket.on(SocketEvents.HELLO, (message) => {
            console.log(message);
        }); // 双方向通信お試し
    }

    public joinRoom(roomId: string) {
        console.log(`roomId: ${roomId} に参加しようとしています。\nsocketId: ${this.socket.id}`)
        this.socket.emit(SocketEvents.JOIN_ROOM, roomId);

        this.socket.on(SocketEvents.JOIN_ROOM, (message) => {
            console.log(message);
        }); 
    }

    public sendElements(elements: readonly ExcalidrawElement[], excalidrawAPI: ExcalidrawImperativeAPI) {
        this.socket.emit(SocketEvents.SYNC_ELEMENTS, elements);

        this.socket.on(SocketEvents.SYNC_ELEMENTS, (elements) => {
            const localElements = excalidrawAPI.getSceneElements();
            const remoteElements = elements;
            const appState = excalidrawAPI.getAppState();
            
            const merged: ReconciledExcalidrawElement[] = reconcileElements(
                localElements,
                remoteElements,
                appState
            );

            excalidrawAPI.updateScene({
                elements: merged,
            });
        }); 
    }
}

export const socketRequestSender = new SocketRequestSender(io("http://localhost:3001"))