declare namespace Electron {
    interface App {
        quitting: boolean
    }

    interface BrowserWindow{
        application: any
    }
}

declare module "*.vue" {

}