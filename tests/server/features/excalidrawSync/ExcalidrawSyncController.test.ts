import type { ExcalidrawElement } from "@excalidraw/excalidraw/element/types";
import { jest } from "@jest/globals";
import type { Socket } from "socket.io";
import { SocketEvents } from "../../../../src/shared/SocketEvents";
import { excalidrawSyncController } from "../../../../src/server/features/excalidrawSync/ExcalidrawSyncController";

describe("ExcalidrawSyncController", () => {
    beforeEach(() => jest.useFakeTimers());
    afterEach(() => jest.useRealTimers());

    test("自分自身の room を除く参加ルームが 1 件の場合、差分を15Hzの配信へ集約すること", () => {
        const socket = createSocket("socket-1", ["socket-1", "room-1"]);
        const elements = [{ id: "element-1", version: 1, versionNonce: 1 }] as unknown as readonly ExcalidrawElement[];

        excalidrawSyncController.send(socket, { epoch: 0, elements });

        expect(socket.nsp.to).not.toHaveBeenCalled();
        jest.advanceTimersByTime(67);
        expect(socket.nsp.to).toHaveBeenCalledWith("room-1");
        expect(socket.nsp.emit).toHaveBeenCalledWith(SocketEvents.SYNC_ELEMENTS, expect.objectContaining({ epoch: 0, elements }));
    });

    test("参加ルームがない場合は同期イベントを送信しないこと", () => {
        const socket = createSocket("socket-1", ["socket-1"]);

        excalidrawSyncController.send(socket, { epoch: 0, elements: [] });

        expect(socket.to).not.toHaveBeenCalled();
        expect(socket.emit).not.toHaveBeenCalled();
    });

    test("参加ルームが複数ある場合は同期イベントを送信しないこと", () => {
        const socket = createSocket("socket-1", ["socket-1", "room-1", "room-2"]);

        excalidrawSyncController.send(socket, { epoch: 0, elements: [] });

        expect(socket.to).not.toHaveBeenCalled();
        expect(socket.emit).not.toHaveBeenCalled();
    });
});

function createSocket(id: string, rooms: string[]): Socket & { to: jest.Mock; emit: jest.Mock; nsp: { to: jest.Mock; emit: jest.Mock } } {
    const emit = jest.fn();
    const to = jest.fn().mockReturnValue({ emit });
    const namespaceEmit = jest.fn();
    const namespaceTo = jest.fn().mockReturnValue({ emit: namespaceEmit });

    return { id, rooms: new Set(rooms), to, emit, nsp: { to: namespaceTo, emit: namespaceEmit } } as unknown as Socket & { to: jest.Mock; emit: jest.Mock; nsp: { to: jest.Mock; emit: jest.Mock } };
}
