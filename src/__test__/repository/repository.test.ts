import { EventEmitter } from 'events';
import * as nock from 'nock';

import Repository from '../../repository';
import { Storage } from '../../storage';
import { MockStorage } from './MockStorage';
import { doesNotReject } from 'assert';
import { setup } from './setup'

const appName = 'foo';
const instanceId = 'bar';


function testEventOnce(eventEmitter: EventEmitter, eventName: string, callback: () => void) {
    return new Promise((resolve, reject) => {
        eventEmitter.once(eventName, async () => {
            try {
                callback()
                resolve()
            } catch (err) {
                reject(err)
            }
        })
    })
}

describe('test storage component', () => {
    const feature = {
        name: 'feature',
        enabled: true,
        strategies: [
            {
                name: 'default',
            },
        ],
    };

    const url = 'http://experiment-server-domain-1.mahasak.com';

    const setupResult = setup(url, [feature]);
    const repo = new Repository({
        backupPath: 'foo',
        url,
        appName,
        instanceId,
        refreshInterval: 0,
        StorageImpl: MockStorage,
    });
    test('should read from endpoint', () => {
        // Noted that this can be either await or return
        return testEventOnce(repo, 'data', () => {
            // Do things here
            const savedFeature = repo.getToggle(feature.name);
            expect(savedFeature.enabled === feature.enabled).toBeTruthy();
            expect(savedFeature.strategies[0].name === feature.strategies[0].name).toBeTruthy();

            const featureToggles = repo.getToggles();
            expect(featureToggles[0].name).toEqual('feature');

            const featureToggle = repo.getToggle('feature');
            expect(featureToggle).toBeTruthy();
            repo.emit('Tested');
        })
    })
});


describe('should poll for changes', () => {
    const url = 'http://experiment-server-domain-2.mahasak.com';
    setup(url, []);
    const repo = new Repository({
        backupPath: 'foo-bar',
        url,
        appName,
        instanceId,
        refreshInterval: 10,
        StorageImpl: MockStorage,
    });

    test('should poll for changes', () => {
        return new Promise((resolve, reject) => {
            let assertCount = 5;
            repo.on('data', () => {
                assertCount--;
                if (assertCount === 0) {
                    repo.stop();
                    expect(assertCount === 0).toBeTruthy();
                    resolve();
                }
            });
            repo.on('error', reject);
        });
    })

});



/*



*/