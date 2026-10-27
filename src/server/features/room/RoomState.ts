import { randomUUID } from "node:crypto";

import { userService } from "../user/UserService";
import { Room } from "./Room";

/**
 * アプリケーション内のルーム状態を管理する。
 */
export class RoomState {
    private rooms: Room[];

    constructor() {
        this.rooms = [];
    }

    /**
     * ルーム ID に対応するルームを取得する。
     *
     * @param id 検索するルーム ID。
     * @returns 対応するルーム。存在しない場合は `undefined`。
     */
    public getRoomById(id: string): Room | undefined {
        return this.rooms.find((room) => room.getId() === id);
    }

    /**
     * Socket.IO 接続 ID が所属するルームを取得する。
     *
     * @param socketId 検索する Socket.IO 接続 ID。
     * @returns 接続が所属するルーム。存在しない場合は `undefined`。
     */
    private getRoomBySocketId(socketId: string): Room | undefined {
        return this.rooms.find((room) => room.getSocketIds().includes(socketId));
    }

    /**
     * Socket.IO 接続 ID が所属するルーム ID を取得する。
     *
     * @param socketId 検索する Socket.IO 接続 ID。
     * @returns 所属するルーム ID。存在しない場合は `undefined`。
     */
    public getRoomIdBySocketId(socketId: string): string | undefined {
        return this.getRoomBySocketId(socketId)?.getId();
    }

    /**
     * ユーザー ID が所属するルーム ID を取得する。
     *
     * @param userId 検索するユーザー ID。
     * @returns 所属するルーム ID。存在しない場合は `undefined`。
     */
    public getRoomIdByUserId(userId: number): string | undefined {
        return this.rooms.find((room) => room.hasUser(userId))?.getId();
    }

    /**
     * 保持しているすべてのルームに処理を実行する。
     *
     * @param callback 各ルームに対して実行する処理。
     */
    public forEachRoom(callback: (room: Room) => void): void {
        this.rooms.forEach(callback);
    }

    /**
     * 一意な ID を持つルームを作成して保持する。
     *
     * @returns 作成したルーム。
     */
    public addRoom(creatorUserId: number): Room {
        let roomId: string;
        do {
            roomId = randomUUID();
        } while (this.getRoomById(roomId) !== undefined);

        const room: Room = new Room({ id: roomId, creatorUserId });
        this.rooms.push(room);
        return room;
    }

    /**
     * ユーザーを指定したルームへ追加する。
     *
     * @param userId 参加するユーザー ID。
     * @param roomId 参加先のルーム ID。
     * @returns ルームとユーザーが存在し、追加できた場合は `true`。
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
     * ユーザーを全ルームから削除し、空になったルームも削除する。
     *
     * @param userId 削除するユーザー ID。
     */
    public leave(userId: number): void {
        for (const room of this.rooms) {
            room.removeUserById(userId);
            if (room.isEmpty()) {
                this.rooms = this.rooms.filter((r) => r.getId() !== room.getId());
            }
        }
    }

    /**
     * 切断したユーザーを削除せず、再接続猶予用の世代トークンを記録する。
     *
     * @param userId 切断したユーザー ID。
     * @returns 対象ルーム ID と世代トークン。ルーム外の場合は `undefined`。
     */
    public markDisconnected(userId: number): { roomId: string; token: string } | undefined {
        const room = this.rooms.find((candidate) => candidate.hasUser(userId));
        if (!room) {
            return undefined;
        }
        const token = room.markDisconnected(userId);
        return token ? { roomId: room.getId(), token } : undefined;
    }

    /**
     * 指定トークンが有効な切断猶予である場合だけ退出させる。
     *
     * @param userId 退出候補のユーザー ID。
     * @param token 切断時に発行した世代トークン。
     * @returns ユーザーを削除したルーム ID。削除しない場合は `undefined`。
     */
    public leaveIfStillDisconnected(userId: number, token: string): string | undefined {
        const room = this.rooms.find((candidate) => candidate.hasUser(userId));
        if (!room || !room.removeIfStillDisconnected(userId, token)) {
            return undefined;
        }
        const roomId = room.getId();
        if (room.isEmpty()) {
            this.rooms = this.rooms.filter((candidate) => candidate.getId() !== roomId);
        }
        return roomId;
    }
}

export const roomState = new RoomState();
