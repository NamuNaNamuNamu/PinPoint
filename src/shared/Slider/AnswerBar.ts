import { Line } from "../excalidraw/Elements/Line/Line";
import { lineSkeletonFactory } from "../excalidraw/Elements/Line/LineSkeletonFactory";
import type { MoveRange } from "../excalidraw/Elements/Line/MoveRange";

// TODO-codex:
// - answerBar のそばに対応するユーザーの名前を出すようにしたい
//     - ただし、出す時の高さに差を出す。x 軸初期配置と同じく、slot に応じて y 軸方向に同じ位置に名前を出す。
//     - answerBarを移動させたら、名前も同様についてくるようにする
//     - 名前表示はかなり薄字で出力する。すでに用意している Text を使うことを想定している。

/**
 * AnswerBar の論理スロットに割り当てる描画色。
 */
const ANSWER_BAR_COLORS = [
    "#E53935",
    "#1E88E5",
    "#43A047",
    "#FB8C00",
    "#8E24AA",
    "#00ACC1",
    "#FDD835",
    "#D81B60",
    "#6D4C41",
    "#546E7A",
] as const;

/** 1 人の回答者に対応する、Slider 内の 1 本の可動線を表す。 */
export class AnswerBar {
    /**
     * AnswerBar を識別するサーバー発行 ID。
     */
    private readonly answerBarId: string;
    /**
     * この AnswerBar を操作できる所有ユーザー ID。
     */
    private readonly ownerUserId: number;
    /**
     * AnswerBar を描画・移動制限する線要素。
     */
    private readonly line: Line;

    /**
     * AnswerBar を初期化する。
     *
     * @param params 所有者、線要素、配置位置および操作ユーザーの情報。
     */
    constructor(params: AnswerBarParams) {
        this.answerBarId = params.answerBarId;
        this.ownerUserId = params.ownerUserId;
        this.line = new Line({
            skeleton: lineSkeletonFactory.createWith({
                id: params.lineId,
                x: params.x,
                y: params.y,
                width: params.height,
                strokeColor: ANSWER_BAR_COLORS[params.slot % ANSWER_BAR_COLORS.length],
                locked: !this.isOwnedBy(params.operatorUserId),
            }),
            moveRange: params.moveRange,
        });
    }

    /**
     * AnswerBar を識別するサーバー発行 ID を取得する。
     *
     * @returns AnswerBar を識別するサーバー発行 ID。
     */
    public getAnswerBarId(): string {
        return this.answerBarId;
    }
    /**
     * Excalidraw scene 内の line ID を取得する。
     *
     * @returns Excalidraw scene 内の line ID。
     */
    public getLineId(): string {
        return this.line.getId();
    }
    /**
     * AnswerBar を描画するための Line skeleton を取得する。
     *
     * @returns AnswerBar を描画するための Line skeleton。
     */
    public getSkeleton() {
        return this.line.getSkeleton();
    }
    /**
     * 指定ユーザーがこの AnswerBar の所有者かを判定する。
     *
     * @param operatorUserId 操作するユーザー ID。
     * @returns 所有者の場合は `true`。
     */
    public isOwnedBy(operatorUserId: number): boolean {
        return this.ownerUserId === operatorUserId;
    }
    /**
     * 所有者だけに Line の座標・形状補正を委譲する。
     *
     * @param operatorUserId 操作するユーザー ID。
     */
    public onChange(operatorUserId: number): void {
        if (this.isOwnedBy(operatorUserId)) {
            this.line.onChange();
        }
    }
}
/**
 * AnswerBar の生成に必要なパラメータ。
 */
interface AnswerBarParams {
    /**
     * AnswerBar を識別するサーバー発行 ID。
     */
    answerBarId: string;
    /**
     * AnswerBar を操作できる所有ユーザー ID。
     */
    ownerUserId: number;
    /**
     * AnswerBar の操作を行うユーザー ID。
     */
    operatorUserId: number;
    /**
     * Excalidraw scene 内の線要素 ID。
     */
    lineId: string;
    /**
     * AnswerBar の初期 X 座標。
     */
    x: number;
    /**
     * AnswerBar の初期 Y 座標。
     */
    y: number;
    /**
     * AnswerBar の高さ。
     */
    height: number;
    /**
     * AnswerBar が移動できる座標範囲。
     */
    moveRange: MoveRange;
    /**
     * AnswerBar の初期位置と描画色を決める論理スロット。
     */
    slot: number;
}
