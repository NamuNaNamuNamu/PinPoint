/** @jest-environment jsdom */
import { afterEach, beforeEach, describe, expect, test } from "@jest/globals";

import { waitForInitialUrlControlReadiness } from "../../../../src/client/features/url/waitForInitialUrlControlReadiness";

let readyState: DocumentReadyState;
let prerendering: boolean;
let visibilityState: DocumentVisibilityState;
let restoreDocumentProperties: (() => void)[];

describe("waitForInitialUrlControlReadiness", () => {
    beforeEach(() => {
        readyState = "complete";
        prerendering = false;
        visibilityState = "visible";
        restoreDocumentProperties = [
            overrideDocumentProperty("readyState", () => readyState),
            overrideDocumentProperty("prerendering", () => prerendering),
            overrideDocumentProperty("visibilityState", () => visibilityState),
        ];
    });

    afterEach(() => {
        restoreDocumentProperties.reverse().forEach((restore) => restore());
    });

    test("可視・非 prerender・load 完了なら即座に解決すること", async () => {
        await expect(waitForInitialUrlControlReadiness()).resolves.toBeUndefined();
    });

    test("load 完了まで待つこと", async () => {
        readyState = "loading";
        const readiness = waitForInitialUrlControlReadiness();

        expect(await isResolved(readiness)).toBe(false);

        readyState = "complete";
        window.dispatchEvent(new Event("load"));

        await expect(readiness).resolves.toBeUndefined();
    });

    test("prerender 解除まで待つこと", async () => {
        prerendering = true;
        const readiness = waitForInitialUrlControlReadiness();

        expect(await isResolved(readiness)).toBe(false);

        prerendering = false;
        document.dispatchEvent(new Event("prerenderingchange"));

        await expect(readiness).resolves.toBeUndefined();
    });

    test("可視化されるまで待つこと", async () => {
        visibilityState = "hidden";
        const readiness = waitForInitialUrlControlReadiness();

        expect(await isResolved(readiness)).toBe(false);

        visibilityState = "visible";
        document.dispatchEvent(new Event("visibilitychange"));

        await expect(readiness).resolves.toBeUndefined();
    });

    test("全条件がそろうまで解決しないこと", async () => {
        readyState = "loading";
        prerendering = true;
        visibilityState = "hidden";
        const readiness = waitForInitialUrlControlReadiness();

        readyState = "complete";
        window.dispatchEvent(new Event("load"));
        expect(await isResolved(readiness)).toBe(false);

        prerendering = false;
        document.dispatchEvent(new Event("prerenderingchange"));
        expect(await isResolved(readiness)).toBe(false);

        visibilityState = "visible";
        document.dispatchEvent(new Event("visibilitychange"));

        await expect(readiness).resolves.toBeUndefined();
    });
});

async function isResolved(promise: Promise<void>): Promise<boolean> {
    let resolved = false;
    void promise.then(() => {
        resolved = true;
    });
    await Promise.resolve();
    return resolved;
}

function overrideDocumentProperty(property: string, get: () => string | boolean): () => void {
    const descriptor = Object.getOwnPropertyDescriptor(document, property);
    Object.defineProperty(document, property, { configurable: true, get });

    return () => {
        if (descriptor) {
            Object.defineProperty(document, property, descriptor);
            return;
        }

        Reflect.deleteProperty(document, property);
    };
}
