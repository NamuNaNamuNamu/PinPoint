/**
 * クライアントから送信するカーソル位置を表す。
 * 表示名と Socket.IO 接続 ID は、サーバーが付加するため含めない。
 */
export interface Cursor {
    pointer: {
        x: number;
        y: number;
        tool: "pointer" | "laser";
    };
    button: "up" | "down";
}

/**
 * 同一ルームの他クライアントへ中継するカーソル情報を表す。
 */
export interface RemoteCursor extends Cursor {
    socketId: string;
    username: string;
}
