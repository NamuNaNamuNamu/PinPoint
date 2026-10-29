/**
 * 接続中のユーザーを表す。
 */
export class User {
    private id: number;
    private name: string;
    private socketId: string;

    /**
     * ユーザーを生成する。
     *
     * @param params ユーザーの初期設定。
     */
    constructor(params: UserParams) {
        this.id = params.id;
        this.name = params.name;
        this.socketId = params.socketId;
    }

    /**
     * ユーザー ID を取得する。
     *
     * @returns ユーザー ID。
     */
    public getId(): number {
        return this.id;
    }

    /**
     * ユーザー名を取得する。
     *
     * @returns ユーザー名。
     */
    public getName(): string {
        return this.name;
    }

    /**
     * ユーザー名を更新する。
     *
     * @param name 更新後のユーザー名。
     */
    public setName(name: string): void {
        this.name = name;
    }

    /**
     * 接続中のソケット ID を取得する。
     *
     * @returns ソケット ID。
     */
    public getSocketId(): string {
        return this.socketId;
    }

    /**
     * 接続中のソケット ID を更新する。
     *
     * @param socketId 更新後のソケット ID。
     */
    public setSocketId(socketId: string): void {
        this.socketId = socketId;
    }
}

/**
 * `User` を生成するための初期設定を表す。
 */
export interface UserParams {
    id: number;
    name: string;
    socketId: string;
}
