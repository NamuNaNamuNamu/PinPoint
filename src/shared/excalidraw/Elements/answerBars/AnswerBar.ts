import { Line } from "../Line/Line";
import { lineSkeletonFactory } from "../Line/LineSkeletonFactory";
import { Rectangle } from "../Rectangle/Rectangle";
import { rectangleSkeletonFactory } from "../Rectangle/RectangleSkeletonFactory";


export class AnswerBar {
    private readonly line: Line;
    private readonly rectangle: Rectangle;

    constructor(
        { id, x, y, width, height }: Params
    ) {
        this.line = new Line({
            skeleton: lineSkeletonFactory.createWith({
                id: `line-${id}`,
                x: x + width / 2,
                y: y + height / 2,
                locked: false
            }),
            moveRange: {
                minX: x,
                maxX: x + width,
                minY: y,
                maxY: y
            }
        });
        this.rectangle = new Rectangle({
            skeleton: rectangleSkeletonFactory.createWith({
                id: `rectangle-${id}`,
                x: x,
                y: y,
                width: width,
                height: height,
                locked: true
            }),
        })
    }

    getLine() {
        return this.line;
    }

    getRectangle() {
        return this.rectangle;
    }

    getSkeleton() {
        return [
            this.rectangle.getSkeleton(),
            this.line.getSkeleton()
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