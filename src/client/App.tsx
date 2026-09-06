import { Excalidraw } from "@excalidraw/excalidraw";
import "@excalidraw/excalidraw/index.css";
import type { ExcalidrawImperativeAPI } from "@excalidraw/excalidraw/types";
import { useEffect, useState } from "react";
import { onExcalidrawElementsInitialized } from "./features/excalidraw/onExcalidrawElementsInitialized";
import { handleChange } from "./features/excalidraw/handleChange";
import { getInitialElements } from "./features/excalidraw/getInitialElements";
import { socketController } from "./socket/SocketController";
import type { ExcalidrawElement } from "@excalidraw/excalidraw/element/types";
import { excalidrawAPIHolder } from "./features/excalidraw/ExcalidrawAPIHolder";

import ExcalidrawMainMenu from "./ui/ExcalidrawMainMenu.tsx"
import { url } from "./features/url/Url.ts";
import { joinRoom } from "./features/room/joinRoom.ts";

function App() {
    // excalidrawAPI を React の state に保存する準備
    // excalidrawAPI = { (api) => setExcalidrawAPI(api) } で実際に保存
    const [excalidrawAPI, setExcalidrawAPI] = useState<ExcalidrawImperativeAPI | null>(null);

    // 画面描画後に実行 (ただし、Excalidraw が未マウント)
    useEffect(() => {
        if (!excalidrawAPI) {
            return;
        }

        const initialize = async () => {
            // サーバーからの受信開始
            socketController.register();

            const roomId = url.getRoomIdFromParams();
            if (roomId) {
                joinRoom(roomId);
            }

            // const userName = prompt("名前を入力してね") ?? null;
            // if (userName) socketController.registerUser(userName);

            // フォントロード完了を待つ。テキストが全て描画されない不具合の解消用
            await document.fonts.ready;
            await document.fonts.load("20px Excalifont");

            // フォントロード後にSkeleton → Element変換
            const elements = getInitialElements();
            excalidrawAPI.updateScene({
                elements: [...elements],
            });

            // 初期 elements を投入後、実行する
            onExcalidrawElementsInitialized();
            excalidrawAPI.onChange((elements: readonly ExcalidrawElement[]) => {
                handleChange(elements);
            });
        };
        initialize();
    }); 
    
    return (
        <div style = {{ height: "100dvh" }}>
            <Excalidraw
                excalidrawAPI = { (api) => {
                    setExcalidrawAPI(api);
                    excalidrawAPIHolder.setApi(api);
                }}

                zenModeEnabled = { true }
            >
                <ExcalidrawMainMenu />
            </Excalidraw>
        </div>  
    );
}

export default App;