import type { Socket } from "socket.io";
import { SocketEvents } from "../../../shared/SocketEvents";
import type { ExcalidrawElement } from "@excalidraw/excalidraw/element/types";

/**
 * Excalidraw 要素を同じルームの他クライアントへ同期する。
 */
class ExcalidrawSyncController {
    /**
     * 送信元ソケットが参加するルームへ、要素同期イベントを送信する。
     *
     * @param socket 要素を送信したクライアントのソケット。
     * @param elements 同期する Excalidraw 要素。
     * @throws ルーム ID を取得できない場合にエラーを送出する。
     */
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
