import { ElementCommon } from "../../ElementCommon";

export class Rectangle {
    private readonly elementCommon;

    constructor ({ skeleton }: Params) {
        this.elementCommon = new ElementCommon({ skeleton });
    }

    getSkeleton() { return this.elementCommon.getSkeleton(); }

    getId() { return this.elementCommon.getId(); }
}

interface Params {
    skeleton: any;
}