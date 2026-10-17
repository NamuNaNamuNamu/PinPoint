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
     * AnswerBar のそばに表示する所有ユーザー名。
     */
    ownerUserName: string;
    /**
     * `sliders` の定義順に対応する、サーバー発行の Excalidraw line ID。
     */
    lineIds: readonly string[];
    /**
     * `sliders` の定義順に対応する、サーバー発行の Excalidraw name label ID。
     */
    labelIds: readonly string[];
    /**
     * 各 Slider 内の初期位置を表す論理スロット。
     */
    slot: number;
};

/**
 * AnswerBar を全 Slider と scene から除去するための情報。
 */
export type AnswerBarRemoved = {
    /**
     * AnswerBar を識別するサーバー発行 ID。
     */
    answerBarId: string;
    /**
     * 削除する line 要素の ID。
     */
    lineIds: readonly string[];
    /**
     * 削除する名前ラベル要素の ID。
     */
    labelIds: readonly string[];
};
