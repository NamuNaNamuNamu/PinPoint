import type { ExcalidrawElement } from "@excalidraw/excalidraw/element/types";

import { answerBarSceneController } from "../answerBar/AnswerBarSceneController";
import type { Slider } from "./Slider/Slider";
import { sliders } from "./Slider/Sliders";
import { socketController } from "../../socket/SocketController";
import type { Line } from "./Elements/Line/Line";
import { lines } from "./Elements/Line/lines";
import { excalidrawAPIHolder } from "./ExcalidrawAPIHolder";
import { excalidrawSyncController } from "./excalidrawSync/ExcalidrawSyncController";

/**
 * Excalidraw 要素の変更を処理し、関連する線が更新（位置の変更など）された時の処理と要素の同期を行う。
 *
 * @param elements 変更後の Excalidraw 要素。
 */
export function handleExcalidrawElementsChange(_elements: readonly ExcalidrawElement[], operatorUserId: number): void {
    if (excalidrawSyncController.isRemoteApplying()) {
        return;
    }

    if (answerBarSceneController.restoreMissingElements()) {
        return;
    }

    lines.forEach((line: Line) => {
        line.onChange();
    });

    sliders.forEach((slider: Slider) => {
        slider.forEachAnswerBar((answerBar) => {
            answerBar.onChange(operatorUserId);
        });
    });

    answerBarSceneController.rememberCurrentElements();
    socketController.syncElements(excalidrawAPIHolder.getApi().getSceneElements());
}
