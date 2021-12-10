import { IWriter, IContent } from './index';
import { promises as fs, constants as fsConstants } from 'fs';
import { join, resolve } from 'path';

export default class FilesWriter implements IWriter {
    public readonly type: string = 'file';
    public connected: boolean = false;
    private dir: string;

    constructor(dir: string) {
        if (!dir) {
            throw new Error('Directory to save files must be set');
        }

        this.dir = resolve(dir);
    }

    public async connect() {
        if (this.connected) {
            return;
        }

        const stat = await fs.stat(this.dir);
    
        if (!stat.isDirectory()) {
            throw new Error(`"${this.dir}" is not directory`);
        }

        await fs.access(this.dir, fsConstants.W_OK);
        this.connected = true;
    }

    public async disconnect() {
        if (this.connected) {
            this.connected = false;
        }
    }

    public async write(content: IContent) {
        if (!content.name) {
            throw new Error('Name field must be exist in the content');
        }

        if (typeof content.content !== 'string') {
            throw new Error('Content field is missing or has wrong type');
        }

        const data = Buffer.from(content.content, 'base64');
        const filePath = join(this.dir, content.name);
        await fs.writeFile(filePath, data);
    }
}