export class Rectangle {
    private readonly skeleton;

    constructor ({ skeleton }: Params) {
        this.skeleton = skeleton;
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