import { EventEmitter } from 'events';
import * as nock from 'nock';

import Repository from '../../repository';
import { Storage } from '../../storage';
import { doesNotReject } from 'assert';

const appName = 'foo';
const instanceId = 'bar';

class MockStorage extends Storage {
    constructor() {
        super({
            backupPath: "/test",
            appName: appName
        });
        this.data = {};
        process.nextTick(() => this.emit('ready'));
    }

    safeAppName(appName: string = '') {
        return appName.replace(/\//g, '_');
    }

    persist(): void {
    }

    load(): void {
    }

    reset(data: any) {
        this.data = data;
    }

    get(name: string) {
        return this.data[name];
    }

    getAll() {
        return this.data;
    }
}

function setup(url: string, toggles: any, headers = {}) {
    return nock(url)
        .persist()
        .get('/client/features')
        .reply(200, { features: toggles }, headers);
}

test('test storage component', () => {
    const feature = {
        name: 'feature',
        enabled: true,
        strategies: [
            {
                name: 'default',
            },
        ],
    };

    const url = 'http://experiment-server-domain.mahasak.com';

    const setupResult = setup(url, [feature]);
    const repo = new Repository({
        backupPath: 'foo',
        url,
        appName,
        instanceId,
        refreshInterval: 0,
        StorageImpl: MockStorage,
    });

    repo.once('data', () => {
        const savedFeature = repo.getToggle(feature.name);
        expect(savedFeature.enabled === feature.enabled).toBeTruthy();
        expect(savedFeature.strategies[0].name === feature.strategies[0].name).toBeTruthy();

        const featureToggles = repo.getToggles();
        expect(featureToggles[0].name).toEqual('feature');

        const featureToggle = repo.getToggle('feature');
        expect(featureToggle).toBeTruthy();

    })   
});
