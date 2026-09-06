import type { ExcalidrawElement } from "@excalidraw/excalidraw/element/types";
import type { Line } from "../../../shared/excalidraw/Elements/Line/Line";
import { lines } from "../../../shared/excalidraw/Elements/Line/lines";
import { socketController } from "../../socket/SocketController";
import { answerBars } from "../../../shared/excalidraw/Elements/answerBars/answerBars";
import { AnswerBar } from "../../../shared/excalidraw/Elements/answerBars/AnswerBar";

export function handleChange(elements: readonly ExcalidrawElement[]): void {
    lines.forEach((line: Line) => {
        line.onChange();
    });

    answerBars.forEach((answerBar: AnswerBar) => {
        answerBar.getLine().onChange();
    })

    socketController.syncElements(elements);
}