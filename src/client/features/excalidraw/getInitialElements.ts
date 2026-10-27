import { convertToExcalidrawElements } from "@excalidraw/excalidraw";
import type { OrderedExcalidrawElement } from "@excalidraw/excalidraw/element/types";

import type { Slider } from "./Slider/Slider";
import { sliders } from "./Slider/Sliders";
import type { Line } from "./Elements/Line/Line";
import { lines } from "./Elements/Line/lines";
import type { Rectangle } from "./Elements/Rectangle/Rectangle";
import { rectangles } from "./Elements/Rectangle/rectangles";
import type { Text } from "./Elements/Text/Text";
import { texts } from "./Elements/Text/texts";

/**
 * 共有されている図形のスケルトンから、初期表示用の Excalidraw 要素を生成する。
 *
 * listener により追加済みの AnswerBar を含め、ID を再生成せずに変換した
 * 順序付きの Excalidraw 要素を返す。
 */
export function getInitialElements(): OrderedExcalidrawElement[] {
    return convertToExcalidrawElements(
        [
            ...rectangles.map((rectangle: Rectangle) => rectangle.getSkeleton()),
            ...lines.map((line: Line) => line.getSkeleton()),
            ...texts.map((text: Text) => text.getSkeleton()),
            ...sliders.flatMap((slider: Slider) => slider.getSkeleton()),
        ],
        { regenerateIds: false },
    );
}
