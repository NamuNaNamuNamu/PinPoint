import type { Socket } from "socket.io";
import { SocketEvents } from "../../../shared/SocketEvents";
import type { ExcalidrawElement } from "@excalidraw/excalidraw/element/types";

class ExcalidrawSyncController {
    public send = (socket: Socket, elements: readonly ExcalidrawElement[]) => {
        const roomIds = [...socket.rooms].filter((roomId) => roomId !== socket.id);

        if (roomIds.length !== 1) {
            return; // TODO: 部屋管理
        }

        const roomId = roomIds.at(0);

        if (!roomId) {
            throw new Error(`roomId が未設定です`);
        }

        socket.to(roomId).emit(SocketEvents.SYNC_ELEMENTS, elements);
    };
}

export const excalidrawSyncController = new ExcalidrawSyncController();