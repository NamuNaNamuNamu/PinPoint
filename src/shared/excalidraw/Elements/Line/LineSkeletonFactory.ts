import type { ExcalidrawElementSkeleton } from "@excalidraw/excalidraw/data/transform";


class LineSkeletonFactory {
    createWith(lineProps: LineProps) {
        return {
            ...lineProps,
            ...this.getPoints(lineProps),
            ...linefixedProps
        }
    }

    private getPoints(lineProps: LineProps) {
        return {
            points: [
                [0, 0],
                [0, lineProps.width]
            ]
        }
    }
}

export const lineSkeletonFactory = new LineSkeletonFactory();

// ExcalidrawElementSkeleton から id、x、y、isLocked だけを取り出した型
export type LineProps = Pick<
  ExcalidrawElementSkeleton,
  "id" | "x" | "y" | "width" | "locked"
>;

const linefixedProps = {
    type: "line",
    strokeColor: "#0000ff",
    strokeWidth: 2,
} satisfies Partial<ExcalidrawElementSkeleton>;