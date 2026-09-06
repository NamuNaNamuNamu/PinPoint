import type { OrderedExcalidrawElement } from "@excalidraw/excalidraw/element/types";
import { convertToExcalidrawElements } from "@excalidraw/excalidraw";
import { lines } from "../../../shared/excalidraw/Elements/Line/lines";
import type { Line } from "../../../shared/excalidraw/Elements/Line/Line";
import { rectangles } from "../../../shared/excalidraw/Elements/Rectangle/rectangles";
import type { Rectangle } from "../../../shared/excalidraw/Elements/Rectangle/Rectangle";
import { answerBars } from "../../../shared/excalidraw/Elements/answerBars/answerBars";
import { AnswerBar } from "../../../shared/excalidraw/Elements/answerBars/AnswerBar";
import { texts } from "../../../shared/excalidraw/Elements/Text/texts";
import type { Text } from "../../../shared/excalidraw/Elements/Text/Text";


export function getInitialData(){
    const elements: OrderedExcalidrawElement[] = convertToExcalidrawElements([
        ...rectangles.map((rectangle: Rectangle) => rectangle.getSkeleton()),
        ...lines.map((line: Line) => line.getSkeleton()),
        ...texts.map((text: Text) => text.getSkeleton()),
        ...answerBars.flatMap((answerBar: AnswerBar) => answerBar.getSkeleton())
    ], {regenerateIds: false});

    return {
        elements,
    };
}