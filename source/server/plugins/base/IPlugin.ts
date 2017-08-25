export interface IPlugin {

    start(params: any, mode: number): void;

    stop(): void;
}