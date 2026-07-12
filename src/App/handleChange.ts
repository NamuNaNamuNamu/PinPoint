import type { ExcalidrawElement } from "@excalidraw/excalidraw/element/types";
import type { Line } from "../Elements/Line/Line";
import { lines } from "../Elements/Line/lines";
import { socketRequestSender } from "./socket/SocketRequestSender";
import type { ExcalidrawImperativeAPI } from "@excalidraw/excalidraw/types";

export function handleChange(elements: readonly ExcalidrawElement[], excalidrawAPI: ExcalidrawImperativeAPI): void {
    lines.forEach((line: Line) => {
        line.onChange();
    });

    socketRequestSender.sendElements(elements, excalidrawAPI);
}