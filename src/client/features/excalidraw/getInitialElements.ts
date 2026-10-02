import { convertToExcalidrawElements } from "@excalidraw/excalidraw";
import type { OrderedExcalidrawElement } from "@excalidraw/excalidraw/element/types";

import type { Line } from "../../../shared/excalidraw/Elements/Line/Line";
import { lines } from "../../../shared/excalidraw/Elements/Line/lines";
import type { Rectangle } from "../../../shared/excalidraw/Elements/Rectangle/Rectangle";
import { rectangles } from "../../../shared/excalidraw/Elements/Rectangle/rectangles";
import type { Text } from "../../../shared/excalidraw/Elements/Text/Text";
import { texts } from "../../../shared/excalidraw/Elements/Text/texts";
import type { Slider } from "../../../shared/Slider/Slider";
import { sliders } from "../../../shared/Slider/Sliders";

/**
 * 共有されている図形のスケルトンから、初期表示用の Excalidraw 要素を生成する。
 *
 * @returns ID を再生成せずに変換した、順序付きの Excalidraw 要素。
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
