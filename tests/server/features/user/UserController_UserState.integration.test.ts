import { jest } from "@jest/globals";
import type { Socket } from "socket.io";

const mockUserLogger = { outputUserState: jest.fn() };
jest.unstable_mockModule("../../../../src/server/logging/UserLogger", () => ({ userLogger: mockUserLogger }));

describe("UserController / UserState integration", () => {
    beforeEach(() => {
        jest.resetModules();
        mockUserLogger.outputUserState.mockReset();
    });

    test("registerUser で登録したユーザーを UserState から取得でき、追加ログが出力される", async () => {
        const { userController } = await import("../../../../src/server/features/user/UserController");
        const { userState } = await import("../../../../src/server/features/user/UserState");
        const user = userController.registerUser({ id: "socket-1" } as Socket, "Alice");

        expect(userState.getUserById(user.getId())).toBe(user);
        expect(user.getName()).toBe("Alice");
        expect(user.getSocketId()).toBe("socket-1");
        expect(mockUserLogger.outputUserState).toHaveBeenCalledWith({ event: "追加", userId: 1 });
    });

    test("updateSocketId の結果は UserState の socketId 検索にも反映される", async () => {
        const { userController } = await import("../../../../src/server/features/user/UserController");
        const { userState } = await import("../../../../src/server/features/user/UserState");
        const user = userController.registerUser({ id: "before" } as Socket, "Alice");

        expect(userController.updateSocketId(user.getId(), "after")).toBe(user);
        expect(userState.getUserBySocketId("before")).toBeUndefined();
        expect(userState.getUserBySocketId("after")).toBe(user);
        expect(mockUserLogger.outputUserState).toHaveBeenLastCalledWith({
            event: "socketId 更新 (before -> after)",
            userId: 1,
        });
    });
});
