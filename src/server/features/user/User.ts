export class User {
    private id: number;
    private name: string;

    constructor(params: UserParams) {
        this.id = params.id;
        this.name = params.name;
    }

    public getId(): number {
        return this.id;
    }

    public getName(): string {
        return this.name;
    }
}

interface UserParams {
    id: number;
    name: string;
    socketId: string;
}