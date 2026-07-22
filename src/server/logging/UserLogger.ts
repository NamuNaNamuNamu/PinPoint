import type { UserState } from "../features/user/UserState";
import type { User } from "../../client/features/user/User";

class UserLogger {
    outputUserState(userState: UserState) {
        console.log("===== UserState =====");

        userState.forEachRoom((user: User): void => {
            console.log(user);
        });
        
        console.log("=============\n");
    }
}

export const userLogger = new UserLogger();