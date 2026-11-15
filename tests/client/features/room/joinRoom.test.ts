import { jest } from "@jest/globals";

type SocketJoinRoom = (typeof import("../../../../src/client/socket/SocketController").socketController)["joinRoom"];

const socketJoinRoom = jest.fn<SocketJoinRoom>();

jest.unstable_mockModule("../../../../src/client/socket/SocketController", () => ({
    socketController: { joinRoom: socketJoinRoom },
}));

const { joinRoom } = await import("../../../../src/client/features/room/joinRoom");
const { roomRoleStore } = await import("../../../../src/client/features/room/roomRoleStore");

describe("joinRoom", () => {
    beforeEach(() => {
        jest.clearAllMocks();
        roomRoleStore.set(false);
    });

    test("入室 ACK の作成者ロールを、現在ルーム ID の更新前に保存すること", async () => {
        socketJoinRoom.mockResolvedValue({ roomId: "room-1", isCreator: true });

        await expect(joinRoom(1, "room-1")).resolves.toEqual({ roomId: "room-1", isCreator: true });

        expect(roomRoleStore.getSnapshot()).toBe(true);
    });
});
