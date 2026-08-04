import { excalidrawAPIHolder } from "../../../../client/features/excalidraw/ExcalidrawAPIHolder";

export class Rectangle {
    private readonly skeleton;

    constructor ({ skeleton }: Params) {
        this.skeleton = skeleton;
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
}

interface Params {
    skeleton: any;
}