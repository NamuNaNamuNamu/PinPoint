import { Line } from "../Line/Line";
import { lineSkeletonFactory } from "../Line/LineSkeletonFactory";
import { Rectangle } from "../Rectangle/Rectangle";
import { rectangleSkeletonFactory } from "../Rectangle/RectangleSkeletonFactory";
import { Text } from "../Text/Text";
import { textSkeletonFactory } from "../Text/TextSkeletonFactory";

/**
 * 回答欄を表す、長方形・可動線・名前テキストからなる複合要素を生成する。
 */
export class AnswerBar {
    private readonly line: Line;
    private readonly rectangle: Rectangle;
    private readonly name: Text;

    /**
     * @param params 回答欄のID、配置位置、寸法
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
     * @returns 回答欄内で移動可能な線要素
     */
    getLine() {
        return this.line;
    }

    /**
     * 回答欄を構成する要素のスケルトンを、描画順に取得する。
     *
     * @returns 長方形、線、名前テキストのスケルトン配列
     */
    getSkeleton() {
        return [
            this.rectangle.getSkeleton(),
            this.line.getSkeleton(),
            this.name.getSkeleton()
        ];
    }
}

interface Params {
    id: string;
    x: number;
    y: number;
    width: number;
    height: number;
}
