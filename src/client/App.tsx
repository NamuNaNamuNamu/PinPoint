import "@excalidraw/excalidraw/index.css";

import { Excalidraw } from "@excalidraw/excalidraw";
import type { ExcalidrawImperativeAPI } from "@excalidraw/excalidraw/types";
import { useState } from "react";

import { excalidrawAPIHolder } from "./features/excalidraw/ExcalidrawAPIHolder";
import { excalidrawSyncController } from "./features/excalidraw/excalidrawSync/ExcalidrawSyncController.ts";
import { excalidrawSyncState } from "./features/excalidraw/excalidrawSync/ExcalidrawSyncState";
import { handlePointerChange } from "./features/excalidraw/handlePointerChange.ts";
import { useExcalidrawSceneInitialization } from "./features/excalidraw/useExcalidrawSceneInitialization";
import { useRoomConnection } from "./features/room/useRoomConnection";
import ExcalidrawMainMenu from "./ui/ExcalidrawMainMenu.tsx";

function App() {
    /** Excalidraw の操作 API。初期化完了後に同期・イベント登録に使用する。 */
    const [excalidrawAPI, setExcalidrawAPI] = useState<ExcalidrawImperativeAPI | null>(null);
    const roomConnection = useRoomConnection({ enabled: excalidrawAPI !== null });

    useExcalidrawSceneInitialization(excalidrawAPI, roomConnection.getOperatorUserId);

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
                <ExcalidrawMainMenu
                    currentRoomId={roomConnection.currentRoomId}
                    onCurrentRoomIdChange={roomConnection.onCurrentRoomIdChange}
                />
            </Excalidraw>
        </div>
    );
}

export default App;
