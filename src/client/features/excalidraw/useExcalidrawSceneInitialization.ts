import type { ExcalidrawElement } from "@excalidraw/excalidraw/element/types";
import type { ExcalidrawImperativeAPI } from "@excalidraw/excalidraw/types";
import { useEffect, useRef } from "react";

import { answerBarSceneController } from "../answerBar/AnswerBarSceneController";
import { handleExcalidrawElementsChange } from "./handleExcalidrawElementsChange";
import { onExcalidrawElementsInitialized } from "./onExcalidrawElementsInitialized";

/**
 * Excalidraw scene を一度だけ初期化し、要素変更 listener を登録する。
 *
 * @param excalidrawAPI Excalidraw の操作 API。未取得時は初期化しない。
 * @param getOperatorUserId 現在の操作ユーザー ID を取得する関数。
 */
export function useExcalidrawSceneInitialization(
    excalidrawAPI: ExcalidrawImperativeAPI | null,
    getOperatorUserId: () => number | undefined,
): void {
    const isSceneInitializedRef = useRef(false);

    useEffect(() => {
        if (!excalidrawAPI || isSceneInitializedRef.current) {
            return;
        }
        isSceneInitializedRef.current = true;

        const initializeScene = async (): Promise<void> => {
            await document.fonts.ready;
            await document.fonts.load("20px Excalifont");

            answerBarSceneController.rememberCurrentElements();

            onExcalidrawElementsInitialized();
            excalidrawAPI.onChange((elements: readonly ExcalidrawElement[]) => {
                const operatorUserId = getOperatorUserId();
                if (operatorUserId === undefined) {
                    return;
                }
                handleExcalidrawElementsChange(elements, operatorUserId);
            });
        };

        void initializeScene();
    }, [excalidrawAPI, getOperatorUserId]);
}
