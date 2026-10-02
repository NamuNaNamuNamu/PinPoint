import { useCallback, useState } from "react";

/**
 * コールバック ref として渡せる setter を持つ ref 値の state を作成する。
 *
 * @returns 現在の ref 値と、それを更新するコールバックのタプル。
 */
export const useCallbackRefState = <T>() => {
    const [refValue, setRefValue] = useState<T | null>(null);
    const refCallback = useCallback((value: T | null) => setRefValue(value), []);
    return [refValue, refCallback] as const;
};
