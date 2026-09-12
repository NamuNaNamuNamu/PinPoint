import { userState } from "../features/user/UserState";
import type { User } from "../features/user/User";

class UserLogger {
    outputUserState({ event, userId }: Props) {
        console.log("===== UserState =====");
        console.log(`${event}: ${userId}`);

        userState.forEachUser((user: User): void => {
            console.log(user);
        });

        console.log("=============\n");
    }
}

type Props = {
    event: string;
    userId: number;
};

export const userLogger = new UserLogger();
