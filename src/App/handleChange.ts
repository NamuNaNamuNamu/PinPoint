import type { Line } from "../Elements/Line/Line";
import { lines } from "../Elements/Line/lines";

export function handleChange(): void {
    lines.forEach((line: Line) => {
        line.onChange();
    })
}