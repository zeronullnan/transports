import { ITransport, IContent } from './index';
import * as io from 'socket.io';

export default class WsTransport implements ITransport {
    public connected: boolean = false;
    private port: number;
    private server: io.Server;

    constructor(port: string = '3000') {
        this.port = parseInt(port, 10) || 3000;
    }

    public async connect() {
        if (this.connected) {
            return;
        }

        this.server = io(this.port, {
            serveClient: false,
            cookie: false,
        });

        this.connected = true;
    }

    public async disconnect() {
        if (this.connected) {
            await new Promise(resolve => this.server.close(resolve));
            this.connected = false;
        }
    }

    public write(type: string, content: IContent = {}) {
        if (!this.connected) {
            throw new Error('Transport is not connected to the servers');
        }

        if (!type.length) {
            throw new Error('Type should be specified');
        }

        this.server.emit(`transfer.${type}`, content);
    }
}