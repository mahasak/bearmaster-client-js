import { EventEmitter } from 'events';
import * as nock from 'nock';
import { MockStorage } from '../mock/MockStorage'
import Repository from '../../src/repository';

import { doesNotReject } from 'assert';
import { setup } from './setup'
const appName = 'foo';
const instanceId = 'bar';


describe('should request with custom headers', () => {
    const url = 'http://experiment-server-domain-5.mahasak.com';
    const randomKey = `random-${Math.random()}`;
    nock(url)
        .matchHeader('randomKey', value => value === randomKey)
        .persist()
        .get('/client/features')
        .reply(200, { features: [] }, { Etag: '12345-3' });

    const repo = new Repository({
        backupPath: 'foo',
        url,
        appName,
        instanceId,
        refreshInterval: 0,
        StorageImpl: MockStorage,
        headers: {
            randomKey,
        },
    });

    repo.setEtag('12345-1');

    test('should request with custom headers', async () => {
        return new Promise((resolve, reject) => {
            repo.once('data', () => {
                try {
                    expect(repo.getETag()).toBe('12345-3')
                    resolve()
                } catch (err) {
                    reject(err)
                }
            })
        })
    });

});

describe('request with customHeadersFunction should take precedence over customHeaders', () => {
    const url = 'http://experiment-server-domain-6.mahasak.com';
    const randomKey = `random-${Math.random()}`;
    const customHeaderKey = `customer-${Math.random()}`;
    nock(url)
        .matchHeader('customHeaderKey', value => value === customHeaderKey)
        .matchHeader('randomKey', value => value === undefined)
        .persist()
        .get('/client/features')
        .reply(200, { features: [] }, { Etag: '12345-3' });

    const repo = new Repository({
        backupPath: 'foo',
        url,
        appName,
        instanceId,
        refreshInterval: 0,
        StorageImpl: MockStorage,
        headers: {
            randomKey,
        },
        customHeadersFunction: () => Promise.resolve({ customHeaderKey }),
    });

    repo.setEtag('12345-1');

    test('should request with custom headers', async () => {
        return new Promise((resolve, reject) => {
            repo.once('data', () => {
                try {
                    expect(repo.getETag()).toBe('12345-3')
                    resolve()
                } catch (err) {
                    reject(err)
                }
            })
        })
    });
});