import type { ExcalidrawElement } from "@excalidraw/excalidraw/element/types";
import type { AnswerBarPositionUpdateRequest } from "../answerBar/AnswerBarEvents";

/**
 * ルーム参加要求と、再接続時に限るローカル復元候補。
 */
export type JoinRoomRequest = {
    userId: number;
    roomId: string;
    /** 初回入室では省略し、再接続時のみ送信する。 */
    recovery?: {
        answerBarPositions: readonly AnswerBarPositionUpdateRequest[];
        elements: readonly ExcalidrawElement[];
    };
};
