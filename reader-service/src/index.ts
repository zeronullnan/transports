import { config } from 'dotenv';
import { join } from 'path';
import { IReader } from './readers';
import FilesReader from './readers/files';
import { ITransport } from './transport';
import NatsTransport from './transport/nats';
import WsTransport from './transport/ws';

interface IServiceConfig {
    [propName: string]: string;
}

interface IServiceOptions {
    listenStopSignals?: boolean;
    config?: IServiceConfig
}

export class Service {
    private started: boolean = false;
    private options: IServiceOptions;
    private config: IServiceConfig;
    private stopSignalCatched: boolean = false;
    private readers: IReader[];
    private transport: ITransport;
    
    constructor(options: IServiceOptions = {} as IServiceOptions) {
        this.options = options;

        if (!this.options.config) {
            const env = config({ path: join(__dirname, '.env') });

            if (env.error) {
                throw env.error;
            }
            
            this.config = process.env as IServiceConfig;
        }
        else {
            this.config = this.options.config;
        }

        const { USE_TRANSPORT, FILES_READER_DIRS, NATS_SERVERS, WS_PORT } = this.config;

        switch (USE_TRANSPORT) {
            case 'nats':
                this.transport = new NatsTransport(NATS_SERVERS);
                break;
            case 'ws':
                this.transport = new WsTransport(WS_PORT);
                break;
            case '':
                throw new Error('Transport should be specified');
            default:
                throw new Error(`Unknown transport '${USE_TRANSPORT}'`);
        }

        this.readers = [
            new FilesReader(FILES_READER_DIRS),
        ];

        this.readers.forEach(reader => {
            reader.setTransport(this.transport);
        });
    }

    public async start() {
        if (this.started) {
            throw new Error('Service already started');
        }
    
        console.info('Starting service...');
    
        if (this.options.listenStopSignals) {
            this.listenStopSignals();
        }
        
        await this.transport.connect();
        await Promise.all(this.readers.map(reader => reader.connect()));

        this.started = true;
        console.info(`Reader service started. Transport: ${this.config.USE_TRANSPORT}`);
    }

    public async stop() {
        if (this.started) {
            try {
                await Promise.all(this.readers.map(reader => reader.disconnect()));
                await this.transport.disconnect();
                this.started = false;
            } catch (err) {
                console.error(err);
            }
        }
    }

    public listenStopSignals() {
        const signals: NodeJS.Signals[] = ['SIGINT', 'SIGTERM'];

        signals.forEach(sig => {
            process.on(sig, async () => {
                if (this.stopSignalCatched) {
                    console.info(`Received ${sig}. Stopping service force...`);
                } else {
                    this.stopSignalCatched = true;
                    console.info(`Received ${sig}. Stopping service...`);
                    await this.stop();
                }
        
                console.info('Server stopped.');
                process.exit();
            });
        });
    }
}

if (require.main === module) {
    const service = new Service({ listenStopSignals: true });
    service.start()
        .catch((err: Error) => {
            console.error(err);
            process.exit(1);
        });
}
