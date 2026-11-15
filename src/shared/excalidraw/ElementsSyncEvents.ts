import type { ExcalidrawElement } from "@excalidraw/excalidraw/element/types";

/** ルーム単位の管理外 Excalidraw 要素同期メッセージ。 */
export type ElementsSyncMessage = {
    /** サーバーが外部要素を破棄するたびに更新する世代。 */
    epoch: number;
    /** この世代で統合する要素。通常同期では差分、再接続時は snapshot。 */
    elements: readonly ExcalidrawElement[];
};
