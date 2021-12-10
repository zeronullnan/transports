import { ITransport, IContent } from './index';
import { connect as connectToNats, Payload, Client } from 'ts-nats';

export default class NatsTransport implements ITransport {
    public connected: boolean = false;
    private servers: string[];
    private client: Client;

    constructor(servers: string | string[] = 'nats://localhost:4222') {
        this.servers = Array.isArray(servers) ? servers : servers.split(/\s*,\s*/);
    }

    public async connect() {
        if (this.connected) {
            return;
        }

        if (!this.servers.length) {
            throw new Error('There are no servers to connect');
        }

        this.client = await connectToNats({
            servers: this.servers,
            payload: Payload.JSON,
        });

        this.connected = true;
    }

    public async disconnect() {
        if (this.connected) {
            await this.client.flush();
            await this.client.close();
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

        this.client.publish(`transfer.${type}`, content);
    }
}