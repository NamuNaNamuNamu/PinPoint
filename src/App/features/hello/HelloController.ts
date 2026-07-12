class HelloController {
    public hello = (helloMessage: String) => {
        console.log(helloMessage);
    };
}

export const helloController = new HelloController();