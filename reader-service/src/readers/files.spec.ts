import 'should';
import FilesReader from './files';
import { ITransport } from '../transport';

const fakeTransport = {
    write(type: string, content: any) {

    },
} as ITransport;

describe('Check FilesReader', () => {
    it('should has correct type', () => {
        const fr = new FilesReader(__dirname);
        fr.type.should.equals('file');
    });

    it('should be connected', async () => {
        const fr = new FilesReader(__dirname);

        fr.setTransport(fakeTransport);
        fr.connected.should.equals(false);

        await fr.connect();
        fr.connected.should.equals(true);
    });
});