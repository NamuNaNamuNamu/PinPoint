import { Excalidraw } from "@excalidraw/excalidraw";
import "@excalidraw/excalidraw/index.css";
import type { ExcalidrawImperativeAPI } from "@excalidraw/excalidraw/types";
import { useEffect, useState } from "react";
import { onExcalidrawMount } from "./onExcalidrawMount";
import { handleChange } from "./handleChange";
import { getInitialData } from "./getInitialData";
import { bindExcalidrawAPI } from "./bindExcalidrawAPI";


function App() {
    // excalidrawAPI を React の state に保存する準備
    // excalidrawAPI = { (api) => setExcalidrawAPI(api) } で実際に保存
    const [excalidrawAPI, setExcalidrawAPI] = useState<ExcalidrawImperativeAPI | null>(null);
    
    // 画面描画後に実行 (ただし、Excalidraw が未マウント)
    useEffect(() => {
        if (!excalidrawAPI) {
            return;
        }

        excalidrawAPI.onChange(() => {
            handleChange();
        });

        // TODO: Excalidraw マウントをトリガーに発動したい。
        // NOTE: useEffect のタイミングでは、Excalidraw が未マウント。
        setTimeout(() => {
            onExcalidrawMount(excalidrawAPI);
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
                    bindExcalidrawAPI(api);
                }}
            />
        </div>  
    );
}

export default App;