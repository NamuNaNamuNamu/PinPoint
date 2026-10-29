type DocumentWithOptionalPrerendering = Document & {
    readonly prerendering?: boolean;
};

/**
 * 初期 URL に含まれる管理操作を読み取り、実行してよい状態になるまで待機する。
 *
 * Safari で履歴候補の URL が事前に読み込まれる可能性があるため、可視、非 prerender、
 * load 完了の全条件を満たすまで URL 制御を開始しない。この条件はブラウザ挙動の調査結果に
 * 応じて変わり得るため、`useRoomConnection` から分離している。
 *
 * なお、Web ページはアドレスバーの Enter 操作を直接検知できない。この関数は Enter を
 * 判定するのではなく、非表示・prerender 中の実行を避ける。
 *
 * @returns 初期 URL 制御を開始できる document 状態になった時点で解決する Promise。
 */
export function waitForInitialUrlControlReadiness(): Promise<void> {
    if (isInitialUrlControlReady()) {
        return Promise.resolve();
    }

    return new Promise((resolve) => {
        const onStateChange = (): void => {
            if (!isInitialUrlControlReady()) {
                return;
            }

            cleanup();
            resolve();
        };

        const cleanup = (): void => {
            window.removeEventListener("load", onStateChange);
            document.removeEventListener("prerenderingchange", onStateChange);
            document.removeEventListener("visibilitychange", onStateChange);
        };

        window.addEventListener("load", onStateChange);
        document.addEventListener("prerenderingchange", onStateChange);
        document.addEventListener("visibilitychange", onStateChange);
        onStateChange();
    });
}

function isInitialUrlControlReady(): boolean {
    const documentWithPrerendering: DocumentWithOptionalPrerendering = document;

    return (
        document.readyState === "complete" &&
        documentWithPrerendering.prerendering !== true &&
        document.visibilityState === "visible"
    );
}
