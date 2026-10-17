import type { ExcalidrawElementSkeleton } from "@excalidraw/excalidraw/data/transform";

/**
 * Excalidrawのテキスト要素スケルトンを生成する。
 */
class TextSkeletonFactory {
    /**
     * 指定された配置・文字列でテキスト要素のスケルトンを生成する。
     *
     * @param textProps 可変のテキスト要素プロパティ
     * @returns テキスト要素のスケルトン
     */
    createWith(textProps: TextProps) {
        return {
            ...textProps,
            ...textFixedProps,
            strokeColor: textProps.strokeColor ?? textFixedProps.strokeColor,
        };
    }
}

/**
 * テキスト要素スケルトンを生成するファクトリー。
 */
export const textSkeletonFactory = new TextSkeletonFactory();

/**
 * テキスト要素の作成時に指定する可変プロパティ。
 * ExcalidrawElementSkeleton から id、x、y、text、locked、opacity、strokeColor だけを取り出した型
 */
export type TextProps = Pick<TextSkeleton, "id" | "x" | "y" | "text" | "locked"> & {
    opacity?: TextSkeleton["opacity"];
    strokeColor?: TextSkeleton["strokeColor"];
};

/**
 * Excalidraw のテキスト要素を表すスケルトン型。
 */
type TextSkeleton = Extract<ExcalidrawElementSkeleton, { type: "text" }>;

/**
 * Excalidraw で使用するフォントファミリーの識別子。
 */
const FONT_FAMILY = {
    Virgil: 1,
    Helvetica: 2,
    Cascadia: 3,
    // leave 4 unused as it was historically used for Assistant (which we don't use anymore) or custom font (Obsidian)
    Excalifont: 5,
    Nunito: 6,
    "Lilita One": 7,
    "Comic Shanns": 8,
    "Liberation Sans": 9,
    Assistant: 10,
};

/**
 * テキスト要素スケルトンに共通で設定する固定プロパティ。
 */
const textFixedProps = {
    type: "text",
    fontSize: 20,
    fontFamily: FONT_FAMILY.Excalifont,
    textAlign: "center",
    strokeColor: "#5f3dc4",
} satisfies Partial<TextSkeleton>;
