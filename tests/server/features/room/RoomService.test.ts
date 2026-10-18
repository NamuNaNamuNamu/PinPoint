import { jest } from "@jest/globals";

const mockRoomState = { addRoom: jest.fn(), join: jest.fn(), getRoomIdBySocketId: jest.fn(), leave: jest.fn() };
const mockUserService = { getUser: jest.fn() };
const mockRoomLogger = { outputRoomState: jest.fn() };
jest.unstable_mockModule("../../../../src/server/features/room/RoomState", () => ({ roomState: mockRoomState }));
jest.unstable_mockModule("../../../../src/server/features/user/UserService", () => ({ userService: mockUserService }));
jest.unstable_mockModule("../../../../src/server/logging/RoomLogger", () => ({ roomLogger: mockRoomLogger }));
const { RoomService } = await import("../../../../src/server/features/room/RoomService");

describe("RoomService", () => {
    let roomService: InstanceType<typeof RoomService>;
    beforeEach(() => {
        roomService = new RoomService();
        Object.values(mockRoomState).forEach((fn) => fn.mockReset());
        mockUserService.getUser.mockReset();
        mockRoomLogger.outputRoomState.mockReset();
    });

    test("createRoom と getRoomIdBySocketId は RoomState に委譲する", () => {
        const room = { getId: () => "room-1" };
        mockRoomState.addRoom.mockReturnValue(room);
        mockRoomState.getRoomIdBySocketId.mockReturnValue("room-1");
        expect(roomService.createRoom(1)).toBe(room);
        expect(mockRoomState.addRoom).toHaveBeenCalledWith(1);
        expect(roomService.getRoomIdBySocketId("socket-1")).toBe("room-1");
    });

    test("joinRoom は成功時に socketId を含む入室ログを出力する", () => {
        mockRoomState.join.mockReturnValue(true);
        mockUserService.getUser.mockReturnValue({ getSocketId: () => "socket-1" });
        expect(roomService.joinRoom(1, "room-1")).toBe(true);
        expect(mockRoomState.join).toHaveBeenCalledWith(1, "room-1");
        expect(mockRoomLogger.outputRoomState).toHaveBeenCalledWith({ event: "入室", userId: 1, socketId: "socket-1" });
    });

    test("joinRoom は成功後にユーザーを取得できなくても既定値でログを出力する", () => {
        mockRoomState.join.mockReturnValue(true);
        expect(roomService.joinRoom(1, "room-1")).toBe(true);
        expect(mockRoomLogger.outputRoomState).toHaveBeenCalledWith(
            expect.objectContaining({ event: "入室", userId: 1 }),
        );
    });

    test("joinRoom は失敗時にログを出力せず false を返すこと", () => {
        mockRoomState.join.mockReturnValue(false);
        expect(roomService.joinRoom(1, "missing")).toBe(false);
        expect(mockUserService.getUser).not.toHaveBeenCalled();
        expect(mockRoomLogger.outputRoomState).not.toHaveBeenCalled();
    });

    test.each([
        [{ getSocketId: () => "socket-1" }, "socket-1"],
        [undefined, "取得失敗しました"],
    ])("leave は状態を更新して退出ログを出力する", (user, socketId) => {
        mockUserService.getUser.mockReturnValue(user);
        roomService.leave(1);
        expect(mockRoomState.leave).toHaveBeenCalledWith(1);
        expect(mockRoomLogger.outputRoomState).toHaveBeenCalledWith({ event: "退出", userId: 1, socketId });
    });

    test("leave はユーザーを取得できない場合も退出処理を行い、取得失敗のログを出力すること", () => {
        mockUserService.getUser.mockReturnValue(undefined);

        roomService.leave(999);

        expect(mockRoomState.leave).toHaveBeenCalledWith(999);
        expect(mockRoomLogger.outputRoomState).toHaveBeenCalledWith({
            event: "退出",
            userId: 999,
            socketId: "取得失敗しました",
        });
    });
});
