import type { Socket } from "socket.io";
import { SocketEvents } from "../../../shared/SocketEvents";
import { userService } from "./UserService";

class UserController {
    public registerUser = (socket: Socket, userName: string) => {
        userService.addUser(userName, socket.id);
        socket.emit(SocketEvents.REGISTER_USER, `ユーザー: ${userName} が追加されました。`);
    };
}

export const userController = new UserController();