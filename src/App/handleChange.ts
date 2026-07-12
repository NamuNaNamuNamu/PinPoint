import type { ExcalidrawElement } from "@excalidraw/excalidraw/element/types";
import type { Line } from "../Elements/Line/Line";
import { lines } from "../Elements/Line/lines";
import { socketController } from "./socket/SocketController";

export function handleChange(elements: readonly ExcalidrawElement[]): void {
    lines.forEach((line: Line) => {
        line.onChange();
    });

    socketController.syncElements(elements);
}