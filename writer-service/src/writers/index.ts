export interface IContent {
    [propName: string]: any;
}

export interface IWriter {
    readonly type: string;
    connected: boolean;
    connect(): Promise<void>;
    disconnect(): Promise<void>;
    write(content: IContent): Promise<void>;
}