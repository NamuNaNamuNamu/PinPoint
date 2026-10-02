import type { ExcalidrawElement } from "@excalidraw/excalidraw/element/types";

import type { Line } from "../../../shared/excalidraw/Elements/Line/Line";
import { lines } from "../../../shared/excalidraw/Elements/Line/lines";
import type { Slider } from "../../../shared/Slider/Slider";
import { sliders } from "../../../shared/Slider/Sliders";
import { socketController } from "../../socket/SocketController";

/**
 * Excalidraw 要素の変更を処理し、関連する線が更新（位置の変更など）された時の処理と要素の同期を行う。
 *
 * @param elements 変更後の Excalidraw 要素。
 */
export function handleExcalidrawElementsChange(elements: readonly ExcalidrawElement[]): void {
    lines.forEach((line: Line) => {
        line.onChange();
    });

    sliders.forEach((slider: Slider) => {
        slider.getLine().onChange();
    });

    socketController.syncElements(elements);
}
