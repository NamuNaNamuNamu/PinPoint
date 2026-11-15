/** サーバー運用ログで使用する、検索可能な業務イベント名。 */
export const ServerLogEvents = {
    SOCKET_CONNECTED: "socket.connected",
    SOCKET_DISCONNECTED: "socket.disconnected",
    USER_REGISTERED: "user.registered",
    USER_SOCKET_ID_UPDATED: "user.socket_id_updated",
    USER_NAME_UPDATED: "user.name_updated",
    ROOM_JOINED: "room.joined",
    ROOM_DISCONNECT_GRACE_STARTED: "room.disconnect_grace_started",
    ROOM_DISCONNECT_RECOVERED: "room.disconnect_recovered",
    ROOM_LEFT: "room.left",
    ANSWER_BAR_ASSIGNED: "answer_bar.assigned",
    ANSWER_BAR_REMOVED: "answer_bar.removed",
    QUESTION_APPLIED: "question.applied",
    QUESTION_REVEALED: "question.revealed",
    QUESTION_SCORED: "question.scored",
    SCORES_RESET: "scores.reset",
    SCORES_CORRECTED: "scores.corrected",
    SCORES_REPORT_DOWNLOADED: "scores.report_downloaded",
    SCORE_LIST_ENABLED_UPDATED: "score_list.enabled_updated",
    COMMAND_REJECTED: "command.rejected",
    SERVER_UNEXPECTED_ERROR: "server.unexpected_error",
} as const;

export type ServerLogEvent = (typeof ServerLogEvents)[keyof typeof ServerLogEvents];
