import { EventEmitter } from 'events';
import * as nock from 'nock';
import { MockStorage } from '../mock/MockStorage'
import Repository from '../../repository';

import { doesNotReject } from 'assert';
import { setup } from './setup'
const appName = 'foo';
const instanceId = 'bar';


describe('should handle 404 request error and emit error event', () => {
    const url = 'http://experiment-server-domain-7.mahasak.com';
    nock(url)
        .persist()
        .get('/client/features')
        .reply(404, 'asd');

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
                    expect(err.message).toContain('Response was not statusCode 2')
                    resolve()
                } catch (err) {
                    reject(err)
                }
            })
        })
    });
});

describe('should handle 304 as silent ok', () => {


    const url = 'http://experiment-server-domain-8.mahasak.com';
    nock(url)
        .persist()
        .get('/client/features')
        .reply(304, '');

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
            repo.on('error', reject);
            repo.on('data', reject);
            process.nextTick(resolve);
        })
    });
});