import type { ExcalidrawElement } from "@excalidraw/excalidraw/element/types";

import type { AnswerBarPositionUpdateRequest } from "../answerBar/AnswerBarEvents";

/**
 * ルーム参加要求と、再接続時に限るローカル復元候補。
 */
export type JoinRoomRequest = {
    userId: number;
    roomId: string;
    /**
     * 初回入室では省略し、再接続時のみ送信する。
     */
    recovery?: {
        answerBarPositions: readonly AnswerBarPositionUpdateRequest[];
        elements: readonly ExcalidrawElement[];
    };
};

/**
 * 入室に成功したルームと、入室ユーザーに対する作成者権限。
 */
export type JoinRoomResponse = {
    roomId: string;
    isCreator: boolean;
};

/**
 * ホストが確認する現在の参加者。
 *
 * 切断猶予中の参加者も一覧に残す。
 */
export type RoomParticipant = {
    userId: number;
    userName: string;
    isCreator: boolean;
    connectionStatus: "connected" | "reconnecting";
};
