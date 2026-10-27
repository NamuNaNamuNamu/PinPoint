import type { User } from "../features/user/User";
import { userState } from "../features/user/UserState";

class UserLogger {
    /**
     * ユーザーの状態をイベント情報とともに標準出力へ記録する。
     *
     * @param props 発生イベントとユーザー ID。
     */
    outputUserState({ event, userId }: Props) {
        console.log("===== UserState =====");
        console.log(`${event}: ${userId}`);

        userState.forEachUser((user: User): void => {
            console.log(user);
        });

        console.log("=============\n");
    }
}

/**
 * ユーザー状態を記録するイベントの情報。
 */
type Props = {
    event: string;
    userId: number;
};

export const userLogger = new UserLogger();
