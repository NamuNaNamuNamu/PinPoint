import type { ExcalidrawImperativeAPI } from "@excalidraw/excalidraw/types";
import type { LineProps } from "./LineSkeletonFactory";

export class Line {
    private readonly skeleton;
    private readonly moveRange: MoveRange;
    private excalidrawAPI: ExcalidrawImperativeAPI | null;

    constructor ({ skeleton, moveRange }: Params) {
        this.skeleton = skeleton;
        this.moveRange = moveRange;
        this.excalidrawAPI = null;
    }

    setExcalidrawAPI(excalidrawAPI: ExcalidrawImperativeAPI) {
        this.excalidrawAPI = excalidrawAPI;
    }

    getExalidrawAPI() {
        if (!this.excalidrawAPI) {
            throw new Error("ExcalidrawAPI が未設定です");
        }

        return this.excalidrawAPI;
    }

    private getExcalidrawElement() {
        const api = this.getExalidrawAPI();

        const element = api
            .getSceneElements()
            .find(e => e.id === this.getId());

        if (!element) {
            throw new Error("Excalidraw 要素が見つかりませんでした");
        }

        return element;
    }

    getSkeleton() {
        return this.skeleton;
    }

    getId() {
        return this.skeleton.id;
    }

    private getX() { return this.getExcalidrawElement().x }

    private setX(x: number) {
        const api = this.getExalidrawAPI();
        const elements = api.getSceneElements();

        api.updateScene({
            elements: elements.map((el) =>
                el.id === this.getId()
                    ? {
                        ...el,
                        x: x,
                    }
                    : el
            ),
        });
    }

    private getY() { return this.getExcalidrawElement().y }

    private setY(y: number) {
        const api = this.getExalidrawAPI();
        const elements = api.getSceneElements();

        api.updateScene({
            elements: elements.map((el) =>
                el.id === this.getId()
                    ? {
                        ...el,
                        y: y,
                    }
                    : el
            ),
        });
    }

    onChange(): void {
        // 移動制限
        if (this.getX() < this.moveRange.minX) {
            this.setX(this.moveRange.minX);
        }

        if (this.getX() > this.moveRange.maxX) {
            this.setX(this.moveRange.maxX);
        }

        if (this.getY() < this.moveRange.minY) {
            this.setY(this.moveRange.minY);
        }

        if (this.getY() > this.moveRange.maxY) {
            this.setY(this.moveRange.maxY);
        }
    }
}

interface Params {
    skeleton: any;
    moveRange: MoveRange;
}

interface MoveRange {
    minX: number;
    maxX: number;
    minY: number;
    maxY: number;
}