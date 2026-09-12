import { jest } from "@jest/globals";
import { User } from "../../../../src/server/features/user/User";

const mockUserState = {
    addUser: jest.fn(),
    getUserById: jest.fn(),
    getUserBySocketId: jest.fn(),
    updateUser: jest.fn(),
};

const mockUserLogger = {
    outputUserState: jest.fn(),
};

jest.unstable_mockModule("../../../../src/server/features/user/UserState", () => ({
    userState: mockUserState,
}));

jest.unstable_mockModule("../../../../src/server/logging/UserLogger", () => ({
    userLogger: mockUserLogger,
}));

// モック登録後にテスト対象をimport
const { UserService } = await import("../../../../src/server/features/user/UserService");
type UserServiceInstance = InstanceType<typeof UserService>;

/**
 * UserService の単体テスト。
 *
 * UserState と UserLogger をモックし、UserService 自身の責務である
 * User の生成、状態操作の委譲、戻り値を確認する。
 */
describe("UserService", () => {
    let userService: UserServiceInstance;

    beforeEach(() => {
        userService = new UserService();

        mockUserState.addUser.mockReset();
        mockUserState.getUserById.mockReset();
        mockUserState.getUserBySocketId.mockReset();
        mockUserState.updateUser.mockReset();
        mockUserLogger.outputUserState.mockReset();
    });

    describe("addUser", () => {
        test("連番の ID を持つ User を生成して UserState に追加し、生成した User を返すこと", () => {
            const firstUser = userService.addUser("Alice", "socket-1");
            const secondUser = userService.addUser("Bob", "socket-2");

            expect(firstUser).toBeInstanceOf(User);
            expect(firstUser.getId()).toBe(1);
            expect(firstUser.getName()).toBe("Alice");
            expect(firstUser.getSocketId()).toBe("socket-1");
            expect(secondUser.getId()).toBe(2);
            expect(secondUser.getName()).toBe("Bob");
            expect(secondUser.getSocketId()).toBe("socket-2");
            expect(mockUserState.addUser).toHaveBeenCalledTimes(2);
            expect(mockUserState.addUser).toHaveBeenNthCalledWith(1, firstUser);
            expect(mockUserState.addUser).toHaveBeenNthCalledWith(2, secondUser);
            expect(mockUserLogger.outputUserState).toHaveBeenCalledTimes(2);
            expect(mockUserLogger.outputUserState).toHaveBeenNthCalledWith(1, {
                event: "追加",
                userId: firstUser.getId(),
            });
            expect(mockUserLogger.outputUserState).toHaveBeenNthCalledWith(2, {
                event: "追加",
                userId: secondUser.getId(),
            });
        });
    });

    describe("getUser", () => {
        test("ID を UserState に委譲して取得結果をそのまま返すこと", () => {
            const user = createUser({ id: 10 });
            mockUserState.getUserById.mockReturnValue(user);

            expect(userService.getUser(10)).toBe(user);
            expect(mockUserState.getUserById).toHaveBeenCalledWith(10);
        });

        test("ID が undefined の場合は UserState を参照せず undefined を返すこと", () => {
            expect(userService.getUser(undefined)).toBeUndefined();
            expect(mockUserState.getUserById).not.toHaveBeenCalled();
        });
    });

    describe("getUserBySocketId", () => {
        test("socketId を UserState に委譲して取得結果をそのまま返すこと", () => {
            const user = createUser({ id: 10, socketId: "socket-10" });
            mockUserState.getUserBySocketId.mockReturnValue(user);

            expect(userService.getUserBySocketId("socket-10")).toBe(user);
            expect(mockUserState.getUserBySocketId).toHaveBeenCalledWith("socket-10");
        });

        test("socketId が undefined の場合は UserState を参照せず undefined を返すこと", () => {
            expect(userService.getUserBySocketId(undefined)).toBeUndefined();
            expect(mockUserState.getUserBySocketId).not.toHaveBeenCalled();
        });
    });

    describe("updateSocketId", () => {
        test("取得できた User の socketId を更新して UserState に更新を委譲し、User を返すこと", () => {
            const user = createUser({ id: 10, socketId: "before" });
            mockUserState.getUserById.mockReturnValue(user);

            const result = userService.updateSocketId(10, "after");

            expect(result).toBe(user);
            expect(user.getSocketId()).toBe("after");
            expect(mockUserState.updateUser).toHaveBeenCalledWith(user);
        });

        test("対象 User が存在しない場合は更新せず undefined を返すこと", () => {
            mockUserState.getUserById.mockReturnValue(undefined);

            expect(userService.updateSocketId(999, "after")).toBeUndefined();
            expect(mockUserState.updateUser).not.toHaveBeenCalled();
        });
    });
});

/**
 * 指定されたパラメータをもとに User インスタンスを生成する。
 *
 * name と socketId が省略された場合は、id をもとにしたデフォルト値を設定する。
 *
 * @param params User の生成に使用するパラメータ
 * @param params.id ユーザーID
 * @param params.name ユーザー名。省略時は `user{id}` を設定する
 * @param params.socketId Socket.IO のソケットID。省略時は `socket{id}` を設定する
 * @returns 生成した User インスタンス
 */
function createUser(params: { id: number; name?: string; socketId?: string }): User {
    return new User({
        id: params.id,
        name: params.name ?? `user${params.id}`,
        socketId: params.socketId ?? `socket${params.id}`,
    });
}
