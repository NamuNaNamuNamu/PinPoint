/** @jest-environment jsdom */
import { jest } from "@jest/globals";
import type { MouseEvent, ReactNode } from "react";
import { act } from "react";
import { createRoot, type Root } from "react-dom/client";

Object.assign(globalThis, { IS_REACT_ACT_ENVIRONMENT: true });

type ControlCurrentQuestion =
    (typeof import("../../../src/client/socket/SocketController").socketController)["controlCurrentQuestion"];
type SetCursorRevealed =
    (typeof import("../../../src/client/socket/SocketController").socketController)["setCursorRevealed"];
type SetScoreListEnabled =
    (typeof import("../../../src/client/socket/SocketController").socketController)["setScoreListEnabled"];
type RoomSettings = { cursorRevealed: boolean; answerBarReveal: boolean };
type UseRoomSettings = () => RoomSettings;
type UseScoreListEnabled = () => boolean;

type FilledButtonProps = {
    color?: "primary" | "danger" | "warning" | "muted" | "success";
    label?: string;
    onClick?: (event: MouseEvent<HTMLButtonElement>) => void;
    size?: "medium" | "large";
    variant?: "filled" | "outlined" | "icon";
};

const useRoomSettings = jest.fn<UseRoomSettings>();
const useScoreListEnabled = jest.fn<UseScoreListEnabled>();
const controlCurrentQuestion = jest.fn<ControlCurrentQuestion>();
const setCursorRevealed = jest.fn<SetCursorRevealed>();
const setScoreListEnabled = jest.fn<SetScoreListEnabled>();

jest.unstable_mockModule("../../../src/client/features/room/roomSettingsStore", () => ({ useRoomSettings }));
jest.unstable_mockModule("../../../src/client/features/score/scoreListStore", () => ({ useScoreListEnabled }));
jest.unstable_mockModule("../../../src/client/socket/SocketController", () => ({
    socketController: { controlCurrentQuestion, setCursorRevealed, setScoreListEnabled },
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
jest.unstable_mockModule("../../../src/client/ui/RoomSettingsDialog.scss", () => ({}));

const { RoomSettingsDialog } = await import("../../../src/client/ui/RoomSettingsDialog");

describe("RoomSettingsDialog", () => {
    let container: HTMLDivElement;
    let root: Root;

    beforeEach(() => {
        jest.clearAllMocks();
        useRoomSettings.mockReturnValue({ cursorRevealed: true, answerBarReveal: false });
        useScoreListEnabled.mockReturnValue(true);
        controlCurrentQuestion.mockResolvedValue({ ok: true });
        setCursorRevealed.mockResolvedValue({ ok: true });
        setScoreListEnabled.mockResolvedValue({ ok: true });
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

    test("各設定の状態と切替先を表示し、既存 API を呼ぶこと", async () => {
        await renderDialog(root);

        const cursorButton = getButton("非表示にする");
        const answerBarButton = getButton("表示にする");
        const scoreListButton = getButton("無効にする");

        expect(container.textContent).toContain("現在: 表示中");
        expect(container.textContent).toContain("現在: 非表示");
        expect(container.textContent).toContain("現在: 有効");

        await act(async () => {
            cursorButton.dispatchEvent(new MouseEvent("click", { bubbles: true }));
            answerBarButton.dispatchEvent(new MouseEvent("click", { bubbles: true }));
            scoreListButton.dispatchEvent(new MouseEvent("click", { bubbles: true }));
            await Promise.resolve();
        });

        expect(setCursorRevealed).toHaveBeenCalledWith("room-1", false);
        expect(controlCurrentQuestion).toHaveBeenCalledWith({
            roomId: "room-1",
            deleteExternalElements: false,
            scrollToContent: false,
            answerBarReveal: true,
        });
        expect(setScoreListEnabled).toHaveBeenCalledWith("room-1", false);
    });

    test("各操作を primary filled large ボタンとして描画すること", async () => {
        await renderDialog(root);

        for (const label of ["非表示にする", "表示にする", "無効にする"]) {
            const button = getButton(label);
            expect(button.getAttribute("data-color")).toBe("primary");
            expect(button.getAttribute("data-variant")).toBe("filled");
            expect(button.getAttribute("data-size")).toBe("large");
        }
    });

    function getButton(label: string): HTMLButtonElement {
        const button = container.querySelector<HTMLButtonElement>(`button[aria-label="${label}"]`);
        if (!button) {
            throw new Error(`${label} ボタンが表示されていません。`);
        }
        return button;
    }
});

async function renderDialog(root: Root): Promise<void> {
    await act(async () => {
        root.render(<RoomSettingsDialog roomId="room-1" closeDialog={() => undefined} />);
    });
}
