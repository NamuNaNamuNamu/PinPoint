import { jest } from "@jest/globals";

const getNormalizedElement = jest.fn();

jest.unstable_mockModule("../../../../../src/client/features/excalidraw/Elements/Line/Line", () => ({
    Line: class {
        public getId(): string {
            return "line-1";
        }

        public getSkeleton(): object {
            return {};
        }

        public getNormalizedElement() {
            return getNormalizedElement();
        }
    },
}));
jest.unstable_mockModule("../../../../../src/client/features/excalidraw/Elements/Line/LineSkeletonFactory", () => ({
    lineSkeletonFactory: { createWith: jest.fn(() => ({})) },
}));
jest.unstable_mockModule("../../../../../src/client/features/excalidraw/Elements/Text/Text", () => ({
    Text: class {
        public getId(): string {
            return "label-1";
        }

        public getSkeleton(): object {
            return {};
        }

        public centerInElements<T>(elements: readonly T[]): readonly T[] {
            return elements;
        }

        public getCenteredElement() {
            return undefined;
        }

        public setText(): void {}
    },
}));
jest.unstable_mockModule("../../../../../src/client/features/excalidraw/Elements/Text/TextSkeletonFactory", () => ({
    textSkeletonFactory: { createWith: jest.fn(() => ({})) },
}));

const { AnswerBar } = await import("../../../../../src/client/features/excalidraw/Slider/AnswerBar");

describe("AnswerBar", () => {
    test("範囲内の水平移動は正規化差分がなくても位置更新として返すこと", () => {
        getNormalizedElement.mockReturnValue({ element: { x: 500 }, isUpdated: false });
        const answerBar = new AnswerBar({
            answerBarId: "bar-1",
            ownerUserId: 1,
            ownerUserName: "Alice",
            operatorUserId: 1,
            lineId: "line-1",
            labelId: "label-1",
            x: 400,
            y: 100,
            labelY: 120,
            height: 300,
            moveRange: { minX: 100, maxX: 700, minY: 100, maxY: 100 },
            slot: 0,
        });

        expect(answerBar.getElementUpdates(1)).toEqual({
            elements: [],
            position: { answerBarId: "bar-1", lineId: "line-1", x: 500 },
        });
        expect(answerBar.getElementUpdates(1)).toEqual({ elements: [] });
    });
});
