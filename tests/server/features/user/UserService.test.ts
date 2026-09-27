import { jest } from "@jest/globals";
import { User } from "../../../../src/server/features/user/User";

const mockUserState = {
    addUser: jest.fn(),
    getUserById: jest.fn(),
    getUserBySocketId: jest.fn(),
    updateUser: jest.fn(),
};
const mockUserLogger = { outputUserState: jest.fn() };
jest.unstable_mockModule("../../../../src/server/features/user/UserState", () => ({ userState: mockUserState }));
jest.unstable_mockModule("../../../../src/server/logging/UserLogger", () => ({ userLogger: mockUserLogger }));
const { UserService } = await import("../../../../src/server/features/user/UserService");

describe("UserService", () => {
    let userService: InstanceType<typeof UserService>;
    beforeEach(() => {
        userService = new UserService();
        Object.values(mockUserState).forEach((fn) => fn.mockReset());
        mockUserLogger.outputUserState.mockReset();
    });

    test("addUser は連番の User を状態へ追加し、追加ログを出力する", () => {
        const firstUser = userService.addUser("Alice", "socket-1");
        const secondUser = userService.addUser("Bob", "socket-2");
        expect(firstUser).toBeInstanceOf(User);
        expect([firstUser.getId(), secondUser.getId()]).toEqual([1, 2]);
        expect([firstUser.getName(), secondUser.getName()]).toEqual(["Alice", "Bob"]);
        expect([firstUser.getSocketId(), secondUser.getSocketId()]).toEqual(["socket-1", "socket-2"]);
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

    test.each([[10], [undefined]])("getUser は ID を適切に処理する: %s", (id) => {
        const user = new User({ id: 10, name: "Alice", socketId: "socket-1" });
        mockUserState.getUserById.mockReturnValue(user);
        expect(userService.getUser(id)).toBe(id === undefined ? undefined : user);
        expect(mockUserState.getUserById).toHaveBeenCalledTimes(id === undefined ? 0 : 1);
    });

    test.each([["socket-1"], [undefined]])("getUserBySocketId は socketId を適切に処理する: %s", (socketId) => {
        const user = new User({ id: 10, name: "Alice", socketId: "socket-1" });
        mockUserState.getUserBySocketId.mockReturnValue(user);
        expect(userService.getUserBySocketId(socketId)).toBe(socketId === undefined ? undefined : user);
        expect(mockUserState.getUserBySocketId).toHaveBeenCalledTimes(socketId === undefined ? 0 : 1);
    });

    test("updateSocketId は既存ユーザーを更新して状態更新と変更ログを出力する", () => {
        const user = new User({ id: 10, name: "Alice", socketId: "before" });
        mockUserState.getUserById.mockReturnValue(user);
        expect(userService.updateSocketId(10, "after")).toBe(user);
        expect(user.getSocketId()).toBe("after");
        expect(mockUserState.updateUser).toHaveBeenCalledWith(user);
        expect(mockUserLogger.outputUserState).toHaveBeenCalledWith({
            event: "socketId 更新 (before -> after)",
            userId: 10,
        });
    });

    test("updateSocketId は対象がない場合は状態もログも変更しない", () => {
        expect(userService.updateSocketId(99, "after")).toBeUndefined();
        expect(mockUserState.updateUser).not.toHaveBeenCalled();
        expect(mockUserLogger.outputUserState).not.toHaveBeenCalled();
    });
});
