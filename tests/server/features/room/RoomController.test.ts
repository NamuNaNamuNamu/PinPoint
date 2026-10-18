import { jest } from "@jest/globals";
import type { Socket } from "socket.io";

const mockRoomService = {
    createRoom: jest.fn(),
    joinRoom: jest.fn(),
    getRoomIdBySocketId: jest.fn(),
    leave: jest.fn(),
    markDisconnected: jest.fn(),
    leaveIfStillDisconnected: jest.fn(),
};
const mockUserService = { getUserBySocketId: jest.fn(), getUser: jest.fn() };
const mockSocketLogger = { outputAllSockets: jest.fn() };
jest.unstable_mockModule("../../../../src/server/features/room/RoomService", () => ({ roomService: mockRoomService }));
jest.unstable_mockModule("../../../../src/server/features/user/UserService", () => ({ userService: mockUserService }));
jest.unstable_mockModule("../../../../src/server/logging/SocketLogger", () => ({ socketLogger: mockSocketLogger }));
const { roomController } = await import("../../../../src/server/features/room/RoomController");

describe("RoomController", () => {
    beforeEach(() => {
        Object.values(mockRoomService).forEach((fn) => fn.mockReset());
        mockUserService.getUserBySocketId.mockReset();
        mockUserService.getUser.mockReset();
        mockSocketLogger.outputAllSockets.mockReset();
    });

    test("createRoom と getRoomId はサービスへ委譲する", () => {
        const room = { getId: () => "room-1" };
        mockRoomService.createRoom.mockReturnValue(room);
        mockRoomService.getRoomIdBySocketId.mockReturnValue("room-1");
        expect(roomController.createRoom(1)).toBe(room);
        expect(mockRoomService.createRoom).toHaveBeenCalledWith(1);
        expect(roomController.getRoomId(createSocket("socket-1"))).toBe("room-1");
        expect(mockRoomService.getRoomIdBySocketId).toHaveBeenCalledWith("socket-1");
    });

    test("joinRoom は成功時だけ Socket.IO 参加とログ出力を行う", () => {
        const client = createSocket("socket-1");
        mockRoomService.joinRoom.mockReturnValue(true);
        expect(roomController.joinRoom(client, 1, "room-1")).toBe("room-1");
        expect(mockRoomService.joinRoom).toHaveBeenCalledWith(1, "room-1");
        expect(client.join).toHaveBeenCalledWith("room-1");
        expect(mockSocketLogger.outputAllSockets).toHaveBeenCalledWith({ event: "部屋参加", socketId: "socket-1" });
    });

    test("joinRoom は失敗時に副作用を起こさず null を返す", () => {
        const client = createSocket("socket-1");
        mockRoomService.joinRoom.mockReturnValue(false);
        expect(roomController.joinRoom(client, 1, "missing")).toBeNull();
        expect(client.join).not.toHaveBeenCalled();
        expect(mockSocketLogger.outputAllSockets).not.toHaveBeenCalled();
    });

    test("getRoomId は socket.id を指定して RoomService に取得を委譲すること", () => {
        mockRoomService.getRoomIdBySocketId.mockReturnValue("room-1");

        expect(roomController.getRoomId(createSocket("socket-1"))).toBe("room-1");
        expect(mockRoomService.getRoomIdBySocketId).toHaveBeenCalledWith("socket-1");
    });

    test("leaveRoom はユーザーがある時だけ退出・ログ出力する", () => {
        const client = createSocket("socket-1");
        mockUserService.getUserBySocketId.mockReturnValue({ getId: () => 1 });
        expect(roomController.leaveRoom(client, "room-1")).toBe("room-1");
        expect(mockRoomService.leave).toHaveBeenCalledWith(1);
        expect(client.leave).toHaveBeenCalledWith("room-1");
        expect(mockSocketLogger.outputAllSockets).toHaveBeenCalledWith({
            event: "部屋退出 (roomId: room-1)",
            socketId: "socket-1",
        });
    });

    test("leaveRoom はユーザーがない時に副作用を起こさず null を返す", () => {
        const client = createSocket("socket-1");
        expect(roomController.leaveRoom(client, "room-1")).toBeNull();
        expect(mockRoomService.leave).not.toHaveBeenCalled();
        expect(client.leave).not.toHaveBeenCalled();
    });

    test("最新 Socket の切断だけが再接続猶予を開始し、期限後にサービスへ委譲する", () => {
        jest.useFakeTimers();
        const client = createSocket("socket-1");
        mockUserService.getUser.mockReturnValue({ getId: () => 1, getSocketId: () => "socket-1" });
        mockRoomService.markDisconnected.mockReturnValue({ roomId: "room-1", token: "token-1" });

        roomController.handleDisconnecting(client, 1);
        jest.advanceTimersByTime(29_999);

        expect(mockRoomService.leaveIfStillDisconnected).not.toHaveBeenCalled();
        jest.advanceTimersByTime(30_000);

        expect(mockRoomService.markDisconnected).toHaveBeenCalledWith(1);
        expect(mockRoomService.leaveIfStillDisconnected).toHaveBeenCalledWith(1, "token-1");
        jest.useRealTimers();
    });

    test("古い Socket の切断は再接続猶予を開始しない", () => {
        const client = createSocket("socket-old");
        mockUserService.getUser.mockReturnValue({ getId: () => 1, getSocketId: () => "socket-new" });

        roomController.handleDisconnecting(client, 1);

        expect(mockRoomService.markDisconnected).not.toHaveBeenCalled();
    });
});

function createSocket(id: string): Socket & { join: jest.Mock; leave: jest.Mock } {
    return { id, join: jest.fn(), leave: jest.fn() } as unknown as Socket & { join: jest.Mock; leave: jest.Mock };
}
