import { IReader } from './index';
import { ITransport } from '../transport';
import { promises as fs } from 'fs';
import { basename, resolve } from 'path';
import { FSWatcher, watch } from 'chokidar';

const defaultWatcherOptions = {
    persistent: true,
    ignored: /(^|[\/\\])\../, // ignore dotfiles
    ignoreInitial: false,
    depth: 1,
    awaitWriteFinish: true,
    ignorePermissionErrors: true,
};

export default class FilesReader implements IReader {
    public readonly type: string = 'file';
    public connected: boolean = false;
    private dirPaths: string[];
    private watcher: FSWatcher;
    private transport: ITransport;

    constructor(dirs: string | string[] = '') {
        const dirPaths = Array.isArray(dirs) ? dirs : dirs.split(/\s*,\s*/);
        this.dirPaths = dirPaths.map((dir: string) => resolve(dir));
    }

    public setTransport(transport: ITransport) {
        this.transport = transport;
        return this;
    }

    public async connect() {
        if (this.connected) {
            await this.watch();
            return;
        }

        if (!this.dirPaths.length) {
            throw new Error('There are no directories to read');
        }
    
        for (const dirPath of this.dirPaths) {
            const stat = await fs.stat(dirPath);
    
            if (!stat.isDirectory()) {
                throw new Error(`"${dirPath}" is not directory`);
            }
        }
        
        this.connected = true;
        await this.watch();
    }

    public async disconnect() {
        if (this.connected) {
            if (this.watcher) {
                await this.watcher.close();
            }

            this.connected = false;
        }
    }

    private async watch() {
        if (this.watcher) {
            return;
        }

        if (this.transport) {
            this.watcher = watch(this.dirPaths, defaultWatcherOptions);
            this.watcher.on('add', this.onWatcherAdd.bind(this));
        }
    }

    private async onWatcherAdd(path: string) {
        const content = await fs.readFile(path, 'base64');
        this.transport.write(this.type, { name: basename(path), content });
    }
}