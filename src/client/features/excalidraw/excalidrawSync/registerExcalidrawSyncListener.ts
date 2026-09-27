import { SocketEvents } from "../../../../shared/SocketEvents";
import { excalidrawSyncController } from "./ExcalidrawSyncController";
import { socket } from "../../../socket/socket";

export function registerExcalidrawSyncListener(): void {
    socket.on(SocketEvents.SYNC_ELEMENTS, (elements) => {
        excalidrawSyncController.syncElements(elements);
    });
}
