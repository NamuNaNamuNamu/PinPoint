import type { ExcalidrawElementSkeleton } from "@excalidraw/excalidraw/data/transform";

/**
 * Excalidrawの線要素スケルトンを生成する。
 */
class LineSkeletonFactory {
    /**
     * 指定された配置・長さで線要素のスケルトンを生成する。
     *
     * @param lineProps 可変の線要素プロパティ
     * @returns 線要素のスケルトン
     */
    createWith(lineProps: LineProps) {
        return {
            ...lineProps,
            ...this.getPoints(lineProps),
            ...linefixedProps,
        };
    }

    /**
     * @param lineProps 線要素の寸法を含むプロパティ
     * @returns 線の始点と終点を表す座標列
     */
    private getPoints(lineProps: LineProps) {
        return {
            points: [
                [0, 0],
                [0, lineProps.width],
            ],
        };
    }
}

/**
 * 線要素スケルトンを生成するファクトリー。
 */
export const lineSkeletonFactory = new LineSkeletonFactory();

/**
 * 線要素の作成時に指定する可変プロパティ。
 * ExcalidrawElementSkeleton から id、x、y、isLocked だけを取り出した型
 */
export type LineProps = Pick<ExcalidrawElementSkeleton, "id" | "x" | "y" | "width" | "locked">;

const linefixedProps = {
    type: "line",
    strokeColor: "#0000ff",
    strokeWidth: 2,
} satisfies Partial<ExcalidrawElementSkeleton>;
