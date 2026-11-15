import "./ProblemOperationDialog.scss";

import { useState } from "react";

import { getQuestionTemplate, questionTemplates } from "../../shared/question/QuestionTemplate";
import type { QuestionTemplate } from "../../shared/question/QuestionTemplateTypes";
import { useCurrentQuestion } from "../features/question/questionStore";
import { socketController } from "../socket/SocketController";
import { checkIcon } from "./icons";
import { Dialog } from "./ShareDialog/Dialog";
import { FilledButton } from "./ShareDialog/FilledButton";
import { TextField } from "./ShareDialog/TextField";

type Props = { roomId: string; closeDialog: () => void };

/** ホストが問題遷移と現在問題の解答表示を実行する画面。 */
export function ProblemOperationDialog({ roomId, closeDialog }: Props) {
    const currentQuestion = useCurrentQuestion();
    const [targetQuestionIdInput, setTargetQuestionIdInput] = useState(
        String(currentQuestion?.id ?? questionTemplates[0]?.id ?? 1),
    );
    const targetQuestionId = Number(targetQuestionIdInput);
    const targetQuestion = getQuestionTemplate(targetQuestionId);
    const ids = questionTemplates.map((question: QuestionTemplate) => question.id);
    const targetQuestionIndex = ids.indexOf(targetQuestionId);
    const move = (direction: -1 | 1) => {
        const next = ids[targetQuestionIndex + direction];
        if (next !== undefined) setTargetQuestionIdInput(String(next));
    };
    const apply = async () => {
        if (!targetQuestion) return;
        await socketController.applyQuestion({
            roomId,
            questionId: targetQuestion.id,
            deleteExternalElements: true,
            scrollToContent: true,
            answerBarReveal: false,
        });
    };
    const reveal = async () => {
        const result = await socketController.controlCurrentQuestion({
            roomId,
            deleteExternalElements: true,
            scrollToContent: true,
            answerBarReveal: true,
        });
        if (result.ok) socketController.revealQuestion(roomId);
    };

    return (
        <Dialog onCloseRequest={closeDialog} title="問題操作" size="regular">
            <div className="ProblemOperationDialog">
                <h2 id="dialog-title" className="ProblemOperationDialog__title">
                    問題操作
                </h2>
                <section className="ProblemOperationDialog__section">
                    <h3 className="ProblemOperationDialog__sectionTitle">問題遷移</h3>
                    <div className="ProblemOperationDialog__questionTransitionControls">
                        <span className="ProblemOperationDialog__currentQuestion">
                            現在の問題ID: {currentQuestion?.id ?? "未適用"}
                        </span>
                        <FilledButton
                            className="ProblemOperationDialog__stepButton"
                            color="muted"
                            disabled={targetQuestionIndex <= 0}
                            label="前の問題"
                            size="large"
                            variant="outlined"
                            onClick={() => move(-1)}
                        >
                            −
                        </FilledButton>
                        <TextField
                            className="ProblemOperationDialog__targetQuestionInput"
                            inputMode="numeric"
                            label="遷移先の問題ID"
                            type="number"
                            value={targetQuestionIdInput}
                            onChange={setTargetQuestionIdInput}
                        />
                        <FilledButton
                            className="ProblemOperationDialog__stepButton"
                            color="muted"
                            disabled={targetQuestionIndex < 0 || targetQuestionIndex >= ids.length - 1}
                            label="次の問題"
                            size="large"
                            variant="outlined"
                            onClick={() => move(1)}
                        >
                            ＋
                        </FilledButton>
                        <FilledButton
                            disabled={!targetQuestion}
                            icon={checkIcon}
                            label="適用"
                            size="large"
                            onClick={apply}
                        />
                    </div>
                    <div className="ProblemOperationDialog__questionPreview">
                        <h4 className="ProblemOperationDialog__previewTitle">問題文プレビュー</h4>
                        <p aria-live="polite" className="ProblemOperationDialog__previewContent">
                            {targetQuestion?.question ?? "該当する問題がありません。"}
                        </p>
                    </div>
                </section>
                <hr className="ProblemOperationDialog__divider" />
                <section className="ProblemOperationDialog__section ProblemOperationDialog__answerSection">
                    <h3 className="ProblemOperationDialog__sectionTitle">現在の問題の解答</h3>
                    <FilledButton
                        disabled={!currentQuestion}
                        label="表示"
                        size="large"
                        variant="outlined"
                        onClick={reveal}
                    />
                </section>
            </div>
        </Dialog>
    );
}
