import {BASE_PATH, Plugin, ProcessType} from "./base/Plugin";
import {resolve} from "path";

export class Gpuz extends Plugin {

    constructor() {
        super(resolve(__dirname, `${BASE_PATH}dist/gpuz`), 'GPU-Z.exe', ProcessType.PROCESS_EXTERNAL)
    }
}