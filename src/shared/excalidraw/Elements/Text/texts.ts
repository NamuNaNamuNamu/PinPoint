
import { Text } from "./Text";
import { textSkeletonFactory } from "./TextSkeletonFactory";

export const texts: Text[] = [
    new Text({
        skeleton: textSkeletonFactory.createWith({
            id: "text1",
            x: 100,
            y: 250,
            text: "TESTTEST"
        }),
    })
]