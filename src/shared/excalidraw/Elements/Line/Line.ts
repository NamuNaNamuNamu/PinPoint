import { excalidrawAPIHolder } from "../../../../client/features/excalidraw/ExcalidrawAPIHolder";
import { ElementCommon } from "../../ElementCommon";

export class Line {
    private readonly elementCommon;
    private readonly moveRange: MoveRange;
    private previousElement: any;

    constructor ({ skeleton, moveRange }: Params) {
        this.elementCommon = new ElementCommon({ skeleton });
        this.moveRange = moveRange;
        this.previousElement = null;
    }

    private getExcalidrawElement() { return this.elementCommon.getExcalidrawElement() }

    getSkeleton() { return this.elementCommon.getSkeleton(); }

    getId() { return this.elementCommon.getId(); }

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

    private getHeight() { return this.getExcalidrawElement().height }

    private cancelChange() {
        const api = excalidrawAPIHolder.getApi();
        const elements = api.getSceneElements();

        api.updateScene({
            elements: elements.map((el) =>
                el.id === this.getId()
                    ? {
                        ...this.previousElement
                    }
                    : el
            ),
        });
    }

    onChange(): void {
        // 移動以外の変更を無効化
        if (this.previousElement) {
            if(this.getHeight() !== this.previousElement.height) {
                this.cancelChange();
            }
        }

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

        // cancelChange() 用
        this.previousElement = structuredClone(this.getExcalidrawElement());
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