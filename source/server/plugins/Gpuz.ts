import {BASE_PATH, Plugin, ProcessType} from "./base/Plugin";
import {resolve} from "path";
import Application from "../classes/Application";

export class Gpuz extends Plugin {

    constructor(app: Application) {
        super(app, resolve(__dirname, `${BASE_PATH}dist/gpuz`), 'GPU-Z.exe', ProcessType.PROCESS_EXTERNAL)
    }
}