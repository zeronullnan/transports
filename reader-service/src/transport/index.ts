export interface IContent {
    [propName: string]: any;
}

export interface ITransport {
    connected: boolean;
    connect(): Promise<void>;
    disconnect(): Promise<void>;
    write(type: string, content: IContent): void;
}