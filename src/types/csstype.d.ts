import "csstype";

/**
 * CSS カスタムプロパティを `csstype` の Properties 型へ追加する。
 */
declare module "csstype" {
    interface Properties {
        "--max-width"?: number | string;
        "--swatch-color"?: string;
        "--gap"?: number | string;
        "--padding"?: number | string;
    }
}
