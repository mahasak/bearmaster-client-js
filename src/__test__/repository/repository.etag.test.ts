import { EventEmitter } from 'events';
import * as nock from 'nock';
import { MockStorage } from './MockStorage'
import Repository from '../../repository';

import { doesNotReject } from 'assert';
import { setup } from './setup'
const appName = 'foo';
const instanceId = 'bar';

describe('should store etag', () => {
    const url = 'http://experiment-server-domain-3.mahasak.com';
    setup(url, [], { Etag: '12345' });
    const repo = new Repository({
        backupPath: 'foo=bar',
        url,
        appName,
        instanceId,
        refreshInterval: 10,
        StorageImpl: MockStorage,
    });

    test('should store etag', async () => {
        return new Promise((resolve, reject) => {
            repo.once('data', () => {
                try {
                    expect(repo.getETag()).toBe('12345')
                    resolve()
                } catch (err) {
                    reject(err)
                }
            })
        })
    });

});

describe('should request with etag', () => {
    const url = 'http://experiment-server-domain-4.mahasak.com';
    nock(url)
        .matchHeader('If-None-Match', value => value === '12345-1')
        .persist()
        .get('/client/features')
        .reply(200, { features: [] }, { Etag: '12345-2' });

    const repo = new Repository({
        backupPath: 'foo',
        url,
        appName,
        instanceId,
        refreshInterval: 0,
        StorageImpl: MockStorage,
    });

    repo.setEtag('12345-1');

    test('should request with etag', async () => {
        return new Promise((resolve, reject) => {
            repo.once('data', () => {
                try {
                    expect(repo.getETag()).toBe('12345-2')
                    resolve()
                } catch (err) {
                    reject(err)
                }
            })
        })
    });
});