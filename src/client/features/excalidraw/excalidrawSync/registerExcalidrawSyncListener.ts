import { SocketEvents } from "../../../../shared/SocketEvents";
import { socket } from "../../../socket/socket";
import { excalidrawSyncController } from "./ExcalidrawSyncController";

/**
 * サーバーから配信される Excalidraw 要素同期イベントのリスナーを登録する。
 */
export function registerExcalidrawSyncListener(): void {
    socket.on(SocketEvents.SYNC_ELEMENTS, (elements) => {
        excalidrawSyncController.syncElements(elements);
    });
}
