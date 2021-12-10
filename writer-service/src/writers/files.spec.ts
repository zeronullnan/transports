import 'should';
import FilesWriter from './files';

describe('Check FilesWriter', () => {
    it('should has correct type', () => {
        const fw = new FilesWriter(__dirname);
        fw.type.should.equals('file');
    });

    it('should be connected', async () => {
        const fw = new FilesWriter(__dirname);

        fw.connected.should.equals(false);
        await fw.connect();
        fw.connected.should.equals(true);
    });

    it('should throw write error while get wrong content', async () => {
        const fw = new FilesWriter(__dirname);
        let err;

        try {
            await fw.write({});
        }
        catch (e) {
            err = e;
        }

        err.should.be.instanceof(Error);
    });
});