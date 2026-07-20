import type { OrderedExcalidrawElement } from "@excalidraw/excalidraw/element/types";
import { convertToExcalidrawElements } from "@excalidraw/excalidraw";
import { lines } from "../Elements/Line/lines";
import type { Line } from "../Elements/Line/Line";

export function getInitialData(): OrderedExcalidrawElement[] {
    return convertToExcalidrawElements([
        ...lines.map((line: Line) => { return line.getSkeleton() })
    ], {regenerateIds: false});
}