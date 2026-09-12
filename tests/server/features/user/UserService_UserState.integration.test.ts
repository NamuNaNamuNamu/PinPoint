import { jest } from "@jest/globals";

const mockUserLogger = {
    outputUserState: jest.fn(),
};

jest.unstable_mockModule("../../../../src/server/logging/UserLogger", () => ({
    userLogger: mockUserLogger,
}));

/**
 * UserService と UserState の結合テスト。
 *
 * 各テストで ES Modules を再読み込みして singleton の状態を初期化し、
 * UserService が操作した結果を実際の UserState から検証する。
 * UserLogger は unstable_mockModule でモックする。
 */
describe("UserService / UserState integration", () => {
    beforeEach(() => {
        jest.resetModules();
        mockUserLogger.outputUserState.mockReset();
    });

    test("addUser で追加した User を UserState から取得できること", async () => {
        const { userService } = await import("../../../../src/server/features/user/UserService");
        const { userState } = await import("../../../../src/server/features/user/UserState");

        const user = userService.addUser("Alice", "socket-1");

        expect(userState.getUserById(user.getId())).toBe(user);
        expect(user.getName()).toBe("Alice");
        expect(user.getSocketId()).toBe("socket-1");
        expect(mockUserLogger.outputUserState).toHaveBeenCalledWith({
            event: "追加",
            userId: user.getId(),
        });
    });

    test("addUser で追加した User を socketId から取得できること", async () => {
        const { userService } = await import("../../../../src/server/features/user/UserService");

        const user = userService.addUser("Alice", "socket-1");

        expect(userService.getUserBySocketId("socket-1")).toBe(user);
    });

    test("複数ユーザーの登録後、UserState 上のユーザーIDが重複しないこと", async () => {
        const { userService } = await import("../../../../src/server/features/user/UserService");
        const { userState } = await import("../../../../src/server/features/user/UserState");

        const users = [
            userService.addUser("Alice", "socket-1"),
            userService.addUser("Bob", "socket-2"),
            userService.addUser("Carol", "socket-3"),
        ];
        const userIds = users.map((user) => user.getId());

        expect(Array.from(new Set(userIds))).toHaveLength(users.length);
        users.forEach((user) => {
            expect(userState.getUserById(user.getId())).toBe(user);
        });
    });

    test("updateSocketId の結果が UserState の取得結果にも反映されること", async () => {
        const { userService } = await import("../../../../src/server/features/user/UserService");
        const { userState } = await import("../../../../src/server/features/user/UserState");
        const user = userService.addUser("Alice", "socket-before");

        const updatedUser = userService.updateSocketId(user.getId(), "socket-after");

        expect(updatedUser).toBe(user);
        expect(userState.getUserById(user.getId())).toBe(user);
        expect(userState.getUserById(user.getId())?.getSocketId()).toBe("socket-after");
    });

    test("存在しない ID の更新は UserState に User を追加しないこと", async () => {
        const { userService } = await import("../../../../src/server/features/user/UserService");
        const { userState } = await import("../../../../src/server/features/user/UserState");

        expect(userService.updateSocketId(999, "socket-after")).toBeUndefined();
        expect(userState.getUserById(999)).toBeUndefined();
    });
});
