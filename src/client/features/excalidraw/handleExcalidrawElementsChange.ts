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
 * Excalidraw 要素の変更を処理する。
 *
 * 所有 AnswerBar の位置変更は line と名前ラベルをローカルで正規化し、専用位置イベントで送信する。
 * それ以外の scene 要素だけを通常の `SYNC_ELEMENTS` で同期する。リモート適用中または AnswerBar
 * 欠損を復元した場合は、再送信を防ぐため何もしない。
 *
 * @param _elements 変更後の Excalidraw 要素。現在の scene は API から再取得するため直接は使用しない。
 * @param operatorUserId 現在操作しているユーザー ID。
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

    const answerBarElementUpdates = new Map<string, ExcalidrawElement>();
    sliders.forEach((slider: Slider) => {
        slider.forEachAnswerBar((answerBar) => {
            answerBar.getElementUpdates(operatorUserId).forEach((element) => {
                answerBarElementUpdates.set(element.id, element);
                if (element.id === answerBar.getLineId()) {
                    socketController.syncAnswerBarPosition({
                        answerBarId: answerBar.getAnswerBarId(),
                        lineId: element.id,
                        x: element.x,
                    });
                }
            });
        });
    });

    if (answerBarElementUpdates.size > 0) {
        const api = excalidrawAPIHolder.getApi();
        api.updateScene({
            elements: excalidrawAPIHolder
                .getSceneElementsWithTombstones()
                .map((element) => answerBarElementUpdates.get(element.id) ?? element),
        });
        return;
    }

    answerBarSceneController.rememberCurrentElements();
    socketController.syncElements(excalidrawAPIHolder.getSceneElementsWithTombstones());
}
