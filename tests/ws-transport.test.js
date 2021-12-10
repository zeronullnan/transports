require('dotenv').config();
require('should');

const fs = require('fs-extra');
const { join, resolve } = require('path');

const { generateFile, delay } = require('./utils');
const ReaderService = require('../reader-service/dist').Service;
const WriterService = require('../writer-service/dist').Service;

process.env.USE_TRANSPORT = 'ws';
process.env.FILES_READER_DIRS = resolve(process.env.FILES_READER_DIRS);
process.env.FILES_WRITER_DIR = resolve(process.env.FILES_WRITER_DIR);

const { FILES_READER_DIRS, FILES_WRITER_DIR } = process.env;

describe('Reader -> Writer | Transport: ws', () => {
    const reader = new ReaderService({ config: process.env });
    const writer = new WriterService({ config: process.env });

    beforeEach(async () => {
        await fs.emptyDir(FILES_READER_DIRS);
        await fs.emptyDir(FILES_WRITER_DIR);
    })

    it('read file should be equal to written file', async function () {
        this.timeout(5000);

        const file = generateFile();

        await fs.writeFile(join(FILES_READER_DIRS, file.name), file.data);
        await writer.start();
        await reader.start();

        await delay(1000);

        const checkData = await fs.readFile(join(FILES_WRITER_DIR, file.name));
        Buffer.compare(file.data, checkData).should.be.equal(0);
    });

    afterEach(async () => {
        await reader.stop();
        await writer.stop();
    });
});