import {Plugin} from "./base/Plugin";
import {resolve} from "path";

export class Gpuz extends Plugin {

    constructor() {
        super(resolve(__dirname, '../../../dist/gpuz'), 'GPU-Z.exe')
    }
}