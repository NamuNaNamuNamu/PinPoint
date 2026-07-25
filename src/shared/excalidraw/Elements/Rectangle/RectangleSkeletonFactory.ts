import { degToRad } from "../../utils/degToRad";
import type { ExcalidrawElementSkeleton } from "@excalidraw/excalidraw/data/transform";

class RectangleSkeletonFactory {
    createWith(rectangleProps: RectangleProps) {
        return {
            ...rectangleProps,
            ...rectangleFixedProps
        }
    }
}

export const rectangleSkeletonFactory = new RectangleSkeletonFactory();

// ExcalidrawElementSkeleton から id、x、y、isLocked だけを取り出した型
export type RectangleProps = Pick<
  ExcalidrawElementSkeleton,
  "id" | "x" | "y" | "width" | "height" | "locked"
>;

const rectangleFixedProps = {
    type: "rectangle",
    strokeColor: "#000000",
    fillStyle: "solid",
    strokeWidth: 2,
    strokeStyle: "solid",
    roughness: 1,
    opacity: 100,
    angle: 0,
} satisfies Partial<ExcalidrawElementSkeleton>;