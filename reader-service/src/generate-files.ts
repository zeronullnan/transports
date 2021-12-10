import { randomBytes } from 'crypto';
import { promises as fs } from 'fs';
import { join, resolve, basename } from 'path';

function getRandomInt(max: number) {
    return Math.floor(Math.random() * Math.floor(max));
}

if (process.argv.length < 3) {
    console.info(`Usage: ts-node ${basename(__filename)} <out_directory_path> [<max_files>] [<max_size_in_bytes>]`);
    process.exit();
}

(async () => {
    const dir = resolve(process.argv[2] || './');
    const maxFiles = parseInt(process.argv[3], 10) || 10;
    const maxSize = parseInt(process.argv[4], 10) || (1024 * 512);

    console.debug(`Write files to: ${dir}, count: ${maxFiles}, max file size in bytes: ${maxSize}`);

    for (let i = 0; i < maxFiles; i++) {
        const bytes = randomBytes(getRandomInt(maxSize));
        await fs.writeFile(join(dir, `${Date.now()}-${getRandomInt(1000)}.log`), bytes);
    }
    
    console.debug('Done.');
})();