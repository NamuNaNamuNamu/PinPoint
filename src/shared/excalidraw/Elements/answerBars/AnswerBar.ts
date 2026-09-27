import { Line } from "../Line/Line";
import { lineSkeletonFactory } from "../Line/LineSkeletonFactory";
import { Rectangle } from "../Rectangle/Rectangle";
import { rectangleSkeletonFactory } from "../Rectangle/RectangleSkeletonFactory";
import { Text } from "../Text/Text";
import { textSkeletonFactory } from "../Text/TextSkeletonFactory";

/**
 * 回答欄そのもの。長方形、可動線、名前表示から構成される。
 */
export class AnswerBar {
    /** 回答欄の中央に配置する可動線。 */
    private readonly line: Line;

    /** 回答欄の外枠となる長方形。 */
    private readonly rectangle: Rectangle;

    /** 回答欄の下部に表示する名前テキスト。 */
    private readonly name: Text;

    /**
     * 指定した位置と大きさで回答欄を初期化する。
     *
     * @param params 回答欄の識別子、位置、幅、高さ。
     */
    constructor({ id, x, y, width, height }: Params) {
        this.line = new Line({
            skeleton: lineSkeletonFactory.createWith({
                id: `line-${id}`,
                x: x + width / 2,
                y: y,
                width: height, // 長方形の高さが線の長さ
                locked: false,
            }),
            moveRange: {
                minX: x,
                maxX: x + width,
                minY: y,
                maxY: y,
            },
        });
        this.rectangle = new Rectangle({
            skeleton: rectangleSkeletonFactory.createWith({
                id: `rectangle-${id}`,
                x: x,
                y: y,
                width: width,
                height: height,
                locked: true,
            }),
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
     * 回答欄の移動可能な線要素を取得する。
     *
     * @returns 回答欄の移動可能な線要素。
     */
    getLine() {
        return this.line;
    }

    /**
     * 回答欄を構成する全要素のスケルトンを取得する。
     *
     * @returns 長方形、線、名前テキストの順に並べたスケルトン。
     */
    getSkeleton() {
        return [this.rectangle.getSkeleton(), this.line.getSkeleton(), this.name.getSkeleton()];
    }
}

/** 回答欄の生成に必要なパラメータ。 */
interface Params {
    /** 回答欄の識別子。 */
    id: string;

    /** 回答欄の左上の X 座標。 */
    x: number;

    /** 回答欄の左上の Y 座標。 */
    y: number;

    /** 回答欄の幅。 */
    width: number;

    /** 回答欄の高さ。 */
    height: number;
}
