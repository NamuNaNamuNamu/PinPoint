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
    /**
     * line ID ごとの現在の X 座標。問題適用時は slot に基づく初期値、
     * 現在状態通知時はサーバーが受理した最新値を持つ。
     */
    positionsByLineId?: Readonly<Record<string, number>>;
};

/** 所有者が送信する AnswerBar の位置更新要求。 */
export type AnswerBarPositionUpdateRequest = {
    answerBarId: string;
    lineId: string;
    x: number;
};

/** サーバーが正規化して配信する AnswerBar の位置更新。 */
export type AnswerBarPositionUpdated = AnswerBarPositionUpdateRequest;

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

/**
 * AnswerBar の所有者名を更新するための情報。
 */
export type AnswerBarOwnerNameUpdated = {
    /**
     * 更新対象の AnswerBar ID。
     */
    answerBarId: string;
    /**
     * 更新後の所有者名。
     */
    ownerUserName: string;
    /**
     * 更新する名前ラベル要素の ID。
     */
    labelIds: readonly string[];
};
