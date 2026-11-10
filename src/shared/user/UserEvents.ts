/**
 * 既存ユーザーと現在の Socket.IO 接続を対応付ける要求。
 *
 * Socket ID は送信元 Socket からサーバーが取得するため、クライアントは指定しない。
 */
export type UpdateSocketIdRequest = {
    userId: number | undefined;
};
