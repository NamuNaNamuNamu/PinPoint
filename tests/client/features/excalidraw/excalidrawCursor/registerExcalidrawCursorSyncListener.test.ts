import { jest } from "@jest/globals";

import type { CursorRevealUpdated } from "../../../../../src/shared/excalidraw/Cursor";
import { SocketEvents } from "../../../../../src/shared/SocketEvents";

const on = jest.fn();
const updateCursor = jest.fn();
const removeCursor = jest.fn();
const setCursorRevealed = jest.fn();

jest.unstable_mockModule("../../../../../src/client/socket/socket", () => ({ socket: { on } }));
jest.unstable_mockModule(
    "../../../../../src/client/features/excalidraw/excalidrawCursor/ExcalidrawCursorSyncController",
    () => ({ excalidrawCursorSyncController: { updateCursor, removeCursor, setCursorRevealed } }),
);

const { registerExcalidrawCursorSyncListener } =
    await import("../../../../../src/client/features/excalidraw/excalidrawCursor/registerExcalidrawCursorSyncListener");

describe("registerExcalidrawCursorSyncListener", () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    test("共有カーソル公開状態の通知をコントローラーへ反映すること", () => {
        registerExcalidrawCursorSyncListener();

        const onRevealUpdated = on.mock.calls.find(
            ([event]) => event === SocketEvents.CURSOR_REVEAL_UPDATED,
        )?.[1] as ((event: CursorRevealUpdated) => void) | undefined;
        if (!onRevealUpdated) {
            throw new Error("cursor-reveal-updated listener が登録されていません。");
        }

        onRevealUpdated({ cursorRevealed: false });

        expect(setCursorRevealed).toHaveBeenCalledWith(false);
    });
});
