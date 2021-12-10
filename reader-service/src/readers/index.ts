import { ITransport } from '../transport';

export interface IReader {
    readonly type: string;
    connected: boolean;
    connect(): Promise<void>;
    disconnect(): Promise<void>;
    setTransport(transport: ITransport): this;
}