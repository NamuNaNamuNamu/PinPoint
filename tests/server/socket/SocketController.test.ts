import { jest } from "@jest/globals";
import type { Socket } from "socket.io";

import { SocketEvents } from "../../../src/shared/SocketEvents";

type Listener = (...args: unknown[]) => void;

const answerBarController = {
    joinRoom: jest.fn(),
    leaveRoom: jest.fn(),
    updatePosition: jest.fn(),
    updateOwnerUserName: jest.fn(),
    handleDisconnecting: jest.fn(),
};
const excalidrawCursorSyncController = { remove: jest.fn(), send: jest.fn() };
const excalidrawSyncController = { restore: jest.fn(), send: jest.fn() };
const questionController = {
    apply: jest.fn(),
    controlCurrent: jest.fn(),
    resetScores: jest.fn(),
    reveal: jest.fn(),
    setScoreListEnabled: jest.fn(),
};
const roomController = { createRoom: jest.fn() };
const userController = {
    getUser: jest.fn(),
    registerUser: jest.fn(),
    updateSocketId: jest.fn(),
    updateUserName: jest.fn(),
};
const userService = { getUser: jest.fn() };

jest.unstable_mockModule("../../../src/server/features/answerBar/AnswerBarController", () => ({ answerBarController }));
jest.unstable_mockModule("../../../src/server/features/excalidrawCursor/ExcalidrawCursorSyncController", () => ({
    excalidrawCursorSyncController,
}));
jest.unstable_mockModule("../../../src/server/features/excalidrawSync/ExcalidrawSyncController", () => ({
    excalidrawSyncController,
}));
jest.unstable_mockModule("../../../src/server/features/question/QuestionController", () => ({ questionController }));
jest.unstable_mockModule("../../../src/server/features/room/RoomController", () => ({ roomController }));
jest.unstable_mockModule("../../../src/server/features/user/UserController", () => ({ userController }));
jest.unstable_mockModule("../../../src/server/features/user/UserService", () => ({ userService }));

const { SocketController } = await import("../../../src/server/socket/SocketController");

describe("SocketController", () => {
    beforeEach(() => {
        Object.values(answerBarController).forEach((mock) => mock.mockReset());
        Object.values(excalidrawCursorSyncController).forEach((mock) => mock.mockReset());
        Object.values(excalidrawSyncController).forEach((mock) => mock.mockReset());
        Object.values(questionController).forEach((mock) => mock.mockReset());
        Object.values(roomController).forEach((mock) => mock.mockReset());
        Object.values(userController).forEach((mock) => mock.mockReset());
        Object.values(userService).forEach((mock) => mock.mockReset());
    });

    test("Socket ID 更新時はクライアント値ではなく接続中 Socket の ID を保存する", () => {
        const { socket, listener } = createSocket("socket-current");
        const user = { getId: () => 1, getSocketId: () => "socket-current" };
        userController.updateSocketId.mockReturnValue(user);
        new SocketController(socket).register();
        const acknowledgement = jest.fn();

        listener(SocketEvents.UPDATE_SOCKET_ID)({ userId: 1, socketId: "socket-stale" }, acknowledgement);

        expect(userController.updateSocketId).toHaveBeenCalledWith(1, "socket-current");
        expect(acknowledgement).toHaveBeenCalledWith(user);
    });

    test("対応付けられていない Socket からの入室は拒否する", () => {
        const { socket, listener } = createSocket("socket-current");
        userService.getUser.mockReturnValue({ getSocketId: () => "socket-other" });
        new SocketController(socket).register();
        const acknowledgement = jest.fn();

        listener(SocketEvents.JOIN_ROOM)({ userId: 1, roomId: "room-1" }, acknowledgement);

        expect(answerBarController.joinRoom).not.toHaveBeenCalled();
        expect(acknowledgement).toHaveBeenCalledWith(null);
    });

    test("現在の Socket へ対応付けたユーザーの入室を受け付ける", () => {
        const { socket, listener } = createSocket("socket-current");
        const user = { getId: () => 1, getSocketId: () => "socket-current" };
        userController.updateSocketId.mockReturnValue(user);
        userService.getUser.mockReturnValue(user);
        answerBarController.joinRoom.mockReturnValue("room-1");
        new SocketController(socket).register();

        listener(SocketEvents.UPDATE_SOCKET_ID)({ userId: 1 }, jest.fn());
        const acknowledgement = jest.fn();
        listener(SocketEvents.JOIN_ROOM)({ userId: 1, roomId: "room-1" }, acknowledgement);

        expect(answerBarController.joinRoom).toHaveBeenCalledWith(socket, 1, "room-1", undefined);
        expect(acknowledgement).toHaveBeenCalledWith("room-1");
    });
});

function createSocket(id: string): { socket: Socket; listener: (event: string) => Listener } {
    const listeners = new Map<string, Listener>();
    const socket = {
        id,
        on: jest.fn((event: string, handler: Listener) => listeners.set(event, handler)),
    } as unknown as Socket;
    return {
        socket,
        listener: (event) => {
            const handler = listeners.get(event);
            if (!handler) {
                throw new Error(`${event} のリスナーが登録されていません。`);
            }
            return handler;
        },
    };
}
