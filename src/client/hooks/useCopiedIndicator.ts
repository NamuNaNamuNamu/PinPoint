import { useCallback, useRef, useState } from "react";

const TIMEOUT = 2000;

/**
 * 一時的な成功状態を一定時間だけ保持するための state と操作関数を提供する。
 *
 * @returns 成功状態、成功状態を設定する関数、および状態をリセットする関数。
 */
export const useSuccessStatus = () => {
    const [successStatus, setSuccessStatus] = useState<"success" | null>(null);
    const timeoutRef = useRef<number>(0);

    const onSuccess = () => {
        clearTimeout(timeoutRef.current);
        setSuccessStatus("success");

        timeoutRef.current = window.setTimeout(() => {
            setSuccessStatus(null);
        }, TIMEOUT);
    };

    const resetSuccessStatus = useCallback(() => {
        setSuccessStatus(null);
    }, []);

    return {
        successStatus,
        resetSuccessStatus,
        onSuccess,
    };
};
