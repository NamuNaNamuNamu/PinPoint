import { User } from "../../../client/features/user/User";
import { userLogger } from "../../logging/UserLogger";
import { userState } from "./UserState";

class UserService {
    private nextId: number = 1;

    public addUser(userName: string) {
        const user: User = new User({
            id: this.nextId,
            name: userName
        });

        userState.addUser(user);
        this.nextId++;

        userLogger.outputUserState(userState);
    }
}

export const userService = new UserService();