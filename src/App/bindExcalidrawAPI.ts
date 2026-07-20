import type { ExcalidrawImperativeAPI } from "@excalidraw/excalidraw/types";
import { lines } from "../Elements/Line/lines";
import type { Line } from "../Elements/Line/Line";

export function bindExcalidrawAPI(excalidrawAPI: ExcalidrawImperativeAPI) {
    lines.forEach((line: Line) => {
        line.setExcalidrawAPI(excalidrawAPI);
    })
}