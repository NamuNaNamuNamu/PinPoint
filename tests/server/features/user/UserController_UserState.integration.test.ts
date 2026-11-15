import { jest } from "@jest/globals";
import type { Socket } from "socket.io";

const mockServerLogger = { info: jest.fn() };
jest.unstable_mockModule("../../../../src/server/logging/ServerLogger", () => ({ serverLogger: mockServerLogger }));

describe("UserController / UserState integration", () => {
    beforeEach(() => {
        jest.resetModules();
        mockServerLogger.info.mockReset();
    });

    test("registerUser で登録したユーザーを UserState から取得でき、追加ログが出力される", async () => {
        const { userController } = await import("../../../../src/server/features/user/UserController");
        const { userState } = await import("../../../../src/server/features/user/UserState");
        const user = userController.registerUser({ id: "socket-1" } as Socket, "Alice");

        expect(userState.getUserById(user.getId())).toBe(user);
        expect(user.getName()).toBe("Alice");
        expect(user.getSocketId()).toBe("socket-1");
        expect(mockServerLogger.info).toHaveBeenCalledWith("user.registered", { userId: 1, userName: "Alice", socketId: "socket-1" });
    });

    test("updateSocketId の結果は UserState の socketId 検索にも反映される", async () => {
        const { userController } = await import("../../../../src/server/features/user/UserController");
        const { userState } = await import("../../../../src/server/features/user/UserState");
        const user = userController.registerUser({ id: "before" } as Socket, "Alice");

        expect(userController.updateSocketId(user.getId(), "after")).toBe(user);
        expect(userState.getUserBySocketId("before")).toBeUndefined();
        expect(userState.getUserBySocketId("after")).toBe(user);
        expect(mockServerLogger.info).toHaveBeenLastCalledWith("user.socket_id_updated", { userId: 1, userName: "Alice", previousSocketId: "before", socketId: "after" });
    });
});
