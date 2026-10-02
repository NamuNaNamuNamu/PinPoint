/**
 * サーバーが発行し、全 Slider に共通で適用する AnswerBar の割当情報。
 */
export type AnswerBarAdded = {
    /**
     * AnswerBar を識別するサーバー発行 ID。
     */
    answerBarId: string;
    /**
     * AnswerBar を操作できる所有ユーザー ID。
     */
    ownerUserId: number;
    /**
     * `sliders` の定義順に対応する、サーバー発行の Excalidraw line ID。
     */
    lineIds: readonly string[];
    /**
     * 各 Slider 内の初期位置を表す論理スロット。
     */
    slot: number;
};

/**
 * AnswerBar を全 Slider と scene から除去するための情報。
 */
export type AnswerBarRemoved = {
    answerBarId: string;
    lineIds: readonly string[];
};
