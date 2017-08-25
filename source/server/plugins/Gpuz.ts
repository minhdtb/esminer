import {BASE_PATH, Plugin} from "./base/Plugin";
import {resolve} from "path";

export class Gpuz extends Plugin {

    constructor() {
        super(resolve(__dirname, `${BASE_PATH}dist/gpuz`), 'GPU-Z.exe')
    }
}