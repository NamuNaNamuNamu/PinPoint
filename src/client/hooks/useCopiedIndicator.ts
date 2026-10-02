import { useCallback, useRef, useState } from "react";

const TIMEOUT = 2000;

/**
 * コピー成功状態を一定時間だけ保持するための state と操作関数を提供する。
 *
 * @returns コピー状態、成功状態を設定する関数、および状態をリセットする関数。
 */
export const useCopyStatus = () => {
    const [copyStatus, setCopyStatus] = useState<"success" | null>(null);
    const timeoutRef = useRef<number>(0);

    const onCopy = () => {
        clearTimeout(timeoutRef.current);
        setCopyStatus("success");

        timeoutRef.current = window.setTimeout(() => {
            setCopyStatus(null);
        }, TIMEOUT);
    };

    const resetCopyStatus = useCallback(() => {
        setCopyStatus(null);
    }, []);

    return {
        copyStatus,
        resetCopyStatus,
        onCopy,
    };
};
