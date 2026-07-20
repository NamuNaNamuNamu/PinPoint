import type { User } from "../../App/User/User";
import type { UserState } from "../features/user/UserState";

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