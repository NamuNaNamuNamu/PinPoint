import { Excalidraw } from "@excalidraw/excalidraw";
import type { ComponentProps } from "react";
import { socketController } from "../../socket/SocketController";

type PointerUpdatePayload = Parameters<NonNullable<ComponentProps<typeof Excalidraw>["onPointerUpdate"]>>[0];

const CURSOR_SYNC_INTERVAL_MS = 1000 / 30;
let lastSentAt = 0;

/**
 * Excalidraw のポインター更新を最大毎秒 30 回で他クライアントへ送信する。
 *
 * @param payload Excalidraw の onPointerUpdate が通知するポインター情報。
 */
export function handlePointerChange(payload: PointerUpdatePayload): void {
    if (payload.pointersMap.size >= 2) {
        return;
    }

    const now = performance.now();
    if (now - lastSentAt < CURSOR_SYNC_INTERVAL_MS) {
        return;
    }
    lastSentAt = now;

    socketController.syncCursor({
        pointer: payload.pointer,
        button: payload.button,
    });
}
