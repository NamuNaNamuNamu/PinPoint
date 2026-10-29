import type { ExcalidrawElementSkeleton } from "@excalidraw/excalidraw/data/transform";

/**
 * Excalidrawの長方形要素スケルトンを生成する。
 */
class RectangleSkeletonFactory {
    /**
     * 指定された配置・寸法で長方形要素のスケルトンを生成する。
     *
     * @param rectangleProps 可変の長方形要素プロパティ
     * @returns 長方形要素のスケルトン
     */
    createWith(rectangleProps: RectangleProps) {
        return {
            ...rectangleProps,
            ...rectangleFixedProps,
        };
    }
}

/**
 * 長方形要素スケルトンを生成するファクトリー。
 */
export const rectangleSkeletonFactory = new RectangleSkeletonFactory();

/**
 * 長方形要素の作成時に指定する可変プロパティ。
 * ExcalidrawElementSkeleton から id、x、y、width、height、isLocked だけを取り出した型
 */
export type RectangleProps = Pick<ExcalidrawElementSkeleton, "id" | "x" | "y" | "width" | "height" | "locked">;

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
