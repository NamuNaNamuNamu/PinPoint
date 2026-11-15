/** @jest-environment jsdom */
import { jest } from "@jest/globals";
import type { MouseEvent, ReactNode } from "react";
import { act } from "react";
import { createRoot, type Root } from "react-dom/client";

import type { RoomParticipant } from "../../../src/shared/room/RoomEvents";

Object.assign(globalThis, { IS_REACT_ACT_ENVIRONMENT: true });

type GetRoomParticipants =
    (typeof import("../../../src/client/socket/SocketController").socketController)["getRoomParticipants"];
type KickUser = (typeof import("../../../src/client/socket/SocketController").socketController)["kickUser"];

type FilledButtonProps = {
    color?: "primary" | "danger" | "warning" | "muted" | "success";
    label?: string;
    onClick?: (event: MouseEvent<HTMLButtonElement>) => void;
    size?: "medium" | "large";
    variant?: "filled" | "outlined" | "icon";
};

const initialParticipants = [
    { userId: 12, userName: "田中", isCreator: false, connectionStatus: "connected" },
] satisfies readonly RoomParticipant[];
const refreshedParticipants = [
    { userId: 21, userName: "佐藤", isCreator: false, connectionStatus: "reconnecting" },
] satisfies readonly RoomParticipant[];
const getRoomParticipants = jest.fn<GetRoomParticipants>();
const kickUser = jest.fn<KickUser>();

jest.unstable_mockModule("../../../src/client/socket/SocketController", () => ({
    socketController: { getRoomParticipants, kickUser },
}));
jest.unstable_mockModule("../../../src/client/ui/ShareDialog/Dialog", () => ({
    Dialog: ({ children }: { children: ReactNode }) => <div>{children}</div>,
}));
jest.unstable_mockModule("../../../src/client/ui/ShareDialog/FilledButton", () => ({
    FilledButton: ({ color = "primary", label, onClick, size = "medium", variant = "filled" }: FilledButtonProps) => (
        <button
            aria-label={label}
            data-color={color}
            data-size={size}
            data-variant={variant}
            type="button"
            onClick={onClick}
        >
            {label}
        </button>
    ),
}));
jest.unstable_mockModule("../../../src/client/ui/ParticipantManagementDialog.scss", () => ({}));

const { ParticipantManagementDialog } = await import("../../../src/client/ui/ParticipantManagementDialog");

describe("ParticipantManagementDialog", () => {
    let container: HTMLDivElement;
    let root: Root;

    beforeEach(() => {
        jest.clearAllMocks();
        getRoomParticipants.mockResolvedValueOnce(initialParticipants).mockResolvedValueOnce(refreshedParticipants);
        kickUser.mockResolvedValue(true);
        container = document.createElement("div");
        document.body.append(container);
        root = createRoot(container);
    });

    afterEach(async () => {
        await act(async () => {
            root.unmount();
        });
        container.remove();
    });

    test("更新で参加者一覧を再取得し、primary filled large の操作として表示すること", async () => {
        await renderDialog(root);

        expect(getRoomParticipants).toHaveBeenCalledWith("room-1");
        expect(container.textContent).toContain("田中（ID: 12） 接続中");

        const refreshButton = container.querySelector<HTMLButtonElement>('button[aria-label="更新"]');
        if (!refreshButton) {
            throw new Error("更新ボタンが表示されていません。");
        }
        expect(refreshButton.getAttribute("data-color")).toBe("primary");
        expect(refreshButton.getAttribute("data-variant")).toBe("filled");
        expect(refreshButton.getAttribute("data-size")).toBe("large");

        await act(async () => {
            refreshButton.dispatchEvent(new MouseEvent("click", { bubbles: true }));
            await Promise.resolve();
        });

        expect(getRoomParticipants).toHaveBeenCalledTimes(2);
        expect(container.textContent).toContain("佐藤（ID: 21） 再接続待ち");
    });
});

async function renderDialog(root: Root): Promise<void> {
    await act(async () => {
        root.render(<ParticipantManagementDialog roomId="room-1" closeDialog={() => undefined} />);
        await Promise.resolve();
    });
}
