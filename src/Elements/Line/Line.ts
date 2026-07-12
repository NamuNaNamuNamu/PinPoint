import { excalidrawAPIHolder } from "../../App/ExcalidrawAPIHolder";

export class Line {
    private readonly skeleton;
    private readonly moveRange: MoveRange;

    constructor ({ skeleton, moveRange }: Params) {
        this.skeleton = skeleton;
        this.moveRange = moveRange;
    }

    private getExcalidrawElement() {
        const api = excalidrawAPIHolder.getApi();

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
        const api = excalidrawAPIHolder.getApi();
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
        const api = excalidrawAPIHolder.getApi();
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