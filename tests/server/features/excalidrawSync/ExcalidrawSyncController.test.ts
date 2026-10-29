import type { ExcalidrawElement } from "@excalidraw/excalidraw/element/types";
import { jest } from "@jest/globals";
import type { Socket } from "socket.io";
import { SocketEvents } from "../../../../src/shared/SocketEvents";
import { excalidrawSyncController } from "../../../../src/server/features/excalidrawSync/ExcalidrawSyncController";

describe("ExcalidrawSyncController", () => {
    test("自分自身の room を除く参加ルームが 1 件の場合、そのルームに要素を送信すること", () => {
        const socket = createSocket("socket-1", ["socket-1", "room-1"]);
        const elements = [{ id: "element-1" }] as unknown as readonly ExcalidrawElement[];

        excalidrawSyncController.send(socket, elements);

        expect(socket.to).toHaveBeenCalledWith("room-1");
        expect(socket.emit).toHaveBeenCalledWith(SocketEvents.SYNC_ELEMENTS, elements);
    });

    test("参加ルームがない場合は同期イベントを送信しないこと", () => {
        const socket = createSocket("socket-1", ["socket-1"]);

        excalidrawSyncController.send(socket, []);

        expect(socket.to).not.toHaveBeenCalled();
        expect(socket.emit).not.toHaveBeenCalled();
    });

    test("参加ルームが複数ある場合は同期イベントを送信しないこと", () => {
        const socket = createSocket("socket-1", ["socket-1", "room-1", "room-2"]);

        excalidrawSyncController.send(socket, []);

        expect(socket.to).not.toHaveBeenCalled();
        expect(socket.emit).not.toHaveBeenCalled();
    });
});

function createSocket(id: string, rooms: string[]): Socket & { to: jest.Mock; emit: jest.Mock } {
    const emit = jest.fn();
    const to = jest.fn().mockReturnValue({ emit });

    return { id, rooms: new Set(rooms), to, emit } as unknown as Socket & { to: jest.Mock; emit: jest.Mock };
}
