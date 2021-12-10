import 'should';
import NatsTransport from './nats';

describe('Check NatsTransport', () => {
    it('should throw write error while not connected', () => {
        const nt = new NatsTransport();
        let err;

        try {
            nt.write('subj');
        }
        catch (e) {
            err = e;
        }

        err.should.be.instanceof(Error);
    });

    it('should throw write error while type param is not set', () => {
        const nt = new NatsTransport();
        let err;

        try {
            nt.write('');
        }
        catch (e) {
            err = e;
        }

        err.should.be.instanceof(Error);
    });
});