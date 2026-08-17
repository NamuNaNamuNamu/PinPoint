import { degToRad } from "../../../utils/degToRad";
import type { ExcalidrawElementSkeleton } from "@excalidraw/excalidraw/data/transform";


class LineSkeletonFactory {
    createWith(lineProps: LineProps) {
        return {
            ...lineProps,
            ...linefixedProps
        }
    }
}

export const lineSkeletonFactory = new LineSkeletonFactory();

// ExcalidrawElementSkeleton から id、x、y、isLocked だけを取り出した型
export type LineProps = Pick<
  ExcalidrawElementSkeleton,
  "id" | "x" | "y" | "locked"
>;

const linefixedProps = {
    type: "line",
    width: 100,
    strokeColor: "#0000ff",
    strokeWidth: 2,
    angle: degToRad(90),
} satisfies Partial<ExcalidrawElementSkeleton>;