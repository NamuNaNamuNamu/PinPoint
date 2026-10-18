import { jest } from "@jest/globals";

type SceneElementForTest = {
    id: string;
    [key: string]: unknown;
};

const getSceneElements = jest.fn<() => SceneElementForTest[]>();
const getSceneElementsIncludingDeleted = jest.fn<() => SceneElementForTest[]>();
const findActiveElementById = jest.fn((id: string) => getSceneElements().find((element) => element.id === id));
const updateScene = jest.fn();
const newElementWith = jest.fn((element: any, updates: any) => ({
    ...element,
    ...updates,
    version: element.version + 1,
    versionNonce: 100,
}));
const convertToExcalidrawElements = jest.fn();

jest.unstable_mockModule("@excalidraw/excalidraw", () => ({ convertToExcalidrawElements, newElementWith }));
jest.unstable_mockModule("../../../../../../src/client/features/excalidraw/ExcalidrawAPIHolder", () => ({
    excalidrawAPIHolder: {
        getApi: () => ({ updateScene }),
        getSceneElementsWithTombstones: getSceneElementsIncludingDeleted,
        findActiveElementById,
    },
}));

const { Text } = await import("../../../../../../src/client/features/excalidraw/Elements/Text/Text");

/** Text の単体テスト。 */
describe("Text", () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    test("現在の座標と同じ座標を指定した場合は scene を更新しないこと", () => {
        getSceneElementsIncludingDeleted.mockReturnValue([{ id: "label-1", x: 100, y: 200 }]);
        const text = new Text({ skeleton: { id: "label-1" } });

        text.setPosition(100, 200);

        expect(newElementWith).not.toHaveBeenCalled();
        expect(updateScene).not.toHaveBeenCalled();
    });

    test("現在の座標と異なる座標を指定した場合は対象要素の更新世代を進めること", () => {
        const elements = [
            { id: "other", x: 1, y: 2, version: 3, versionNonce: 30 },
            { id: "label-1", x: 100, y: 200, version: 4, versionNonce: 40 },
        ];
        getSceneElementsIncludingDeleted.mockReturnValue(elements);
        const text = new Text({ skeleton: { id: "label-1" } });

        text.setPosition(120, 200);

        expect(newElementWith).toHaveBeenCalledWith(elements[1], { x: 120, y: 200 });
        expect(updateScene).toHaveBeenCalledWith({
            elements: [
                { id: "other", x: 1, y: 2, version: 3, versionNonce: 30 },
                { id: "label-1", x: 120, y: 200, version: 5, versionNonce: 100 },
            ],
        });
    });

    test("指定座標が外枠中心となるよう生成済みテキストの座標を補正すること", () => {
        const text = new Text({ skeleton: { id: "label-1" } });
        const elements = [{ id: "label-1", x: 100, y: 200, width: 80, height: 20 }];

        expect(text.centerInElements(elements as any, 100, 200)).toEqual([
            { id: "label-1", x: 60, y: 190, width: 80, height: 20 },
        ]);
    });

    test("指定座標が外枠中心となるよう scene 上のテキストを移動すること", () => {
        const elements = [{ id: "label-1", x: 0, y: 0, width: 80, height: 20, version: 1 }];
        getSceneElements.mockReturnValue(elements);
        getSceneElementsIncludingDeleted.mockReturnValue(elements);
        const text = new Text({ skeleton: { id: "label-1" } });

        text.setCenterPosition(100, 200);

        expect(updateScene).toHaveBeenCalledWith({
            elements: [{ id: "label-1", x: 60, y: 190, width: 80, height: 20, version: 2, versionNonce: 100 }],
        });
    });

    test("scene 上のテキスト内容を更新すること", () => {
        const elements = [
            {
                id: "label-1",
                type: "text",
                text: "変更前",
                originalText: "変更前",
                x: 10,
                y: 20,
                width: 40,
                height: 20,
                version: 1,
            },
        ];
        getSceneElements.mockReturnValue(elements);
        getSceneElementsIncludingDeleted.mockReturnValue(elements);
        convertToExcalidrawElements.mockReturnValue([
            {
                id: "label-1",
                type: "text",
                text: "変更後",
                originalText: "変更後",
                width: 80,
                height: 20,
            },
        ]);
        const text = new Text({ skeleton: { id: "label-1", type: "text", text: "変更前" } });

        text.setText("変更後");

        expect(convertToExcalidrawElements).toHaveBeenCalledWith([{ id: "label-1", type: "text", text: "変更後" }], {
            regenerateIds: false,
        });
        expect(newElementWith).toHaveBeenCalledWith(elements[0], {
            text: "変更後",
            originalText: "変更後",
            width: 80,
            height: 20,
            x: -10,
            y: 20,
        });
        expect(updateScene).toHaveBeenCalledWith({
            elements: [
                {
                    id: "label-1",
                    type: "text",
                    text: "変更後",
                    originalText: "変更後",
                    x: -10,
                    y: 20,
                    width: 80,
                    height: 20,
                    version: 2,
                    versionNonce: 100,
                },
            ],
        });
    });
});
