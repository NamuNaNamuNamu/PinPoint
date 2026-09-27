import type { User } from "../user/User";

/**
 * ユーザーが参加するルームを表す。
 */
export class Room {
    private id: string;
    private users: User[] = [];

    /**
     * ルームを生成する。
     *
     * @param params ルームの初期設定。
     */
    constructor(params: RoomParams) {
        this.id = params.id;
    }

    /**
     * ルーム ID を取得する。
     *
     * @returns ルーム ID。
     */
    public getId(): string {
        return this.id;
    }

    /**
     * ユーザーをルームに追加する。
     *
     * @param user 追加するユーザー。
     */
    public addUser(user: User): void {
        this.users.push(user);
    }

    /**
     * 指定した ID のユーザーをルームから削除する。
     *
     * @param userId 削除するユーザー ID。
     */
    public removeUserById(userId: number): void {
        this.users = this.users.filter((user) => user.getId() !== userId);
    }

    /**
     * 参加ユーザーのソケット ID 一覧を取得する。
     *
     * @returns 参加ユーザーのソケット ID 一覧。
     */
    public getSocketIds(): string[] {
        return this.users.map((user) => user.getSocketId());
    }

    /**
     * 参加ユーザーがいないかを判定する。
     *
     * @returns 参加ユーザーがいない場合は `true`。
     */
    public isEmpty(): boolean {
        return this.users.length === 0;
    }
}

/**
 * `Room` を生成するための初期設定を表す。
 */
interface RoomParams {
    id: string;
}
