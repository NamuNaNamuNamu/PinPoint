
import { Line } from "./Line";
import { lineSkeletonFactory } from "./LineSkeletonFactory";

export const lines: Line[] = [
    new Line({
        skeleton: lineSkeletonFactory.createWith({
            id: "line1",
            x: 100,
            y: 150,
            locked: false
        }),
        moveRange: {
            minX: 50,
            maxX: 350,
            minY: 150,
            maxY: 150
        }
    })
];