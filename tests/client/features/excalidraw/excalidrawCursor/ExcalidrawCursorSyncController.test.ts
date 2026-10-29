import { jest } from "@jest/globals";
import type { ExcalidrawImperativeAPI } from "@excalidraw/excalidraw/types";

const updateScene = jest.fn();
const applyRemote = jest.fn((update: () => void) => update());
const requestAnimationFrame = jest.fn((_callback: FrameRequestCallback) => 1);
const mockExcalidrawAPIHolder = {
    getApi: jest.fn(() => ({ updateScene }) as unknown as ExcalidrawImperativeAPI),
};

Object.defineProperty(globalThis, "requestAnimationFrame", {
    configurable: true,
    value: requestAnimationFrame,
    writable: true,
});

jest.unstable_mockModule("../../../../../src/client/features/excalidraw/ExcalidrawAPIHolder", () => ({
    excalidrawAPIHolder: mockExcalidrawAPIHolder,
}));
jest.unstable_mockModule("../../../../../src/client/features/excalidraw/excalidrawSync/ExcalidrawSyncController", () => ({
    excalidrawSyncController: { applyRemote },
}));

const { excalidrawCursorSyncController } =
    await import("../../../../../src/client/features/excalidraw/excalidrawCursor/ExcalidrawCursorSyncController");

describe("ExcalidrawCursorSyncController", () => {
    beforeEach(() => {
        updateScene.mockClear();
        applyRemote.mockClear();
        requestAnimationFrame.mockClear();
        mockExcalidrawAPIHolder.getApi.mockClear();
    });

    test("同一フレーム内のカーソル更新を集約し、リモート反映として最後の状態を一度だけ反映すること", () => {
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

        expect(requestAnimationFrame).toHaveBeenCalledTimes(1);
        expect(applyRemote).not.toHaveBeenCalled();
        expect(updateScene).not.toHaveBeenCalled();

        const callback = requestAnimationFrame.mock.calls[0]?.[0] as FrameRequestCallback;
        callback(0);

        expect(applyRemote).toHaveBeenCalledTimes(1);
        expect(updateScene).toHaveBeenCalledWith({
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

    test("描画後の次のカーソル更新では、新しい描画フレームを予約すること", () => {
        excalidrawCursorSyncController.updateCursor({
            socketId: "socket-1",
            username: "Alice",
            pointer: { x: 10, y: 20, tool: "pointer" },
            button: "up",
        });
        const firstCallback = requestAnimationFrame.mock.calls[0]?.[0] as FrameRequestCallback;
        firstCallback(0);

        excalidrawCursorSyncController.clear();

        expect(requestAnimationFrame).toHaveBeenCalledTimes(2);
        expect(applyRemote).toHaveBeenCalledTimes(1);
        expect(updateScene).toHaveBeenCalledTimes(1);

        const secondCallback = requestAnimationFrame.mock.calls[1]?.[0] as FrameRequestCallback;
        secondCallback(16);

        expect(applyRemote).toHaveBeenCalledTimes(2);
        expect(updateScene).toHaveBeenLastCalledWith({
            collaborators: new Map(),
        });
    });
});
