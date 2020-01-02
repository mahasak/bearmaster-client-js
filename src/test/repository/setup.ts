import * as nock from 'nock';

export function setup(url: string, toggles: any, headers = {}) {
    return nock(url)
        .persist()
        .get('/client/features')
        .reply(200, { features: toggles }, headers);
}