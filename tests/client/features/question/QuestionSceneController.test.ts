import type { ExcalidrawImperativeAPI } from "@excalidraw/excalidraw/types";
import { jest } from "@jest/globals";

type SetSliders = typeof import("../../../../src/client/features/excalidraw/Slider/Sliders").setSliders;

const updateScene = jest.fn<ExcalidrawImperativeAPI["updateScene"]>();
const scrollToContent = jest.fn();
const addFiles = jest.fn();
const getSceneElementsWithTombstones = jest.fn();
const getActiveSceneElements = jest.fn();
const clearAnswerBars = jest.fn();
const setInteractionLocked = jest.fn();
const setSliders = jest.fn<SetSliders>();
const sliders: Array<{ getSkeleton(): { id: string }[] }> = [];

setSliders.mockImplementation((definitions) => {
    sliders.splice(
        0,
        sliders.length,
        ...definitions.map((definition) => ({
            getSkeleton: () => [{ id: `rectangle-${definition.id}` }, { id: `text-${definition.id}` }],
        })),
    );
});

jest.unstable_mockModule("@excalidraw/excalidraw", () => ({
    convertToExcalidrawElements: jest.fn((elements) => elements),
}));
jest.unstable_mockModule("../../../../src/client/features/answerBar/AnswerBarSceneController", () => ({
    answerBarSceneController: { clear: clearAnswerBars, add: jest.fn(), hasElement: jest.fn(), setInteractionLocked },
}));
jest.unstable_mockModule("../../../../src/client/features/excalidraw/Elements/Line/LineSkeletonFactory", () => ({
    lineSkeletonFactory: { createWith: jest.fn((element) => element) },
}));
jest.unstable_mockModule("../../../../src/client/features/excalidraw/Elements/Text/TextSkeletonFactory", () => ({
    textSkeletonFactory: { createWith: jest.fn((element) => element) },
}));
jest.unstable_mockModule("../../../../src/client/features/excalidraw/ExcalidrawAPIHolder", () => ({
    excalidrawAPIHolder: {
        getApi: () => ({ updateScene, scrollToContent, addFiles }),
        getActiveSceneElements,
        getSceneElementsWithTombstones,
    },
}));
jest.unstable_mockModule("../../../../src/client/features/excalidraw/Slider/Sliders", () => ({ sliders, setSliders }));

const { questionSceneController } = await import("../../../../src/client/features/question/QuestionSceneController");

describe("QuestionSceneController", () => {
    beforeEach(() => {
        jest.clearAllMocks();
        getSceneElementsWithTombstones.mockReturnValue([]);
        questionSceneController.clear();
        jest.clearAllMocks();
        sliders.splice(0, sliders.length);
        getSceneElementsWithTombstones.mockReturnValue([]);
        getActiveSceneElements.mockReturnValue([{ id: "question-1" }]);
    });

    test("問題未適用時の reveal は scene を更新しないこと", () => {
        questionSceneController.reveal({ questionId: 1 });

        expect(updateScene).not.toHaveBeenCalled();
    });

    test("異なる問題 ID の reveal は正解マーカーを更新しないこと", () => {
        questionSceneController.apply(
            {
                question: {
                    id: 2,
                    question: "質問 2",
                    choiceLeft: "左",
                    choiceRight: "右",
                    sliders: [
                        {
                            id: "slider-2",
                            name: "評価",
                            x: 100,
                            y: 220,
                            width: 600,
                            height: 48,
                            correctAnswerRatio: 0.5,
                        },
                    ],
                },
                answerBars: [],
                deleteExternalElements: false,
                scrollToContent: false,
            },
            1,
        );
        jest.clearAllMocks();
        getSceneElementsWithTombstones.mockReturnValue([{ id: "correct-answer-slider-2" }]);

        questionSceneController.reveal({ questionId: 1 });

        expect(updateScene).not.toHaveBeenCalled();
    });

    test("同じ問題 ID の reveal は既存正解マーカーを置換すること", () => {
        questionSceneController.apply(
            {
                question: {
                    id: 1,
                    question: "質問",
                    choiceLeft: "左",
                    choiceRight: "右",
                    sliders: [
                        {
                            id: "slider-1",
                            name: "評価",
                            x: 100,
                            y: 220,
                            width: 600,
                            height: 48,
                            correctAnswerRatio: 0.5,
                        },
                    ],
                },
                answerBars: [],
                deleteExternalElements: false,
                scrollToContent: false,
            },
            1,
        );
        jest.clearAllMocks();
        getSceneElementsWithTombstones.mockReturnValue([{ id: "external" }, { id: "correct-answer-slider-1", x: 0 }]);

        questionSceneController.reveal({ questionId: 1 });

        expect(updateScene).toHaveBeenCalledWith({
            elements: [
                { id: "external" },
                {
                    id: "correct-answer-slider-1",
                    x: 400,
                    y: 220,
                    width: 48,
                    strokeColor: "#E53935",
                    locked: true,
                },
                {
                    type: "image",
                    id: "correct-answer-flag-slider-1",
                    x: 388,
                    y: 206,
                    width: 24,
                    height: 14,
                    fileId: "correct-answer-flag-file-slider-1",
                    status: "saved",
                    locked: true,
                },
            ],
        });
        expect(addFiles).toHaveBeenCalledWith([
            expect.objectContaining({
                id: "correct-answer-flag-file-slider-1",
                mimeType: "image/svg+xml",
            }),
        ]);
        expect(setInteractionLocked).toHaveBeenCalledWith(true);
    });

    test("選択肢テキスト下端と正解旗上端の間に 12px を確保する", () => {
        questionSceneController.apply(
            {
                question: {
                    id: 1,
                    question: "質問",
                    choiceLeft: "左",
                    choiceRight: "右",
                    sliders: [
                        {
                            id: "slider-1",
                            name: "評価",
                            x: 100,
                            y: 220,
                            width: 600,
                            height: 48,
                            correctAnswerRatio: 0.5,
                        },
                    ],
                },
                answerBars: [],
                deleteExternalElements: false,
                scrollToContent: false,
            },
            1,
        );

        const scene = updateScene.mock.calls[0]?.[0];
        if (!scene?.elements) {
            throw new Error("問題 scene が更新されていません。");
        }
        const leftChoice = scene.elements.find((element) => element.id === "choice-left-1");
        if (!leftChoice) {
            throw new Error("選択肢テキストが生成されていません。");
        }
        expect(leftChoice).toEqual(expect.objectContaining({ y: 156, fontSize: 30 }));
        expect(220 - 14 - (leftChoice.y + 38)).toBeGreaterThanOrEqual(12);
    });

    test("clear は問題管理要素と AnswerBar を除去し、外部要素を保持すること", () => {
        questionSceneController.apply(
            {
                question: {
                    id: 1,
                    question: "質問",
                    choiceLeft: "左",
                    choiceRight: "右",
                    sliders: [
                        {
                            id: "slider-1",
                            name: "評価",
                            x: 100,
                            y: 220,
                            width: 600,
                            height: 48,
                            correctAnswerRatio: 0.5,
                        },
                    ],
                },
                answerBars: [],
                deleteExternalElements: false,
                scrollToContent: false,
            },
            1,
        );
        questionSceneController.reveal({ questionId: 1 });
        getSceneElementsWithTombstones.mockReturnValue([
            { id: "external" },
            { id: "question-1" },
            { id: "choice-left-1" },
            { id: "choice-right-1" },
            { id: "rectangle-slider-1" },
            { id: "text-slider-1" },
            { id: "correct-answer-slider-1" },
        ]);

        questionSceneController.clear();

        expect(clearAnswerBars).toHaveBeenCalledTimes(2);
        expect(updateScene).toHaveBeenLastCalledWith({ elements: [{ id: "external" }] });
        expect(setSliders).toHaveBeenLastCalledWith([]);
        expect(scrollToContent).not.toHaveBeenCalled();
    });

    test("scrollToContent が true のとき、問題と AnswerBar の反映後に表示範囲を合わせること", () => {
        questionSceneController.apply(
            {
                question: {
                    id: 1,
                    question: "質問",
                    choiceLeft: "左",
                    choiceRight: "右",
                    sliders: [
                        {
                            id: "slider-1",
                            name: "評価",
                            x: 100,
                            y: 220,
                            width: 600,
                            height: 48,
                            correctAnswerRatio: 0.5,
                        },
                    ],
                },
                answerBars: [],
                deleteExternalElements: false,
                scrollToContent: true,
            },
            1,
        );

        expect(scrollToContent).toHaveBeenCalledWith([{ id: "question-1" }], {
            fitToViewport: true,
            viewportZoomFactor: 0.8,
            animate: true,
            duration: 1000,
        });
    });

    test("問題切替時に遅延同期された旧問題の管理要素を残さないこと", () => {
        questionSceneController.apply(
            {
                question: {
                    id: 1,
                    question: "問題1",
                    choiceLeft: "左",
                    choiceRight: "右",
                    sliders: [
                        {
                            id: "question-1-slider-1",
                            name: "評価",
                            x: 100,
                            y: 220,
                            width: 600,
                            height: 48,
                            correctAnswerRatio: 0.5,
                        },
                    ],
                },
                answerBars: [],
                deleteExternalElements: false,
                scrollToContent: false,
            },
            1,
        );
        getSceneElementsWithTombstones.mockReturnValue([
            { id: "question-1" },
            { id: "choice-left-1" },
            { id: "rectangle-question-1-slider-1" },
            { id: "correct-answer-question-1-slider-1" },
            { id: "external" },
        ]);

        questionSceneController.apply(
            {
                question: {
                    id: 2,
                    question: "問題2",
                    choiceLeft: "左",
                    choiceRight: "右",
                    sliders: [
                        {
                            id: "question-2-slider-1",
                            name: "評価",
                            x: 100,
                            y: 220,
                            width: 600,
                            height: 48,
                            correctAnswerRatio: 0.5,
                        },
                    ],
                },
                answerBars: [],
                deleteExternalElements: false,
                scrollToContent: false,
            },
            1,
        );

        expect(updateScene).toHaveBeenLastCalledWith({
            elements: expect.arrayContaining([
                expect.objectContaining({ id: "external" }),
                expect.objectContaining({ id: "question-2" }),
                expect.objectContaining({ id: "choice-left-2" }),
            ]),
        });

        for (const id of [
            "question-1",
            "choice-left-1",
            "rectangle-question-1-slider-1",
            "correct-answer-question-1-slider-1",
        ]) {
            expect(updateScene).toHaveBeenLastCalledWith({
                elements: expect.not.arrayContaining([expect.objectContaining({ id })]),
            });
        }
    });
});
