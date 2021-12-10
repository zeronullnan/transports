import { ITransport } from './index';
import { IWriter, IContent } from '../writers';
import * as io from 'socket.io-client';

export default class WsTransport implements ITransport {
    public connected: boolean = false;
    private serverUrl: string;
    private client: SocketIOClient.Socket;
    private subscriptions: {
        [propName: string]: SocketIOClient.Emitter;
    };
    private writers: {
        [propName: string]: IWriter;
    };

    constructor(serverUrl: string = 'http://localhost:3000') {
        this.serverUrl = serverUrl;
    }

    public async connect() {
        if (this.connected) {
            await this.subscribe();
            return;
        }

        if (!this.serverUrl.length) {
            throw new Error('There is no server url to connect');
        }

        this.client = io(this.serverUrl);

        this.connected = true;
        
        await this.subscribe();
    }

    public async disconnect() {
        if (this.connected) {
            if (this.subscriptions) {
                this.client.removeAllListeners();
                delete this.subscriptions;
            }

            this.client.close();
            this.connected = false;
        }
    }

    public setWriters(writers: IWriter[]) {
        this.writers = writers.reduce((obj, writer) => {
            obj[writer.type] = writer;
            return obj;
        }, {});

        return this;
    }

    private async subscribe() {
        if (this.subscriptions) {
            return;
        }

        if (this.writers && Object.keys(this.writers).length) {
            this.subscriptions = {};

            Object.keys(this.writers).forEach(writerType => {
                const writer = this.writers[writerType];
                const handler = this.handleMessage.bind(this, writer);
                this.subscriptions[writerType] = this.client.on(`transfer.${writerType}`, handler);

            });
        }
    }

    private handleMessage(writer: IWriter, data: IContent) {
        writer.write(data)
            .catch((err: Error) => {
                console.error(err);
                return false;
            })
            .then((ok: boolean = true) => {
                if (data.reply && data.replyId) {
                    this.client.emit(data.reply, {
                        id: data.replyId,
                        ts: Date.now(),
                        ok
                    });
                }
            });
    }
}