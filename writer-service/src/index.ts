import { config } from 'dotenv';
import { join } from 'path';
import { IWriter } from './writers';
import FilesWriter from './writers/files';
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
    private writers: IWriter[];
    private transport: ITransport;
    
    constructor(options: IServiceOptions = {} as IServiceOptions) {
        this.options = options;

        if (!this.options.config) {
            const env = config({ path: join(__dirname, '.env') });

            if (env.error) {
                throw env.error;
            }
            
            this.config = env.parsed || {};
        }
        else {
            this.config = this.options.config;
        }

        const { USE_TRANSPORT, FILES_WRITER_DIR, NATS_SERVERS, WS_SERVER } = this.config;

        switch (USE_TRANSPORT) {
            case 'nats':
                this.transport = new NatsTransport(NATS_SERVERS);
                break;
            case 'ws':
                this.transport = new WsTransport(WS_SERVER);
                break;
            case '':
                throw new Error('Transport should be specified');
            default:
                throw new Error(`Unknown transport '${USE_TRANSPORT}'`);
        }

        this.writers = [
            new FilesWriter(FILES_WRITER_DIR),
        ];

        this.transport.setWriters(this.writers);
    }

    public async start() {
        if (this.started) {
            throw new Error('Service already started');
        }
    
        console.info('Starting service...');
    
        if (this.options.listenStopSignals) {
            this.listenStopSignals();
        }
        
        await Promise.all(this.writers.map(writer => writer.connect()));
        await this.transport.connect();

        this.started = true;
        console.info(`Writer service started. Transport: ${this.config.USE_TRANSPORT}`);
    }

    public async stop() {
        if (this.started) {
            try {
                await this.transport.disconnect();
                await Promise.all(this.writers.map(writer => writer.disconnect()));
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
