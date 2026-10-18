import { jest } from "@jest/globals";
import type { Socket } from "socket.io";

const roomLogger = { outputRoomState: jest.fn() };
const socketLogger = { outputAllSockets: jest.fn() };
const userLogger = { outputUserState: jest.fn() };
jest.unstable_mockModule("../../../../src/server/logging/RoomLogger", () => ({ roomLogger }));
jest.unstable_mockModule("../../../../src/server/logging/SocketLogger", () => ({ socketLogger }));
jest.unstable_mockModule("../../../../src/server/logging/UserLogger", () => ({ userLogger }));

describe("RoomController / RoomState integration", () => {
    beforeEach(() => {
        jest.resetModules();
        roomLogger.outputRoomState.mockReset();
        socketLogger.outputAllSockets.mockReset();
        userLogger.outputUserState.mockReset();
    });

    test("登録済みユーザーを作成済みルームへ参加させ、公開APIから参加状態を取得できる", async () => {
        const { userController } = await import("../../../../src/server/features/user/UserController");
        const { roomController } = await import("../../../../src/server/features/room/RoomController");
        const { roomState } = await import("../../../../src/server/features/room/RoomState");
        const client = createSocket("socket-1");
        const user = userController.registerUser(client, "Alice");
        const room = roomController.createRoom(user.getId());
        const roomId = room.getId();

        expect(roomController.joinRoom(client, user.getId(), roomId)).toBe(roomId);
        expect(client.join).toHaveBeenCalledWith(roomId);
        expect(roomState.getRoomIdBySocketId("socket-1")).toBe(roomId);
        expect(roomController.getRoomId(client)).toBe(roomId);
    });

    test("存在しないルームへの参加は公開APIから失敗として観測できる", async () => {
        const { userController } = await import("../../../../src/server/features/user/UserController");
        const { roomController } = await import("../../../../src/server/features/room/RoomController");
        const { roomState } = await import("../../../../src/server/features/room/RoomState");
        const client = createSocket("socket-1");
        const user = userController.registerUser(client, "Alice");
        expect(roomController.joinRoom(client, user.getId(), "missing")).toBeNull();
        expect(client.join).not.toHaveBeenCalled();
        expect(roomState.getRoomIdBySocketId("socket-1")).toBeUndefined();
        expect(roomController.getRoomId(client)).toBeUndefined();
    });
});
function createSocket(id: string): Socket & { join: jest.Mock } {
    return { id, join: jest.fn() } as unknown as Socket & { join: jest.Mock };
}
