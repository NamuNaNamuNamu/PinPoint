import { jest } from "@jest/globals";

const getSceneElements = jest.fn();
const scrollToContent = jest.fn();

jest.unstable_mockModule("../../../../src/client/features/excalidraw/ExcalidrawAPIHolder", () => ({
    excalidrawAPIHolder: {
        getApi: () => ({ getSceneElements, scrollToContent }),
    },
}));

const { onExcalidrawElementsInitialized } = await import("../../../../src/client/features/excalidraw/onExcalidrawElementsInitialized");

describe("onExcalidrawElementsInitialized", () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    test("空の scene では表示位置を変更しないこと", () => {
        getSceneElements.mockReturnValue([]);

        onExcalidrawElementsInitialized();

        expect(scrollToContent).not.toHaveBeenCalled();
    });

    test("要素がある scene では既存のオプションで表示位置を調整すること", () => {
        const elements = [{ id: "element-1" }];
        getSceneElements.mockReturnValue(elements);

        onExcalidrawElementsInitialized();

        expect(scrollToContent).toHaveBeenCalledWith(elements, {
            fitToViewport: true,
            viewportZoomFactor: 0.8,
            animate: true,
            duration: 1000,
        });
    });
});
