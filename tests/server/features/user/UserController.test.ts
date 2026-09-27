import { jest } from "@jest/globals";
import type { Socket } from "socket.io";

const mockUserService = { addUser: jest.fn(), getUser: jest.fn(), updateSocketId: jest.fn() };
jest.unstable_mockModule("../../../../src/server/features/user/UserService", () => ({ userService: mockUserService }));
const { userController } = await import("../../../../src/server/features/user/UserController");

describe("UserController", () => {
    beforeEach(() => Object.values(mockUserService).forEach((fn) => fn.mockReset()));
    test("registerUser は socket.id を指定して登録を委譲し、結果を返す", () => {
        const user = { getId: () => 1 };
        mockUserService.addUser.mockReturnValue(user);
        expect(userController.registerUser({ id: "socket-1" } as Socket, "Alice")).toBe(user);
        expect(mockUserService.addUser).toHaveBeenCalledWith("Alice", "socket-1");
    });
    test.each([1, undefined])("getUser は ID %s をそのまま委譲する", (id) => {
        userController.getUser(id);
        expect(mockUserService.getUser).toHaveBeenCalledWith(id);
    });
    test("updateSocketId は引数をそのまま委譲し、結果を返す", () => {
        const user = { getId: () => 1 };
        mockUserService.updateSocketId.mockReturnValue(user);
        expect(userController.updateSocketId(1, "after")).toBe(user);
        expect(mockUserService.updateSocketId).toHaveBeenCalledWith(1, "after");
    });
});
