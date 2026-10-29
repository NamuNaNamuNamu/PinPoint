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
    /** 接続中ユーザーの名前を更新するイベント。 */
    UPDATE_USER_NAME: "update-user-name",
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
    /** AnswerBar の所有者名更新を通知するイベント。 */
    ANSWER_BAR_OWNER_NAME_UPDATED: "answer-bar-owner-name-updated",
    /** 問題をルームへ適用するイベント。 */
    APPLY_QUESTION: "apply-question",
    /** 現在の問題の正解を表示するイベント。 */
    REVEAL_QUESTION: "reveal-question",
    /** サーバーが適用した問題を通知するイベント。 */
    QUESTION_APPLIED: "question-applied",
    /** サーバーが現在の問題の正解表示を通知するイベント。 */
    QUESTION_REVEALED: "question-revealed",
    /**
     * 現在問題に対する管理外要素削除・スクロールを要求するイベント。
     */
    CONTROL_CURRENT_QUESTION: "control-current-question",
    /**
     * 現在問題のコンテンツへ表示範囲を合わせることを通知するイベント。
     */
    QUESTION_SCROLL_TO_CONTENT: "question-scroll-to-content",
    /** 現在問題に属さない要素をクライアントから除去する通知。 */
    QUESTION_REMOVE_EXTERNAL_ELEMENTS: "question-remove-external-elements",
    /**
     * ルームの累積得点を通知するイベント。
     */
    SCORES_UPDATED: "scores-updated",
    /**
     * 累積得点を 0 に戻す要求。
     */
    RESET_SCORES: "reset-scores",
    /** 得点一覧の表示可否を変更する要求。 */
    SET_SCORE_LIST_ENABLED: "set-score-list-enabled",
    /** 得点一覧の表示可否を通知するイベント。 */
    SCORE_LIST_ENABLED_UPDATED: "score-list-enabled-updated",
} as const;
