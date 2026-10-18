import type { AnswerBarAdded } from "../../../../shared/answerBar/AnswerBarEvents";
import type { MoveRange } from "../Elements/Line/MoveRange";
import { Rectangle } from "../Elements/Rectangle/Rectangle";
import { rectangleSkeletonFactory } from "../Elements/Rectangle/RectangleSkeletonFactory";
import { Text } from "../Elements/Text/Text";
import { textSkeletonFactory } from "../Elements/Text/TextSkeletonFactory";
import { AnswerBar } from "./AnswerBar";

/**
 * 回答欄そのもの。長方形、AnswerBar、名前表示から構成される。
 */
export class Slider {
    /**
     * 回答バー群。
     */
    private readonly answerBars: AnswerBar[] = [];
    /**
     * 回答欄の外枠となる長方形。
     */
    private readonly rectangle: Rectangle;
    /**
     * 回答欄の下部に表示する名前テキスト。
     */
    private readonly name: Text;
    /**
     * 回答バーの移動範囲。
     */
    private readonly moveRange: MoveRange;
    /**
     * 回答欄の左上の X 座標。
     */
    private readonly x: number;
    /**
     * 回答欄の幅。
     */
    private readonly width: number;
    private readonly y: number;
    /**
     * 回答欄の高さ。
     */
    private readonly height: number;

    /**
     * 指定した位置と大きさで回答欄を初期化する。
     *
     * @param params 回答欄の識別子、位置、幅、高さ。
     */
    constructor({ id, name, x, y, width, height }: Params) {
        this.x = x;
        this.width = width;
        this.y = y;
        this.height = height;
        this.moveRange = { minX: x, maxX: x + width, minY: y, maxY: y };
        this.rectangle = new Rectangle({
            skeleton: rectangleSkeletonFactory.createWith({ id: `rectangle-${id}`, x, y, width, height, locked: true }),
        });
        this.name = new Text({
            skeleton: textSkeletonFactory.createWith({
                id: `text-${id}`,
                x: x + width / 2,
                y: y + height * 1.1,
                text: name,
                locked: true,
                opacity: 100,
            }),
        });
    }

    /**
     * AnswerBar を追加する。
     *
     * 同じ AnswerBar、line ID、label ID が存在する場合は何もしない。
     *
     * @param params AnswerBar の割当情報、この Slider 用の要素 ID、および操作ユーザー ID。
     * @returns 追加した AnswerBar。重複時は `undefined`。
     */
    public addAnswerBar(
        params: AnswerBarAdded & { lineId: string; labelId: string; operatorUserId: number },
    ): AnswerBar | undefined {
        const alreadyExists = this.answerBars.some(
            (answerBar) =>
                answerBar.getAnswerBarId() === params.answerBarId ||
                answerBar.getLineId() === params.lineId ||
                answerBar.getLabelId() === params.labelId,
        );
        if (alreadyExists) {
            return undefined;
        }
        const answerBar = new AnswerBar({
            answerBarId: params.answerBarId,
            ownerUserId: params.ownerUserId,
            ownerUserName: params.ownerUserName,
            operatorUserId: params.operatorUserId,
            lineId: params.lineId,
            labelId: params.labelId,
            x: this.getInitialX(params.slot),
            y: this.y,
            labelY: this.getInitialLabelY(params.slot),
            height: this.height,
            moveRange: this.getMoveRange(),
            slot: params.slot,
        });
        this.answerBars.push(answerBar);
        return answerBar;
    }

    /**
     * 指定した AnswerBar を削除する。
     *
     * @param answerBarId 削除する AnswerBar ID。
     * @returns 削除した AnswerBar。存在しない場合は `undefined`。
     */
    public removeAnswerBar(answerBarId: string): AnswerBar | undefined {
        const index = this.answerBars.findIndex((answerBar) => answerBar.getAnswerBarId() === answerBarId);
        return index === -1 ? undefined : this.answerBars.splice(index, 1)[0];
    }

    /**
     * 登録済み AnswerBar ごとに処理を実行する。
     *
     * @param callback 各 AnswerBar に対して実行する処理。
     */
    public forEachAnswerBar(callback: (answerBar: AnswerBar) => void): void {
        this.answerBars.forEach(callback);
    }

    /**
     * AnswerBar が移動できる座標範囲を取得する。
     *
     * @returns AnswerBar が移動できる座標範囲。
     */
    private getMoveRange() {
        return this.moveRange;
    }

    /**
     * slot に対応する、二分割を段階的に細分化した比率を取得する。
     *
     * @param slot 中央、四分割、八分割の順に割り当てる論理スロット。
     * @returns 領域の始点から終点までの比率。
     */
    private getSlotRatio(slot: number): number {
        const level = Math.floor(Math.log2(slot + 1));
        const firstSlotInLevel = 2 ** level - 1;
        const numerator = 2 * (slot - firstSlotInLevel) + 1;
        const denominator = 2 ** (level + 1);
        return numerator / denominator;
    }

    /**
     * slot に対応する AnswerBar の初期 X 座標を取得する。
     *
     * @param slot AnswerBar の論理スロット。
     * @returns Slider 内での初期 X 座標。
     */
    private getInitialX(slot: number): number {
        return this.x + this.width * this.getSlotRatio(slot);
    }

    /**
     * slot に対応する名前ラベルの固定 Y 座標を取得する。
     *
     * @param slot AnswerBar の論理スロット。
     * @returns Slider 内での名前ラベルの Y 座標。
     */
    private getInitialLabelY(slot: number): number {
        return this.y + this.height * this.getSlotRatio(slot);
    }

    /**
     * 回答欄を構成する全要素のスケルトンを取得する。
     *
     * @returns 長方形、名前テキスト、AnswerBar の順に並べたスケルトン。
     */
    getSkeleton() {
        return [
            this.rectangle.getSkeleton(),
            this.name.getSkeleton(),
            ...this.answerBars.flatMap((answerBar) => answerBar.getSkeletons()),
        ];
    }
}

/**
 * 回答欄の生成に必要なパラメータ。
 */
interface Params {
    /**
     * 回答欄の識別子。
     */
    id: string;
    /** Slider の下部に表示する名称。 */
    name: string;
    /**
     * 回答欄の左上の X 座標。
     */
    x: number;
    /**
     * 回答欄の左上の Y 座標。
     */
    y: number;
    /**
     * 回答欄の幅。
     */
    width: number;
    /**
     * 回答欄の高さ。
     */
    height: number;
}
