import { useLayoutEffect, useState } from "react";

// import { THEME } from "@excalidraw/common";

// import { useEditorInterface, useExcalidrawContainer } from "../components/App";
// import { useUIAppState } from "../context/ui-appState";

/**
 * Portal の描画先となる div 要素を作成し、コンポーネントの破棄時に削除する。
 *
 * @param opts 作成する要素の CSS クラス名と親要素セレクター。
 * @returns Portal の描画先となる div 要素。初期化前は `null`。
 */
export const useCreatePortalContainer = (opts?: { className?: string; parentSelector?: string }) => {
    const [div, setDiv] = useState<HTMLDivElement | null>(null);

    // const editorInterface = useEditorInterface();
    // const { theme } = useUIAppState();

    // const { container: excalidrawContainer } = useExcalidrawContainer();

    useLayoutEffect(() => {
        if (div) {
            div.className = "";
            div.classList.add("excalidraw", ...(opts?.className?.split(/\s+/) || []));
            // div.classList.toggle(
            //   "excalidraw--mobile",
            //   editorInterface.formFactor === "phone",
            // );
            // div.classList.toggle("theme--dark", theme === THEME.DARK);
        }
    }, [div, /* theme, editorInterface.formFactor, */ opts?.className]);

    useLayoutEffect(() => {
        // const container = opts?.parentSelector
        //   ? excalidrawContainer?.querySelector(opts.parentSelector)
        //   : document.body;
        const container = document.body;

        if (!container) {
            return;
        }

        const div = document.createElement("div");

        container.appendChild(div);

        setDiv(div);

        return () => {
            container.removeChild(div);
        };
    }, [/*excalidrawContainer, */ opts?.parentSelector]);

    return div;
};
