/** @jest-environment jsdom */
import { jest } from "@jest/globals";
import type { MouseEvent, ReactNode } from "react";
import { act } from "react";
import { createRoot, type Root } from "react-dom/client";

import type { QuestionTemplate } from "../../../src/shared/question/QuestionTemplateTypes";

Object.assign(globalThis, { IS_REACT_ACT_ENVIRONMENT: true });

type ApplyQuestion = (typeof import("../../../src/client/socket/SocketController").socketController)["applyQuestion"];
type ControlCurrentQuestion =
    (typeof import("../../../src/client/socket/SocketController").socketController)["controlCurrentQuestion"];
type RevealQuestion = (typeof import("../../../src/client/socket/SocketController").socketController)["revealQuestion"];
type UseCurrentQuestion = () => QuestionTemplate | undefined;

type TextFieldProps = {
    className?: string;
    inputMode?: "numeric";
    label?: string;
    onChange?: (value: string) => void;
    type?: "text" | "search" | "number";
    value: string;
};

type FilledButtonProps = {
    children?: ReactNode;
    className?: string;
    color?: "primary" | "danger" | "warning" | "muted" | "success";
    disabled?: boolean;
    icon?: ReactNode;
    label?: string;
    onClick?: (event: MouseEvent<HTMLButtonElement>) => void;
    size?: "medium" | "large";
    variant?: "filled" | "outlined" | "icon";
};

const questionTemplates = [
    { id: 1, question: "一問目の問題文", choiceLeft: "", choiceRight: "", sliders: [] },
    { id: 2, question: "二問目の問題文", choiceLeft: "", choiceRight: "", sliders: [] },
] satisfies readonly QuestionTemplate[];
const getQuestionTemplate = jest.fn<(questionId: number) => QuestionTemplate | undefined>();
const useCurrentQuestion = jest.fn<UseCurrentQuestion>();
const applyQuestion = jest.fn<ApplyQuestion>();
const controlCurrentQuestion = jest.fn<ControlCurrentQuestion>();
const revealQuestion = jest.fn<RevealQuestion>();

jest.unstable_mockModule("../../../src/shared/question/QuestionTemplate", () => ({
    questionTemplates,
    getQuestionTemplate,
}));
jest.unstable_mockModule("../../../src/client/features/question/questionStore", () => ({ useCurrentQuestion }));
jest.unstable_mockModule("../../../src/client/socket/SocketController", () => ({
    socketController: { applyQuestion, controlCurrentQuestion, revealQuestion },
}));
jest.unstable_mockModule("../../../src/client/ui/ShareDialog/Dialog", () => ({
    Dialog: ({ children }: { children: ReactNode }) => <div>{children}</div>,
}));
jest.unstable_mockModule("../../../src/client/ui/ShareDialog/TextField", () => ({
    TextField: ({ className, inputMode, label, onChange, type, value }: TextFieldProps) => (
        <label>
            <span>{label}</span>
            <input
                aria-label={label}
                className={className}
                inputMode={inputMode}
                type={type}
                value={value}
                onChange={(event) => onChange?.(event.currentTarget.value)}
            />
        </label>
    ),
}));
jest.unstable_mockModule("../../../src/client/ui/ShareDialog/FilledButton", () => ({
    FilledButton: ({
        children,
        className,
        color = "primary",
        disabled,
        icon,
        label,
        onClick,
        size = "medium",
        variant = "filled",
    }: FilledButtonProps) => (
        <button
            aria-label={label}
            className={className}
            data-color={color}
            data-has-icon={icon === undefined ? "false" : "true"}
            data-size={size}
            data-variant={variant}
            disabled={disabled}
            type="button"
            onClick={onClick}
        >
            {children ?? label}
        </button>
    ),
}));
jest.unstable_mockModule("../../../src/client/ui/icons", () => ({ checkIcon: null }));
jest.unstable_mockModule("../../../src/client/ui/ProblemOperationDialog.scss", () => ({}));

const { ProblemOperationDialog } = await import("../../../src/client/ui/ProblemOperationDialog");

describe("ProblemOperationDialog", () => {
    let container: HTMLDivElement;
    let root: Root;

    beforeEach(() => {
        jest.clearAllMocks();
        getQuestionTemplate.mockImplementation((questionId) =>
            questionTemplates.find((question) => question.id === questionId),
        );
        useCurrentQuestion.mockReturnValue(questionTemplates[0]);
        applyQuestion.mockResolvedValue({ ok: true });
        controlCurrentQuestion.mockResolvedValue({ ok: true });
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

    test("問題 ID を変更すると固定高の問題文プレビューを更新すること", async () => {
        await renderDialog(root);

        const targetQuestionInput = container.querySelector('input[aria-label="遷移先の問題ID"]');
        const nextQuestionButton = container.querySelector('button[aria-label="次の問題"]');
        const preview = container.querySelector(".ProblemOperationDialog__previewContent");

        expect(targetQuestionInput).toHaveProperty("type", "number");
        expect(targetQuestionInput).toHaveProperty("inputMode", "numeric");
        expect(preview).not.toBeNull();
        expect(preview?.textContent).toContain("一問目の問題文");

        if (!nextQuestionButton) {
            throw new Error("次の問題ボタンが表示されていません。");
        }

        await act(async () => {
            nextQuestionButton.dispatchEvent(new MouseEvent("click", { bubbles: true }));
        });

        expect(preview?.textContent).toContain("二問目の問題文");
        expect(preview?.getAttribute("aria-live")).toBe("polite");
    });

    test("選択した問題を既存の問題適用 API へ送信すること", async () => {
        await renderDialog(root);

        const nextQuestionButton = container.querySelector('button[aria-label="次の問題"]');
        const applyButton = container.querySelector('button[aria-label="適用"]');

        if (!nextQuestionButton || !applyButton) {
            throw new Error("問題遷移の操作ボタンが表示されていません。");
        }

        await act(async () => {
            nextQuestionButton.dispatchEvent(new MouseEvent("click", { bubbles: true }));
        });

        await act(async () => {
            applyButton.dispatchEvent(new MouseEvent("click", { bubbles: true }));
            await Promise.resolve();
        });

        expect(applyQuestion).toHaveBeenCalledWith({
            roomId: "room-1",
            questionId: 2,
            deleteExternalElements: true,
            scrollToContent: true,
            answerBarReveal: false,
        });
    });

    test("解答の表示は適用と同じ primary filled large でアイコンを表示しないこと", async () => {
        await renderDialog(root);

        const applyButton = container.querySelector('button[aria-label="適用"]');
        const revealButton = container.querySelector('button[aria-label="表示"]');

        expect(applyButton?.getAttribute("data-color")).toBe("primary");
        expect(applyButton?.getAttribute("data-variant")).toBe("filled");
        expect(applyButton?.getAttribute("data-size")).toBe("large");
        expect(revealButton?.getAttribute("data-color")).toBe("primary");
        expect(revealButton?.getAttribute("data-variant")).toBe("filled");
        expect(revealButton?.getAttribute("data-size")).toBe("large");
        expect(revealButton?.getAttribute("data-has-icon")).toBe("false");
    });
});

async function renderDialog(root: Root): Promise<void> {
    await act(async () => {
        root.render(<ProblemOperationDialog roomId="room-1" closeDialog={() => undefined} />);
    });
}
