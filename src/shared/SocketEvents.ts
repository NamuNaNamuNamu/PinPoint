/**
 * クライアントとサーバー間で使用する Socket.IO イベント名。
 */
export const SocketEvents = {
    /** ユーザー登録を要求するイベント。 */
    REGISTER_USER: "user-register",
    /** ユーザーIDを指定してユーザー情報を取得するイベント。 */
    GET_USER: "get-user",
    /** ユーザーの Socket.IO 接続 ID を更新するイベント。 */
    UPDATE_SOCKET_ID: "update-socket-id",
    /** ルーム作成を要求するイベント。 */
    CREATE_ROOM: "create-room",
    /** ルーム参加を要求するイベント。 */
    JOIN_ROOM: "join-room",
    /** ルーム退出を要求するイベント。 */
    LEAVE_ROOM: "leave-room",
    /** 接続中のソケットが所属するルーム ID を取得するイベント。 */
    GET_ROOM_ID: "get-room-id",
    /** Excalidraw 要素の同期を要求するイベント。 */
    SYNC_ELEMENTS: "send-elements",
    /** カーソル位置の同期を要求・通知するイベント。 */
    SYNC_CURSOR: "sync-cursor",
    /** カーソルの削除を通知するイベント。 */
    REMOVE_CURSOR: "remove-cursor",
    /** AnswerBar の追加を通知するイベント。 */
    ANSWER_BAR_ADDED: "answer-bar-added",
    /** AnswerBar の削除を通知するイベント。 */
    ANSWER_BAR_REMOVED: "answer-bar-removed",
} as const;
