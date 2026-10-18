import "@excalidraw/excalidraw/index.css";

import { Excalidraw } from "@excalidraw/excalidraw";
import type { ExcalidrawElement } from "@excalidraw/excalidraw/element/types";
import type { ExcalidrawImperativeAPI } from "@excalidraw/excalidraw/types";
import { useEffect, useState } from "react";

import { answerBarSceneController } from "./features/answerBar/AnswerBarSceneController";
import { registerAnswerBarListener } from "./features/answerBar/registerAnswerBarListener";
import { excalidrawAPIHolder } from "./features/excalidraw/ExcalidrawAPIHolder";
import { excalidrawSyncController } from "./features/excalidraw/excalidrawSync/ExcalidrawSyncController.ts";
import { excalidrawSyncState } from "./features/excalidraw/excalidrawSync/ExcalidrawSyncState";
import { getInitialElements } from "./features/excalidraw/getInitialElements";
import { handleExcalidrawElementsChange } from "./features/excalidraw/handleExcalidrawElementsChange.ts";
import { handlePointerChange } from "./features/excalidraw/handlePointerChange.ts";
import { onExcalidrawElementsInitialized } from "./features/excalidraw/onExcalidrawElementsInitialized";
import { joinRoom } from "./features/room/joinRoom.ts";
import { userSessionStorage } from "./features/sessionStorage/sessionStorage.ts";
import { url } from "./features/url/Url.ts";
import { socketController } from "./socket/SocketController";
import ExcalidrawMainMenu from "./ui/ExcalidrawMainMenu.tsx";

function App() {
    /** Excalidraw の操作 API。初期化完了後に同期・イベント登録に使用する。 */
    const [excalidrawAPI, setExcalidrawAPI] = useState<ExcalidrawImperativeAPI | null>(null);

    /**
     * Excalidraw API の取得後にユーザーを復元または登録し、ルームと AnswerBar の同期を初期化する。
     *
     * フォントの読み込み完了後に初期要素を投入することで、テキスト要素の描画欠落を防ぐ。
     */
    useEffect(() => {
        if (!excalidrawAPI) {
            return;
        }

        const restoreConnection = async () => {
            const userId = userSessionStorage.getUserIdForCurrentNavigation();
            let user = await socketController.getUser(userId);

            if (user) {
                await socketController.updateSocketId(userId);
            } else {
                const userName = prompt("名前を入力してね") ?? "名無し";
                user = await socketController.registerUser(userName);
                userSessionStorage.setUserId(user.id);
            }

            const roomId = url.getRoomIdFromParams();
            registerAnswerBarListener(user.id);

            if (roomId) {
                await joinRoom(user.id, roomId);
            }

            return user;
        };

        const removeConnectListener = socketController.onConnect(() => {
            void restoreConnection();
        });

        const initialize = async () => {
            const user = await restoreConnection();

            await document.fonts.ready;
            await document.fonts.load("20px Excalifont");

            const elements = getInitialElements();
            excalidrawAPI.updateScene({ elements: [...elements] });
            answerBarSceneController.rememberCurrentElements();

            onExcalidrawElementsInitialized();
            excalidrawAPI.onChange((elements: readonly ExcalidrawElement[]) => {
                handleExcalidrawElementsChange(elements, user.id);
            });
        };
        void initialize();

        return () => {
            removeConnectListener();
        };
    }, [excalidrawAPI]);

    return (
        <div style={{ height: "100dvh" }}>
            <Excalidraw
                excalidrawAPI={(api) => {
                    setExcalidrawAPI(api);
                    excalidrawAPIHolder.setApi(api);
                    excalidrawSyncController.syncElements(excalidrawSyncState.getRemoteElements());
                }}
                onPointerUpdate={(payload) => {
                    handlePointerChange(payload);
                }}
                zenModeEnabled={true}
            >
                <ExcalidrawMainMenu />
            </Excalidraw>
        </div>
    );
}

export default App;
