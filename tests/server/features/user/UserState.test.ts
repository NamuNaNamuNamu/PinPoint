import { User } from "../../../../src/server/features/user/User";
import { UserState } from "../../../../src/server/features/user/UserState";
import { jest } from "@jest/globals";

/**
 * UserState の単体テスト。
 */
describe("UserState", () => {
    let userState: UserState;

    beforeEach(() => {
        userState = new UserState();
    });

    /**
     * ユーザーIDをもとに、ユーザーを取得できることを確認する。
     */
    describe("getUserById", () => {
        test("取得対象ユーザーIDを持つユーザーがいない場合は undefined を返すこと", () => {
            expect(userState.getUserById(1)).toBeUndefined();
        });

        test("取得対象ユーザーIDを持つユーザーを返すこと", () => {
            const user = createUser({ id: 1 });
            const anotherUser = createUser({ id: 2 });
            userState.addUser(user);
            userState.addUser(anotherUser);

            expect(userState.getUserById(1)).toBe(user);
        });
    });

    /**
     * socketIdをもとに、ユーザーを取得できることを確認する。
     */
    describe("getUserBySocketId", () => {
        test("取得対象 socketId を持つユーザーがいない場合は undefined を返すこと", () => {
            expect(userState.getUserBySocketId("socket-1")).toBeUndefined();
        });

        test("取得対象 socketId を持つユーザーを返すこと", () => {
            const user = createUser({ id: 1, socketId: "socket-1" });
            const anotherUser = createUser({ id: 2, socketId: "socket-2" });
            userState.addUser(user);
            userState.addUser(anotherUser);

            expect(userState.getUserBySocketId("socket-1")).toBe(user);
        });
    });

    /**
     * 全ユーザーに対して callback を行えることを確認する。
     */
    describe("forEachUser", () => {
        test("ユーザーがいない場合は callback を実行しないこと", () => {
            const callback = jest.fn();

            userState.forEachUser(callback);

            expect(callback).not.toHaveBeenCalled();
        });

        test("すべてのユーザーに対して追加順に callback を実行すること", () => {
            const firstUser = createUser({ id: 1 });
            const secondUser = createUser({ id: 2 });
            const visitedUsers: User[] = [];
            const callback = jest.fn((user: User) => visitedUsers.push(user));
            userState.addUser(firstUser);
            userState.addUser(secondUser);

            userState.forEachUser(callback);

            expect(callback).toHaveBeenCalledTimes(2);
            expect(visitedUsers).toEqual([firstUser, secondUser]);
        });
    });

    /**
     * ユーザーを追加できることを確認する。
     */
    describe("addUser", () => {
        test("追加したユーザーを取得できること", () => {
            const user = createUser({ id: 1 });

            userState.addUser(user);

            expect(userState.getUserById(1)).toBe(user);
        });
    });

    /**
     * ユーザーを更新できることを確認する。
     */
    describe("updateUser", () => {
        test("同じユーザーIDを持つユーザーに置き換えること", () => {
            const existingUser = createUser({ id: 1, name: "before" });
            const updatedUser = createUser({ id: 1, name: "after" });
            userState.addUser(existingUser);

            userState.updateUser(updatedUser);

            expect(userState.getUserById(1)).toBe(updatedUser);
        });

        test("更新対象ではないユーザーを変更しないこと", () => {
            const targetUser = createUser({ id: 1, name: "before" });
            const anotherUser = createUser({ id: 2 });
            const updatedUser = createUser({ id: 1, name: "after" });
            userState.addUser(targetUser);
            userState.addUser(anotherUser);

            userState.updateUser(updatedUser);

            expect(userState.getUserById(2)).toBe(anotherUser);
        });

        test("同じユーザーIDを持つユーザーがいない場合は追加しないこと", () => {
            const user = createUser({ id: 1 });

            userState.updateUser(user);

            expect(userState.getUserById(1)).toBeUndefined();
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
