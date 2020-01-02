import { EventEmitter } from 'events';
import * as nock from 'nock';
import { MockStorage } from '../mock/MockStorage';
import Repository from '../../src/repository';

import { doesNotReject } from 'assert';
import { setup } from './setup'
const appName = 'foo';
const instanceId = 'bar';

describe('should handle invalid JSON response', () => {
    const url = 'http://experiment-server-domain-9.mahasak.com';
    nock(url)
        .persist()
        .get('/client/features')
        .reply(200, '{"Invalid payload');

    const repo = new Repository({
        backupPath: 'foo',
        url,
        appName,
        instanceId,
        refreshInterval: 0,
        StorageImpl: MockStorage,
    });

    test('should request with custom headers', async () => {
        return new Promise((resolve, reject) => {
            repo.on('error', (err) => {
                try {
                    expect(err).toBeTruthy()
                    expect(err.message).toContain('Unexpected end of JSON input')
                    resolve()
                } catch (err) {
                    reject(err)
                }
            })
            repo.on('data', reject);
        })
    });
});


describe('should emit errors on invalid features', () => {

    const url = 'http://experiment-server-domain-10.mahasak.com';
    setup(url, [
        {
            name: 'feature',
            enabled: null,
            strategies: false,
        },
    ]);
    const repo = new Repository({
        backupPath: 'foo',
        url,
        appName,
        instanceId,
        refreshInterval: 0,
        StorageImpl: MockStorage,
    });

    test('should request with custom headers', async () => {
        return new Promise((resolve, reject) => {
            repo.once('error', (err) => {
                try {
                    expect(err).toBeTruthy()
                    resolve()
                } catch (err) {
                    reject(err)
                }
            })
            repo.on('data', reject);
        })
    });
});