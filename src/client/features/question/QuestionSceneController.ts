import { convertToExcalidrawElements } from "@excalidraw/excalidraw";

import type { QuestionApplied, QuestionRevealed } from "../../../shared/question/QuestionEvents";
import {
    getAllQuestionManagedElementIds,
    getQuestionManagedElementIds,
} from "../../../shared/question/QuestionManagedElementIds";
import { answerBarSceneController } from "../answerBar/AnswerBarSceneController";
import { lineSkeletonFactory } from "../excalidraw/Elements/Line/LineSkeletonFactory";
import { textSkeletonFactory } from "../excalidraw/Elements/Text/TextSkeletonFactory";
import { excalidrawAPIHolder } from "../excalidraw/ExcalidrawAPIHolder";
import { setSliders, sliders } from "../excalidraw/Slider/Sliders";

/**
 * 正解旗の三角形先端から上端までの高さ。
 */
const CORRECT_ANSWER_FLAG_HEIGHT = 14;
/**
 * 選択肢テキストに使用するフォントサイズ。
 */
const CHOICE_FONT_SIZE = 30;
/**
 * Excalidraw の 30px テキスト 1 行を収めるための高さ。
 */
const CHOICE_TEXT_HEIGHT = 38;
/**
 * 選択肢テキスト下端と正解旗上端の最小間隔。
 */
const CHOICE_TO_FLAG_GAP = 12;

/**
 * 問題テンプレートと正解マーカーを scene に反映する。
 */
class QuestionSceneController {
    private readonly managedElementIds = new Set<string>();
    private currentQuestion: QuestionApplied["question"] | undefined;

    /**
     * サーバーから配布された問題と AnswerBar を scene に適用する。
     *
     * @param payload サーバーが配布した問題状態。
     * @param operatorUserId 現在操作しているユーザー ID。
     */
    public apply(payload: QuestionApplied, operatorUserId: number): void {
        const api = excalidrawAPIHolder.getApi();
        answerBarSceneController.clear();
        const allManagedElementIds = getAllQuestionManagedElementIds();
        const previous = excalidrawAPIHolder
            .getSceneElementsWithTombstones()
            .filter(
                (element) =>
                    !this.managedElementIds.has(element.id) &&
                    !allManagedElementIds.has(element.id) &&
                    !payload.deleteExternalElements,
            );
        this.managedElementIds.clear();
        this.currentQuestion = payload.question;
        setSliders(payload.question.sliders);
        const elements = convertToExcalidrawElements(this.getQuestionSkeletons(), { regenerateIds: false });
        elements.forEach((element) => this.managedElementIds.add(element.id));
        api.updateScene({ elements: [...previous, ...elements] });
        payload.answerBars.forEach((answerBar) => answerBarSceneController.add(answerBar, operatorUserId));
        if (payload.scrollToContent) {
            api.scrollToContent(excalidrawAPIHolder.getActiveSceneElements(), {
                fitToViewport: true,
                viewportZoomFactor: 0.8,
                animate: true,
                duration: 1000,
            });
        }
    }

    /**
     * 現在の問題の各 Slider に、操作不能な赤い正解線と下向き三角形の旗を表示する。
     *
     * 旗の三角形先端は正解線の上端に一致する。
     *
     * 現在の問題が未適用、または通知の問題 ID が現在の問題 ID と一致しない場合は scene を変更しない。
     *
     * @param payload サーバーが配布した正解表示通知。
     */
    public reveal(payload: QuestionRevealed): void {
        const question = this.currentQuestion;
        if (!question || payload.questionId !== question.id) {
            return;
        }
        const api = excalidrawAPIHolder.getApi();
        const markers = convertToExcalidrawElements(
            question.sliders.flatMap((slider) => [
                lineSkeletonFactory.createWith({
                    id: `correct-answer-${slider.id}`,
                    x: slider.x + slider.width * slider.correctAnswerRatio,
                    y: slider.y,
                    width: slider.height,
                    strokeColor: "#E53935",
                    locked: true,
                }),
                {
                    type: "arrow",
                    id: `correct-answer-flag-${slider.id}`,
                    x: slider.x + slider.width * slider.correctAnswerRatio,
                    y: slider.y - CORRECT_ANSWER_FLAG_HEIGHT,
                    points: [[0, 0], [0, CORRECT_ANSWER_FLAG_HEIGHT]],
                    strokeColor: "#E53935",
                    strokeWidth: 2,
                    endArrowhead: "triangle",
                    locked: true,
                    roughness: 0,
                },
            ]),
            { regenerateIds: false },
        );
        markers.forEach((marker) => this.managedElementIds.add(marker.id));
        const remaining = excalidrawAPIHolder
            .getSceneElementsWithTombstones()
            .filter((element) => !markerIds(question).has(element.id));
        api.updateScene({ elements: [...remaining, ...markers] });
        api.setToast({ message: "解答表示！", duration: 2000 });
    }

    /**
     * 現在管理している問題要素と AnswerBar をローカル scene から除去する。
     *
     * ルームの問題状態はサーバー側に保持されるため、退出したクライアントだけの表示状態を初期化する。
     */
    public clear(): void {
        answerBarSceneController.clear();
        const api = excalidrawAPIHolder.getApi();
        api.updateScene({
            elements: excalidrawAPIHolder
                .getSceneElementsWithTombstones()
                .filter(
                    (element) =>
                        !this.managedElementIds.has(element.id) && !getAllQuestionManagedElementIds().has(element.id),
                ),
        });
        this.managedElementIds.clear();
        this.currentQuestion = undefined;
        setSliders([]);
    }

    /**
     * 現在適用中の問題と AnswerBar を表示範囲へ合わせる。
     *
     * 現在の問題がない場合は scene を変更しない。
     */
    public scrollToCurrentContent(): void {
        if (!this.currentQuestion) {
            return;
        }
        excalidrawAPIHolder.getApi().scrollToContent(excalidrawAPIHolder.getActiveSceneElements(), {
            fitToViewport: true,
            viewportZoomFactor: 0.8,
            animate: true,
            duration: 1000,
        });
    }

    private getQuestionSkeletons() {
        const question = this.currentQuestion!;
        const firstSlider = question.sliders[0];
        if (!firstSlider) {
            return [];
        }
        const centerX = firstSlider.x + firstSlider.width / 2;
        const choiceY = firstSlider.y - CORRECT_ANSWER_FLAG_HEIGHT - CHOICE_TO_FLAG_GAP - CHOICE_TEXT_HEIGHT;
        return [
            textSkeletonFactory.createWith({
                id: `question-${question.id}`,
                x: centerX,
                y: 80,
                text: question.question,
                locked: true,
                fontSize: 20,
            }),
            textSkeletonFactory.createWith({
                id: `choice-left-${question.id}`,
                x: firstSlider.x,
                y: choiceY,
                text: question.choiceLeft,
                locked: true,
                fontSize: CHOICE_FONT_SIZE,
            }),
            textSkeletonFactory.createWith({
                id: `choice-right-${question.id}`,
                x: firstSlider.x + firstSlider.width,
                y: choiceY,
                text: question.choiceRight,
                locked: true,
                fontSize: CHOICE_FONT_SIZE,
            }),
            ...sliders.flatMap((slider) => slider.getSkeleton()),
        ];
    }
}

/**
 * 指定問題の Slider に対応する正解マーカー要素の ID 集合を返す。
 *
 * AnswerBar、問題文、選択肢、Slider 本体の ID は含めない。
 * `reveal()` が同じ問題の既存正解マーカーを置換するために使用する。
 *
 * @param question 正解マーカーの対象となる問題テンプレート。
 * @returns `correct-answer-${slider.id}` 形式の正解マーカー ID 集合。
 */
function markerIds(question: QuestionApplied["question"]): ReadonlySet<string> {
    return new Set([...getQuestionManagedElementIds(question)].filter((id) => id.startsWith("correct-answer-")));
}

export const questionSceneController = new QuestionSceneController();
