import type { AnswerBarAdded } from "../answerBar/AnswerBarEvents";
import type { MoveRange } from "../excalidraw/Elements/Line/MoveRange";
import { Rectangle } from "../excalidraw/Elements/Rectangle/Rectangle";
import { rectangleSkeletonFactory } from "../excalidraw/Elements/Rectangle/RectangleSkeletonFactory";
import { Text } from "../excalidraw/Elements/Text/Text";
import { textSkeletonFactory } from "../excalidraw/Elements/Text/TextSkeletonFactory";
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
    /**
     * 回答欄の左上の Y 座標。
     */
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
    constructor({ id, x, y, width, height }: Params) {
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
                text: "名前",
                locked: true,
            }),
        });
    }

    /**
     * AnswerBar を追加する。
     *
     * 同じ AnswerBar または line ID が存在する場合は何もしない。
     *
     * @param params AnswerBar の割当情報、この Slider 用の line ID、および操作ユーザー ID。
     * @returns 追加した AnswerBar。重複時は `undefined`。
     */
    public addAnswerBar(params: AnswerBarAdded & { lineId: string; operatorUserId: number }): AnswerBar | undefined {
        const alreadyExists = this.answerBars.some(
            (answerBar) => answerBar.getAnswerBarId() === params.answerBarId || answerBar.getLineId() === params.lineId,
        );
        if (alreadyExists) {
            return undefined;
        }
        const answerBar = new AnswerBar({
            answerBarId: params.answerBarId,
            ownerUserId: params.ownerUserId,
            operatorUserId: params.operatorUserId,
            lineId: params.lineId,
            x: this.getInitialX(params.slot),
            y: this.y,
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
        if (index === -1) {
            return undefined;
        }
        return this.answerBars.splice(index, 1)[0];
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
     * slot に対応する AnswerBar の初期 X 座標を取得する。
     *
     * `0` を中央とし、以降は左・右へ交互に配置する。
     *
     * @param slot 中央、左、右の順で割り当てる論理スロット。
     * @returns この Slider 内での初期 X 座標。
     */
    private getInitialX(slot: number): number {
        if (slot === 0) {
            return this.x + this.width / 2;
        }
        const level = Math.ceil(slot / 2);
        const direction = slot % 2 === 1 ? -1 : 1;
        return this.x + this.width / 2 + direction * (this.width / 2 ** (level + 1));
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
            ...this.answerBars.map((answerBar) => answerBar.getSkeleton()),
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
