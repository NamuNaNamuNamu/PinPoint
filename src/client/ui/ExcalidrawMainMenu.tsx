import { MainMenu } from "@excalidraw/excalidraw"

function ExcalidrawMainMenu() {
    return (
        <MainMenu>
            <MainMenu.Item onSelect={() => alert("部屋一覧")}>
            部屋一覧
            </MainMenu.Item>

            <MainMenu.Item onSelect={() => alert("設定")}>
            設定
            </MainMenu.Item>

            <MainMenu.Separator />
            <MainMenu.DefaultItems.Export />
        </MainMenu>
    )
}

export default ExcalidrawMainMenu;