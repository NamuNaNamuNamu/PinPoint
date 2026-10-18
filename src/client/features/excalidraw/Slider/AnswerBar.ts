import type { OrderedExcalidrawElement } from "@excalidraw/excalidraw/element/types";

import { Line } from "../Elements/Line/Line";
import { lineSkeletonFactory } from "../Elements/Line/LineSkeletonFactory";
import type { MoveRange } from "../Elements/Line/MoveRange";
import { Text } from "../Elements/Text/Text";
import { textSkeletonFactory } from "../Elements/Text/TextSkeletonFactory";

/**
 * AnswerBar の論理スロットに割り当てる描画色。
 */
const ANSWER_BAR_COLORS = [
    "#1E88E5",
    "#43A047",
    "#FB8C00",
    "#8E24AA",
    "#00ACC1",
    "#FDD835",
    "#6D4C41",
    "#546E7A",
] as const;

/**
 * 1 人の回答者に対応する、Slider 内の 1 本の可動線と名前ラベルを表す。
 */
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
     * AnswerBar の所有者名を表示するロック済みテキスト要素。
     */
    private readonly label: Text;
    /**
     * slot から決まる名前ラベルの固定 X 座標。
     */
    private readonly labelX: number;
    /**
     * slot から決まる名前ラベルの固定 Y 座標。
     */
    private readonly labelY: number;

    /**
     * AnswerBar を初期化する。
     *
     * @param params 所有者、線・ラベル要素、配置位置および操作ユーザーの情報。
     */
    constructor(params: AnswerBarParams) {
        this.answerBarId = params.answerBarId;
        this.ownerUserId = params.ownerUserId;
        this.labelX = params.x;
        this.labelY = params.labelY;
        const color = ANSWER_BAR_COLORS[params.slot % ANSWER_BAR_COLORS.length];
        this.line = new Line({
            skeleton: lineSkeletonFactory.createWith({
                id: params.lineId,
                x: params.x,
                y: params.y,
                width: params.height,
                strokeColor: color,
                locked: !this.isOwnedBy(params.operatorUserId),
            }),
            moveRange: params.moveRange,
        });
        this.label = new Text({
            skeleton: textSkeletonFactory.createWith({
                id: params.labelId,
                x: this.labelX,
                y: this.labelY,
                text: params.ownerUserName,
                strokeColor: color,
                locked: true,
                opacity: 25,
            }),
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
     * Excalidraw scene 内の名前ラベル ID を取得する。
     *
     * @returns Excalidraw scene 内の名前ラベル ID。
     */
    public getLabelId(): string {
        return this.label.getId();
    }

    /**
     * AnswerBar と名前ラベルを描画するための skeleton を取得する。
     *
     * @returns line と名前ラベルの skeleton。
     */
    public getSkeletons() {
        return [this.line.getSkeleton(), this.label.getSkeleton()];
    }

    /**
     * 初期ラベルの外枠中心を slot から算出した座標へ合わせる。
     *
     * @param elements Excalidraw への変換後の要素。
     * @returns 名前ラベルの座標を補正した要素。
     */
    public centerLabelInElements(elements: readonly OrderedExcalidrawElement[]): OrderedExcalidrawElement[] {
        return this.label.centerInElements(elements, this.labelX, this.labelY);
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
     * 所有者名ラベルを更新する。
     *
     * @param ownerUserName 更新後の所有者名。
     */
    public setOwnerUserName(ownerUserName: string): void {
        this.label.setText(ownerUserName);
    }

    /**
     * 所有者だけに Line の座標・形状補正を委譲し、名前ラベルを補正後の X 座標へ追従させる。
     *
     * @param operatorUserId 操作するユーザー ID。
     */
    public onChange(operatorUserId: number): void {
        if (this.isOwnedBy(operatorUserId)) {
            this.line.onChange();
            this.label.setCenterPosition(this.line.getX(), this.labelY);
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
     * AnswerBar を操作できる所有ユーザー名。
     */
    ownerUserName: string;
    /**
     * AnswerBar の操作を行うユーザー ID。
     */
    operatorUserId: number;
    /**
     * Excalidraw scene 内の線要素 ID。
     */
    lineId: string;
    /**
     * Excalidraw scene 内の名前ラベル ID。
     */
    labelId: string;
    /**
     * AnswerBar の初期 X 座標。
     */
    x: number;
    /**
     * AnswerBar の初期 Y 座標。
     */
    y: number;
    /**
     * 名前ラベルの固定 Y 座標
     */
    labelY: number;
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
