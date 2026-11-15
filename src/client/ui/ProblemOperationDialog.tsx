import { useState } from "react";

import { getQuestionTemplate, questionTemplates } from "../../shared/question/QuestionTemplate";
import { useCurrentQuestion } from "../features/question/questionStore";
import { socketController } from "../socket/SocketController";
import { Dialog } from "./ShareDialog/Dialog";

type Props = { roomId: string; closeDialog: () => void };

/** ホストが問題遷移と現在問題の解答表示を実行する画面。 */
export function ProblemOperationDialog({ roomId, closeDialog }: Props) {
    const currentQuestion = useCurrentQuestion();
    const [targetQuestionId, setTargetQuestionId] = useState(currentQuestion?.id ?? questionTemplates[0]?.id ?? 1);
    const targetQuestion = getQuestionTemplate(targetQuestionId);
    const ids = questionTemplates.map((question) => question.id);
    const move = (direction: -1 | 1) => {
        const index = ids.indexOf(targetQuestionId);
        const next = ids[index + direction];
        if (next !== undefined) setTargetQuestionId(next);
    };
    const apply = async () => {
        if (!targetQuestion) return;
        await socketController.applyQuestion({ roomId, questionId: targetQuestion.id, deleteExternalElements: true, scrollToContent: true, answerBarReveal: false });
    };
    const reveal = async () => {
        const result = await socketController.controlCurrent({ roomId, deleteExternalElements: true, scrollToContent: true, answerBarReveal: true });
        if (result.ok) socketController.revealQuestion(roomId);
    };

    return (
        <Dialog onCloseRequest={closeDialog} title="問題操作" size="regular">
            <h2 id="dialog-title">問題操作</h2>
            <section>
                <h3>問題遷移</h3>
                <div style={{ display: "flex", alignItems: "center", gap: "8px", flexWrap: "wrap" }}>
                    <span>現在の問題ID: {currentQuestion?.id ?? "未適用"}</span>
                    <label>
                        遷移先の問題ID:
                        <button type="button" disabled={ids.indexOf(targetQuestionId) <= 0} onClick={() => move(-1)}>−</button>
                        <input type="number" value={targetQuestionId} onChange={(event) => setTargetQuestionId(Number(event.target.value))} />
                        <button type="button" disabled={ids.indexOf(targetQuestionId) < 0 || ids.indexOf(targetQuestionId) >= ids.length - 1} onClick={() => move(1)}>＋</button>
                    </label>
                    <button type="button" disabled={!targetQuestion} onClick={() => void apply()}>適用</button>
                </div>
                <p>問題文: {targetQuestion?.question ?? "該当する問題がありません。"}</p>
            </section>
            <hr />
            <section>
                <h3>現在の問題の解答を表示</h3>
                <button type="button" disabled={!currentQuestion} onClick={() => void reveal()}>表示</button>
            </section>
        </Dialog>
    );
}
