import { type DefaultEventsMap, Server } from "socket.io";

class SocketLogger {
    private io: Server<DefaultEventsMap, DefaultEventsMap, DefaultEventsMap, any> | null;

    constructor() {
        this.io = null;
    }

    /**
     * Socket.IO サーバーを設定する。
     *
     * @param io 設定する Socket.IO サーバー。
     */
    public setIo(io: Server<DefaultEventsMap, DefaultEventsMap, DefaultEventsMap, any>) {
        this.io = io;
    }

    /**
     * 接続中のすべての Socket をイベント情報とともに標準出力へ記録する。
     *
     * @param props 発生イベントと Socket ID。
     * @throws Socket.IO サーバーが未設定の場合。
     */
    public outputAllSockets({ event, socketId }: Props) {
        if (!this.io) {
            throw Error("io が未設定");
        }

        console.log("===== Sockets =====");
        console.log(`${event}: ${socketId}`);

        for (const socket of this.io.sockets.sockets.values()) {
            console.log({
                id: socket.id,
                rooms: [...socket.rooms],
                connected: socket.connected,
            });
        }

        console.log("=============\n");
    }
}

/**
 * Socket の状態を記録するイベントの情報。
 */
type Props = {
    event: string;
    socketId: string;
};

export const socketLogger = new SocketLogger();
