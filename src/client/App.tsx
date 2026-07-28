import { Excalidraw } from "@excalidraw/excalidraw";
import "@excalidraw/excalidraw/index.css";
import type { ExcalidrawImperativeAPI } from "@excalidraw/excalidraw/types";
import { useEffect, useState } from "react";
import { onExcalidrawMount } from "./features/excalidraw/onExcalidrawMount";
import { handleChange } from "./features/excalidraw/handleChange";
import { getInitialData } from "./features/excalidraw/getInitialData";
import { socketController } from "./socket/SocketController";
import type { ExcalidrawElement } from "@excalidraw/excalidraw/element/types";
import { excalidrawAPIHolder } from "./features/excalidraw/ExcalidrawAPIHolder";

import ExcalidrawMainMenu from "./ui/ExcalidrawMainMenu.tsx"
import { ShareDialog } from "./ui/share/ShareDialog.tsx";

function App() {
    // excalidrawAPI を React の state に保存する準備
    // excalidrawAPI = { (api) => setExcalidrawAPI(api) } で実際に保存
    const [excalidrawAPI, setExcalidrawAPI] = useState<ExcalidrawImperativeAPI | null>(null);
    
    // 画面描画後に実行 (ただし、Excalidraw が未マウント)
    useEffect(() => {
        if (!excalidrawAPI) {
            return;
        }

        socketController.register();
        const userName = prompt("名前を入力してね") ?? null;
        if (userName) socketController.registerUser(userName);
        const roomNumber = prompt("ルーム番号を入力してね") ?? null;
        if (roomNumber) socketController.joinRoom(roomNumber); // TODO: ルーム参加の仕組みを整える（UI作成してそれトリガーに発火）
        if (roomNumber) alert(`${roomNumber} に部屋参加`);

        excalidrawAPI.onChange((elements: readonly ExcalidrawElement[]) => {
            handleChange(elements);
        });

        // TODO: Excalidraw マウントをトリガーに発動したい。
        // NOTE: useEffect のタイミングでは、Excalidraw が未マウント。
        setTimeout(() => {
            onExcalidrawMount();
        }, 10);
    }); 
    
    return (
        <div style={{ height: "100dvh" }}>
            <Excalidraw
                initialData = {{
                    elements: getInitialData()
                }}

                excalidrawAPI = { (api) => {
                    setExcalidrawAPI(api);
                    excalidrawAPIHolder.setApi(api);
                }}

                zenModeEnabled = { true }
            >
                <ExcalidrawMainMenu />

                <ShareDialog
                    collabAPI={null}
                    onExportToBackend={async () => {
                        if (excalidrawAPI) {
                            try {
                                await onExportToBackend(
                                    excalidrawAPI.getSceneElements(),
                                    excalidrawAPI.getAppState(),
                                    excalidrawAPI.getFiles(),
                                );
                            } catch (error: any) {
                                setErrorMessage(error.message);
                            }
                        }
                    }}
                />
            </Excalidraw>
        </div>  
    );
}

const onExportToBackend = async (
    exportedElements: readonly NonDeletedExcalidrawElement[],
    appState: Partial<AppState>,
    files: BinaryFiles,
) => {
    if (exportedElements.length === 0) {
        throw new Error(t("alerts.cannotExportEmptyCanvas"));
    }
    try {
        const { url, errorMessage } = await exportToBackend(
            exportedElements,
            {
                ...appState,
                viewBackgroundColor: appState.exportBackground
                    ? appState.viewBackgroundColor
                    : getDefaultAppState().viewBackgroundColor,
            },
            files,
        );

        if (errorMessage) {
            throw new Error(errorMessage);
        }

        if (url) {
            setLatestShareableLink(url);
        }
    } catch (error: any) {
        if (error.name !== "AbortError") {
            const { width, height } = appState;
            console.error(error, {
                width,
                height,
                devicePixelRatio: window.devicePixelRatio,
            });
            throw new Error(error.message);
        }
    }
};

export default App;