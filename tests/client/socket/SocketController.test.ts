import type { ExcalidrawElement } from "@excalidraw/excalidraw/element/types";
import { jest } from "@jest/globals";

import { SocketEvents } from "../../../src/shared/SocketEvents";

const on = jest.fn();
const off = jest.fn();
const emit = jest.fn();

jest.unstable_mockModule("../../../src/client/socket/socket", () => ({ socket: { emit, on, off } }));

const { socketController } = await import("../../../src/client/socket/SocketController");

describe("SocketController", () => {
    beforeEach(() => {
        jest.clearAllMocks();
        jest.useFakeTimers();
    });

    afterEach(() => {
        jest.runOnlyPendingTimers();
        jest.useRealTimers();
    });

    test("要素同期を最大毎秒 30 回に抑え、待機中は最後の要素だけを送信すること", () => {
        const firstElements = [{ id: "element-1" }] as unknown as readonly ExcalidrawElement[];
        const secondElements = [{ id: "element-2" }] as unknown as readonly ExcalidrawElement[];
        const latestElements = [{ id: "element-3" }] as unknown as readonly ExcalidrawElement[];

        socketController.syncElements(firstElements);
        socketController.syncElements(secondElements);
        socketController.syncElements(latestElements);

        expect(emit).toHaveBeenCalledTimes(1);
        expect(emit).toHaveBeenLastCalledWith(SocketEvents.SYNC_ELEMENTS, firstElements);

        jest.advanceTimersByTime(34);

        expect(emit).toHaveBeenCalledTimes(2);
        expect(emit).toHaveBeenLastCalledWith(SocketEvents.SYNC_ELEMENTS, latestElements);
    });

    test("接続完了リスナーを登録し、解除できること", () => {
        const listener = jest.fn();

        const removeListener = socketController.onConnect(listener);

        expect(on).toHaveBeenCalledWith("connect", listener);

        removeListener();

        expect(off).toHaveBeenCalledWith("connect", listener);
    });
});
