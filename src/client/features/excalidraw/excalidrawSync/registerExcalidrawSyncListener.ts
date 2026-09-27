import { io, type Socket } from "socket.io-client";
import { SocketEvents } from "../../../../shared/SocketEvents";
import { excalidrawSyncController } from "./ExcalidrawSyncController";

export function registerExcalidrawSyncListener(): void {
    const socket: Socket = io();

    socket.on(SocketEvents.SYNC_ELEMENTS, (elements) => {
        excalidrawSyncController.syncElements(elements);
    });
}
