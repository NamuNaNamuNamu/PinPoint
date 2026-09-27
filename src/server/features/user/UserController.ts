import type { Socket } from "socket.io";
import { userService } from "./UserService";

/**
 * Socket を受け取り、ユーザーに関する操作を処理する。
 */
class UserController {
    /**
     * ソケットに紐づくユーザーを登録する。
     *
     * @param socket 登録するクライアントのソケット。
     * @param userName 登録するユーザー名。
     * @returns 登録したユーザー。
     */
    public registerUser = (socket: Socket, userName: string) => {
        return userService.addUser(userName, socket.id);
    };

    /**
     * ユーザー ID からユーザーを取得する。
     *
     * @param userId 検索するユーザー ID。
     * @returns 一致したユーザー、または `undefined`。
     */
    public getUser = (userId: number | undefined) => {
        return userService.getUser(userId);
    }

    /**
     * ユーザーに紐づくソケット ID を更新する。
     *
     * @param userId 更新するユーザー ID。
     * @param socketId 更新後のソケット ID。
     * @returns 更新したユーザー、または `undefined`。
     */
    public updateSocketId = (userId: number | undefined, socketId: string) => {
        return userService.updateSocketId(userId, socketId);
    }
}

export const userController = new UserController();
