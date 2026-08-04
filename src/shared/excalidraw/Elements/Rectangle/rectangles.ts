
import { Rectangle } from "./Rectangle";
import { rectangleSkeletonFactory } from "./RectangleSkeletonFactory";

export const rectangles: Rectangle[] = [
    new Rectangle({
        skeleton: rectangleSkeletonFactory.createWith({
            id: "rectangle1",
            x: 100,
            y: 100,
            width: 300,
            height: 100,
            locked: true
        }),
    })
];