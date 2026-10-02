import { jest } from "@jest/globals";
import type { ExcalidrawImperativeAPI } from "@excalidraw/excalidraw/types";

const updateScene = jest.fn();
const mockExcalidrawAPIHolder = {
    getApi: jest.fn(() => ({ updateScene }) as unknown as ExcalidrawImperativeAPI),
};

jest.unstable_mockModule("../../../../../src/client/features/excalidraw/ExcalidrawAPIHolder", () => ({
    excalidrawAPIHolder: mockExcalidrawAPIHolder,
}));

const { excalidrawCursorSyncController } =
    await import("../../../../../src/client/features/excalidraw/excalidrawCursor/ExcalidrawCursorSyncController");

describe("ExcalidrawCursorSyncController", () => {
    beforeEach(() => {
        updateScene.mockClear();
        mockExcalidrawAPIHolder.getApi.mockClear();
    });

    test("受信したカーソルを追加・更新し、削除通知を受けたカーソルだけを削除すること", () => {
        excalidrawCursorSyncController.updateCursor({
            socketId: "socket-1",
            username: "Alice",
            pointer: { x: 10, y: 20, tool: "pointer" },
            button: "up",
        });
        excalidrawCursorSyncController.updateCursor({
            socketId: "socket-2",
            username: "Bob",
            pointer: { x: 30, y: 40, tool: "laser" },
            button: "down",
        });
        excalidrawCursorSyncController.updateCursor({
            socketId: "socket-1",
            username: "Alice",
            pointer: { x: 50, y: 60, tool: "pointer" },
            button: "down",
        });
        excalidrawCursorSyncController.removeCursor("socket-2");

        expect(updateScene).toHaveBeenLastCalledWith({
            collaborators: new Map([
                [
                    "socket-1",
                    {
                        pointer: { x: 50, y: 60, tool: "pointer" },
                        button: "down",
                        username: "Alice",
                    },
                ],
            ]),
        });
    });

    test("退出時は保持中の共同編集者カーソルをすべて削除すること", () => {
        excalidrawCursorSyncController.updateCursor({
            socketId: "socket-1",
            username: "Alice",
            pointer: { x: 10, y: 20, tool: "pointer" },
            button: "up",
        });

        excalidrawCursorSyncController.clear();

        expect(updateScene).toHaveBeenLastCalledWith({
            collaborators: new Map(),
        });
    });
});
