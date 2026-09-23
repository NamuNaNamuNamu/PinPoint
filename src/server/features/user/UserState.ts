import type { User } from "./User";

/**
 * ユーザーの状態を管理するクラス。
 *
 * ユーザーの追加・取得・更新、および
 * 登録されている全ユーザーに対する処理を提供する。
 */
export class UserState {
    /** 管理対象のユーザー一覧。 */
    private users: User[];

    /**
     * UserStateを生成する。
     *
     * 初期状態ではユーザーは登録されていない。
     */
    constructor() {
        this.users = [];
    }

    /**
     * 指定したユーザーIDに一致するユーザーを取得する。
     *
     * @param id 取得対象のユーザーID
     * @returns 一致するユーザー。存在しない場合は undefined
     */
    public getUserById(id: number): User | undefined {
        return this.users.find((user) => user.getId() === id);
    }

    /**
     * 指定した Socket ID に一致するユーザーを取得する。
     *
     * @param socketId 取得対象の Socket ID
     * @returns 一致するユーザー。存在しない場合は undefined
     */
    public getUserBySocketId(socketId: string): User | undefined {
        return this.users.find((user) => user.getSocketId() === socketId);
    }

    /**
     * 登録されているすべてのユーザーに対して、
     * 追加された順にコールバック関数を実行する。
     *
     * @param callback 各ユーザーに対して実行する処理
     *
     * @example
     * // 全ユーザーの名前をコンソールへ出力する
     * userState.forEachUser((user) => {
     *     console.log(user.getName());
     * });
     *
     * @example
     * // 全ユーザーに対してメッセージを送信する
     * userState.forEachUser((user) => {
     *     sendMessage(user.getSocketId(), "Hello!");
     * });
     */
    public forEachUser(callback: (user: User) => void): void {
        this.users.forEach(callback);
    }

    /**
     * ユーザーを追加する。
     *
     * @param user 追加するユーザー
     */
    public addUser(user: User): void {
        this.users.push(user);
    }

    /**
     * 指定されたユーザーと同じIDを持つユーザーを更新する。
     *
     * 同じIDを持つユーザーが存在しない場合は何も行わない。
     *
     * @param user 更新後のユーザー
     */
    public updateUser(user: User): void {
        const index = this.users.findIndex((existingUser) => existingUser.getId() === user.getId());

        if (index === -1) {
            return;
        }

        this.users[index] = user;
    }
}

/**
 * アプリケーション全体で共有するユーザー状態。
 */
export const userState = new UserState();
