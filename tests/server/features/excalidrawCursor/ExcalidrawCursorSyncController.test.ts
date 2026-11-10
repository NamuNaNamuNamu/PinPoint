import { jest } from "@jest/globals";
import type { Socket } from "socket.io";

const getRoom = jest.fn();
const getUserBySocketId = jest.fn();

jest.unstable_mockModule("../../../../src/server/features/room/RoomController", () => ({
    roomController: { getRoom },
}));
jest.unstable_mockModule("../../../../src/server/features/user/UserService", () => ({
    userService: { getUserBySocketId },
}));

const { excalidrawCursorSyncController } =
    await import("../../../../src/server/features/excalidrawCursor/ExcalidrawCursorSyncController");
const { SocketEvents } = await import("../../../../src/shared/SocketEvents");

describe("ExcalidrawCursorSyncController", () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    test("作成者かつ参加者の要求だけで共有カーソル公開状態を更新し、全員へ通知すること", () => {
        const emit = jest.fn();
        const room = {
            isCreatedBy: jest.fn().mockReturnValue(true),
            hasUser: jest.fn().mockReturnValue(true),
            setCursorRevealed: jest.fn().mockReturnValue(true),
            isCursorRevealed: jest.fn().mockReturnValue(false),
        };
        getRoom.mockReturnValue(room);
        const socket = createSocket(emit);

        expect(excalidrawCursorSyncController.setCursorRevealed(socket, 1, "room-1", false)).toEqual({ ok: true });

        expect(room.setCursorRevealed).toHaveBeenCalledWith(false);
        expect(emit).toHaveBeenCalledWith(SocketEvents.CURSOR_REVEAL_UPDATED, { cursorRevealed: false });
    });

    test("無効な入力、作成者以外、未参加者、同じ値の再設定では状態を変更または通知しないこと", () => {
        const emit = jest.fn();
        const room = {
            isCreatedBy: jest.fn().mockReturnValue(false),
            hasUser: jest.fn().mockReturnValue(true),
            setCursorRevealed: jest.fn(),
            isCursorRevealed: jest.fn(),
        };
        getRoom.mockReturnValue(room);
        const socket = createSocket(emit);

        expect(excalidrawCursorSyncController.setCursorRevealed(socket, 1, "room-1", "false")).toEqual({
            ok: false,
            reason: "invalid-request",
        });
        expect(excalidrawCursorSyncController.setCursorRevealed(socket, 1, "room-1", false)).toEqual({
            ok: false,
            reason: "not-creator",
        });

        room.isCreatedBy.mockReturnValue(true);
        room.hasUser.mockReturnValue(false);
        expect(excalidrawCursorSyncController.setCursorRevealed(socket, 1, "room-1", false)).toEqual({
            ok: false,
            reason: "not-member",
        });

        room.hasUser.mockReturnValue(true);
        room.setCursorRevealed.mockReturnValue(false);
        expect(excalidrawCursorSyncController.setCursorRevealed(socket, 1, "room-1", false)).toEqual({ ok: true });

        expect(room.setCursorRevealed).toHaveBeenCalledTimes(1);
        expect(emit).not.toHaveBeenCalled();
    });

    test("非公開のルームではカーソルを中継しないこと", () => {
        const emit = jest.fn();
        const room = { isCursorRevealed: jest.fn().mockReturnValue(false) };
        getRoom.mockReturnValue(room);
        const socket = createSocket(emit);

        excalidrawCursorSyncController.send(socket, {
            pointer: { x: 10, y: 20, tool: "pointer" },
            button: "up",
        });

        expect(getUserBySocketId).not.toHaveBeenCalled();
        expect(emit).not.toHaveBeenCalled();
    });
});

function createSocket(emit: jest.Mock): Socket {
    return {
        id: "socket-1",
        rooms: new Set(["socket-1", "room-1"]),
        to: jest.fn(() => ({ emit })),
        nsp: { to: jest.fn(() => ({ emit })) },
    } as unknown as Socket;
}
