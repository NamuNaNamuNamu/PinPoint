import { userService } from "../user/UserService";
import { Room } from "./Room";

/**
 * アプリケーション内のルーム状態を管理する。
 */
export class RoomState {
    private rooms: Room[];

    /**
     * 空のルーム状態を生成する。
     */
    constructor() {
        this.rooms = [];
    }

    /**
     * ルーム ID に一致するルームを取得する。
     *
     * @param id 検索するルーム ID。
     * @returns 一致したルーム。存在しない場合は `undefined`。
     */
    private getRoomById(id: string): Room | undefined {
        return this.rooms.find((room) => room.getId() === id);
    }

    /**
     * ソケット ID を持つルームを取得する。
     *
     * @param socketId 検索するソケット ID。
     * @returns 一致したルーム。存在しない場合は `undefined`。
     */
    private getRoomBySocketId(socketId: string): Room | undefined {
        return this.rooms.find((room) => room.getSocketIds().includes(socketId));
    }

    /**
     * ソケット ID に対応するルーム ID を取得する。
     *
     * @param socketId 検索するソケット ID。
     * @returns ルーム ID。存在しない場合は `undefined`。
     */
    public getRoomIdBySocketId(socketId: string): string | undefined {
        return this.getRoomBySocketId(socketId)?.getId();
    }

    /**
     * すべてのルームに対してコールバックを実行する。
     *
     * @param callback 各ルームに対して実行する処理。
     */
    public forEachRoom(callback: (room: Room) => void): void {
        this.rooms.forEach(callback);
    }

    /**
     * 一意な ID を持つ空のルームを追加する。
     *
     * @returns 追加したルーム。
     */
    public addRoom(): Room {
        let roomId: string;

        do {
            roomId = crypto.randomUUID();
        } while (this.getRoomById(roomId) !== undefined);

        const room: Room = new Room({ id: roomId });

        this.rooms.push(room);

        return room;
    }

    /**
     * ユーザーを指定したルームに参加させる。
     *
     * @param userId 参加するユーザー ID。
     * @param roomId 参加先のルーム ID。
     * @returns ルームとユーザーが存在して参加できた場合は `true`。
     */
    public join(userId: number, roomId: string): boolean {
        const room = this.getRoomById(roomId);

        if (!room) {
            return false;
        }

        const user = userService.getUser(userId);

        if (!user) {
            return false;
        }

        room.addUser(user);
        return true;
    }

    /**
     * ユーザーを全ルームから削除し、空になったルームを削除する。
     *
     * @param userId 退出するユーザー ID。
     */
    public leave(userId: number): void {
        for (const room of this.rooms) {
            room.removeUserById(userId);

            if (room.isEmpty()) {
                this.rooms = this.rooms.filter((r) => r.getId() !== room.getId());
            }
        }
    }
}

export const roomState = new RoomState();
