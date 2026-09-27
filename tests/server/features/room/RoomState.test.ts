import { jest } from "@jest/globals";

type MockUser = {
    getId: () => number;
    getSocketId: () => string;
};

const mockUserService = {
    getUser: jest.fn<(id: number) => MockUser>(),
};

jest.unstable_mockModule("../../../../src/server/features/user/UserService", () => ({ userService: mockUserService }));
const { RoomState } = await import("../../../../src/server/features/room/RoomState");

describe("RoomState", () => {
    let roomState: InstanceType<typeof RoomState>;
    beforeEach(() => {
        roomState = new RoomState();
        mockUserService.getUser.mockReset();
    });

    test("addRoom は一意なIDを持つ空ルームを追加する", () => {
        const first = roomState.addRoom();
        const second = roomState.addRoom();
        expect(first.getId()).toEqual(expect.any(String));
        expect(second.getId()).not.toBe(first.getId());
        expect(first.getSocketIds()).toEqual([]);
    });

    test("存在しないルームには参加できず、ユーザーを検索しない", () => {
        expect(roomState.join(1, "missing")).toBe(false);
        expect(mockUserService.getUser).not.toHaveBeenCalled();
    });

    test("存在しないユーザーはルームに参加できない", () => {
        const room = roomState.addRoom();
        expect(roomState.join(99, room.getId())).toBe(false);
        expect(mockUserService.getUser).toHaveBeenCalledWith(99);
        expect(roomState.getRoomIdBySocketId("socket-99")).toBeUndefined();
    });

    test("ユーザーを参加させると socketId からルームIDを取得できる", () => {
        const room = roomState.addRoom();
        const user = { getId: () => 1, getSocketId: () => "socket-1" };
        mockUserService.getUser.mockReturnValue(user);
        expect(roomState.join(1, room.getId())).toBe(true);
        expect(roomState.getRoomIdBySocketId("socket-1")).toBe(room.getId());
        expect(room.getSocketIds()).toEqual(["socket-1"]);
    });

    test("leave は最後のユーザーが退出したルームを削除する", () => {
        const room = roomState.addRoom();
        mockUserService.getUser.mockReturnValue({ getId: () => 1, getSocketId: () => "socket-1" });
        roomState.join(1, room.getId());
        roomState.leave(1);
        expect(roomState.getRoomIdBySocketId("socket-1")).toBeUndefined();
    });

    test("leave は同室の他ユーザーを保持する", () => {
        const room = roomState.addRoom();
        mockUserService.getUser.mockImplementation((id: number) => ({
            getId: () => id,
            getSocketId: () => `socket-${id}`,
        }));
        roomState.join(1, room.getId());
        roomState.join(2, room.getId());
        roomState.leave(1);
        expect(room.getSocketIds()).toEqual(["socket-2"]);
        expect(roomState.getRoomIdBySocketId("socket-2")).toBe(room.getId());
    });
});
