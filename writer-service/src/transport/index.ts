import { IWriter } from '../writers';

export interface ITransport {
    connected: boolean;
    connect(): Promise<void>;
    disconnect(): Promise<void>;
    setWriters(writers: IWriter[]): this;
}