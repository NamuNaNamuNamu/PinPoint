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
import { TopRightUI } from "./ui/topRightUI";

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
        const userName = prompt("名前を入力してね") ?? "";
        socketController.registerUser(userName);

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

                renderTopRightUI = { () => TopRightUI }
            />
        </div>  
    );
}

export default App;