import type { ExcalidrawElementSkeleton } from "@excalidraw/excalidraw/data/transform";

class TextSkeletonFactory {
    createWith(textProps: TextProps) {
        return {
            ...textProps,
            ...textFixedProps
        }
    }
}

export const textSkeletonFactory = new TextSkeletonFactory();

// ExcalidrawElementSkeleton から id、x、y、text だけを取り出した型
export type TextProps = Pick<
    TextSkeleton,
    "id" | "x" | "y" | "text"
>;

type TextSkeleton = Extract<
    ExcalidrawElementSkeleton,
    { type: "text" }
>;

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

const textFixedProps = {
    type: "text",
    fontSize: 20,
    fontFamily: FONT_FAMILY.Excalifont,
    strokeColor: "#5f3dc4",
} satisfies Partial<TextSkeleton>;