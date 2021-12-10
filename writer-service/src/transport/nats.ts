import { ITransport } from './index';
import { IWriter } from '../writers';
import { connect as connectToNats, Payload, Client, Subscription, NatsError, Msg } from 'ts-nats';

export default class NatsTransport implements ITransport {
    public connected: boolean = false;
    private servers: string[];
    private client: Client;
    private subscription: Subscription;
    private writers: {
        [propName: string]: IWriter;
    };

    constructor(servers: string | string[] = 'nats://localhost:4222') {
        this.servers = Array.isArray(servers) ? servers : servers.split(/\s*,\s*/);
    }

    public async connect() {
        if (this.connected) {
            await this.subscribe();
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
        
        await this.subscribe();
    }

    public async disconnect() {
        if (this.connected) {
            if (this.subscription) {
                await this.subscription.drain();
            }

            await this.client.flush();
            await this.client.close();

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
        if (this.subscription) {
            return;
        }

        if (this.writers && Object.keys(this.writers).length) {
            this.subscription = await this.client.subscribe(
                'transfer.*',
                this.handleMessage.bind(this),
                { queue: 'transfer' }
            );
        }
    }

    private handleMessage(err: NatsError | null, msg: Msg) {
        if (err) {
            console.error(err);
            return;
        }

        const { data, reply, subject } = msg;
        const writerType = subject.split('.').pop() || '';
        const writer = this.writers[writerType];

        if (!writer) {
            return;
        }

        writer.write(data)
            .catch((ex: Error) => {
                console.error(err);
                return false;
            })
            .then((ok: boolean = true) => {
                if (reply && data.replyId) {
                    this.client.publish(reply, {
                        id: data.replyId,
                        ts: Date.now(),
                        ok
                    });
                }
            });
    }
}