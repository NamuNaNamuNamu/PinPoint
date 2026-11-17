import { jest } from "@jest/globals";

import type { CurrentQuestionState, QuestionApplied } from "../../../../src/shared/question/QuestionEvents";
import { SocketEvents } from "../../../../src/shared/SocketEvents";

const off = jest.fn();
const on = jest.fn();
const setSyncEpoch = jest.fn();
const apply = jest.fn();
const setAnswerBarReveal = jest.fn();

jest.unstable_mockModule("../../../../src/client/socket/socket", () => ({ socket: { off, on } }));
jest.unstable_mockModule("../../../../src/client/socket/SocketController", () => ({ socketController: { setSyncEpoch } }));
jest.unstable_mockModule("../../../../src/client/features/question/QuestionSceneController", () => ({
    questionSceneController: { apply, reveal: jest.fn(), scrollToCurrentContent: jest.fn(), removeExternalElements: jest.fn() },
}));
jest.unstable_mockModule("../../../../src/client/features/room/roomSettingsStore", () => ({
    roomSettingsStore: { setAnswerBarReveal },
}));

const { registerQuestionListener } = await import("../../../../src/client/features/question/registerQuestionListener");

describe("registerQuestionListener", () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    test("問題適用と再接続時の状態から AnswerBar 公開設定を UI ストアへ同期すること", () => {
        registerQuestionListener(10);
        const onApplied = on.mock.calls.find(([event]) => event === SocketEvents.QUESTION_APPLIED)?.[1] as (
            payload: QuestionApplied,
        ) => void;
        const onCurrentState = on.mock.calls.find(([event]) => event === SocketEvents.CURRENT_QUESTION_STATE)?.[1] as (
            payload: CurrentQuestionState,
        ) => void;
        const payload = {
            question: { id: 1, question: "問題", choiceLeft: "", choiceRight: "", sliders: [] },
            answerBars: [],
            deleteExternalElements: true,
            scrollToContent: true,
            answerBarReveal: false,
            syncEpoch: 3,
        } satisfies QuestionApplied;

        onApplied(payload);
        onCurrentState({ ...payload, answerBarReveal: true, syncEpoch: 4 });

        expect(setSyncEpoch).toHaveBeenNthCalledWith(1, 3);
        expect(setSyncEpoch).toHaveBeenNthCalledWith(2, 4);
        expect(apply).toHaveBeenCalledWith(payload, 10);
        expect(setAnswerBarReveal).toHaveBeenNthCalledWith(1, false);
        expect(setAnswerBarReveal).toHaveBeenNthCalledWith(2, true);
    });
});
