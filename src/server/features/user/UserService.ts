import { User } from "./User";
import { userLogger } from "../../logging/UserLogger";
import { userState } from "./UserState";

export class UserService {
    private nextId: number = 1;

    /**
     * ユーザーを新規作成し、UserStateに追加する。
     *
     * ユーザーIDを採番し、指定されたユーザー名とSocket IDをもとに
     * Userを生成してUserStateに追加する。
     * 追加後、UserStateをログ出力する。
     *
     * @param userName ユーザー名
     * @param socketId ユーザーに紐づくSocket ID
     * @returns 作成したユーザー
     */
    public addUser(userName: string, socketId: string) {
        const user: User = new User({
            id: this.nextId,
            name: userName,
            socketId: socketId,
        });

        userState.addUser(user);
        this.nextId++;

        userLogger.outputUserState({
            event: "追加",
            userId: user.getId(),
        });

        return user;
    }

    /**
     * 指定されたユーザーIDに一致するユーザーを取得する。
     *
     * ユーザーIDが指定されていない場合、または一致するユーザーが
     * 存在しない場合はundefinedを返す。
     *
     * @param id 取得対象のユーザーID
     * @returns 一致するユーザー。存在しない場合はundefined
     */
    public getUser(id: number | undefined) {
        return id ? userState.getUserById(id) : undefined;
    }

    /**
     * 指定した Socket ID に一致するユーザーを取得する。
     *
     * Socket ID が指定されていない場合、または一致するユーザーが
     * 存在しない場合は undefined を返す。
     *
     * @param socketId 取得対象の Socket ID
     * @returns 一致するユーザー。存在しない場合は undefined
     */
    public getUserBySocketId(socketId: string | undefined) {
        return socketId ? userState.getUserBySocketId(socketId) : undefined;
    }

    /**
     * 指定されたユーザーのSocket IDを更新する。
     *
     * ユーザーIDに一致するユーザーが存在する場合、
     * そのユーザーのSocket IDを指定された値に更新する。
     * ユーザーIDが指定されていない場合、または一致するユーザーが
     * 存在しない場合は何も行わない。
     *
     * @param userId 更新対象のユーザーID
     * @param socketId 更新後のSocket ID
     * @returns 更新対象のユーザー。存在しない場合はundefined
     */
    public updateSocketId(userId: number | undefined, socketId: string) {
        const user = this.getUser(userId);

        if (user) {
            const socketIdBefore = user.getSocketId();

            user.setSocketId(socketId);
            userState.updateUser(user);
            userLogger.outputUserState({
                event: `socketId 更新 (${socketIdBefore} -> ${socketId})`,
                userId: user.getId(),
            });
        }

        return user;
    }
}

export const userService = new UserService();
