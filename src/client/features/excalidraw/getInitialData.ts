import type { OrderedExcalidrawElement } from "@excalidraw/excalidraw/element/types";
import { convertToExcalidrawElements } from "@excalidraw/excalidraw";
import { lines } from "../../../shared/excalidraw/Elements/Line/lines";
import type { Line } from "../../../shared/excalidraw/Elements/Line/Line";
import { rectangles } from "../../../shared/excalidraw/Elements/Rectangle/rectangles";
import type { Rectangle } from "../../../shared/excalidraw/Elements/Rectangle/Rectangle";


export function getInitialData(): OrderedExcalidrawElement[] {
    return convertToExcalidrawElements([
        ...rectangles.map((rectangle: Rectangle) => { return rectangle.getSkeleton() }),
        ...lines.map((line: Line) => { return line.getSkeleton() })
    ], {regenerateIds: false});
}