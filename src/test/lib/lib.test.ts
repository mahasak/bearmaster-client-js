
import * as nock from 'nock';
import { tmpdir } from 'os';
import { join } from 'path';
import * as mkdirp from 'mkdirp';
import { EventEmitter } from 'events';
//import sinon from 'sinon';
import {
    BearMaster,
    IExperimentStrategy,
} from '../../BearMaster'
import { Strategy } from '../../strategy/Strategy';
import { IExperimentConstraint, IExperimentContext } from '../../interfaces'
import { MockStorage } from '../mock/MockStorage';
import { Storage } from '../../storage';

class EnvironmentStrategy extends Strategy {
    constructor() {
        super('EnvironmentStrategy');
    }

    isEnabled(parameters: any, context?: IExperimentContext) {
        return parameters.environments.indexOf(context?.environment) !== -1;
    }
}

let counter = 1;
const getUrl = () => `http://test2${counter++}.app/`;

function getRandomBackupPath() {
    const path = join(tmpdir(), `test-tmp-${Math.round(Math.random() * 100000)}`);
    mkdirp.sync(path);
    return path;
}

const defaultToggles = [
    {
        name: 'feature',
        enabled: true,
        strategies: [],
    },
    {
        name: 'f-context',
        enabled: true,
        strategies: [
            {
                name: 'EnvironmentStrategy',
                parameters: {
                    environments: 'prod',
                },
            },
        ],
    },
];

class FakeRepo extends EventEmitter {
    public data: any;
    constructor() {
        super();
        this.data = {
            name: 'fake-feature',
            enabled: false,
            strategies: [],
        };
    }
    stop() {
        return;
    }
    getToggle() {
        return this.data;
    }
    getToggles() {
        return this.data;
    }
    getUrl() {
        return '';
    }
    getStorage() {
        return new MockStorage();
    }

}

function mockNetwork(toggles = defaultToggles, url = getUrl()) {
    nock(url)
        .get('/client/features')
        .reply(200, { features: toggles });
    return url;
}

/*
test('should error when missing url', () => {
    expect(() => new BearMaster({})).toThrow();
    expect(() => new BearMaster({ url: false })).toThrow();
    expect(() => new BearMaster({ url: 'http://unleash.github.io', appName: false })).toThrow();
});
*/

test('calling destroy synchronously should avoid network activity', () => {
    const url = getUrl();
    // Don't call mockNetwork. If destroy didn't work, then we would have an
    // uncaught exception.
    const instance = new BearMaster({
        appName: 'foo',
        url,
        disableMetrics: true,
    });

    instance.destroy();
    expect(instance.isClientTerminated()).toBe(true);
});

describe('should handle old url', () => {
    const url = mockNetwork([]);

    const instance = new BearMaster({
        appName: 'foo',
        refreshInterval: 0,
        metricsInterval: 0,
        disableMetrics: true,
        url: `${url}features`,
    });

    test('should warn', async () => {
        return new Promise((resolve, reject) => {
            instance.on('warn', e => {
                expect(e).toBeTruthy();
                resolve()
            });
        })
    });

    instance.destroy();
});

test('should handle url without ending /', () => {
    const baseUrl = `${getUrl()}api`;

    mockNetwork([], baseUrl);

    const instance = new BearMaster({
        appName: 'foo',
        refreshInterval: 0,
        metricsInterval: 0,
        disableMetrics: true,
        url: baseUrl,
    });

    expect(`${baseUrl}/`).toBe(instance.getRepositoryUrl());

    instance.destroy();
});

test('should re-emit error from repository, storage and metrics', () => {
    const url = mockNetwork([]);

    const instance = new BearMaster({
        appName: 'foo',
        refreshInterval: 0,
        metricsInterval: 0,
        disableMetrics: true,
        url,
    });

    expect.assertions(3)

    instance.on('error', e => {
        expect(e).toBeTruthy();
    });

    instance.getRepository().emit('error', new Error());
    instance.getRepository().getStorage().emit('error', new Error());
    instance.getMetrics().emit('error', new Error());

    instance.destroy();
});


test('should re-emit events from repository and metrics', () => {
    const url = mockNetwork();
    const instance = new BearMaster({
        appName: 'foo',
        refreshInterval: 0,
        disableMetrics: true,
        url,
    });

    expect.assertions(5)
    instance.on('warn', e => expect(e).toBeTruthy());
    instance.on('sent', e => expect(e).toBeTruthy());
    instance.on('registered', e => expect(e).toBeTruthy());
    instance.on('count', e => expect(e).toBeTruthy());

    instance.getRepository().emit('warn', true);
    instance.getMetrics().emit('warn', true);
    instance.getMetrics().emit('sent', true);
    instance.getMetrics().emit('registered', true);
    instance.getMetrics().emit('count', true);

    instance.destroy();
});


describe('repository should surface error when invalid basePath', () => {
    const url = 'http://unleash-surface.app/';
    nock(url)
        .get('/client/features')
        .delay(100)
        .reply(200, { features: [] });
    const backupPath = join(tmpdir(), `test-tmp-${Math.round(Math.random() * 100000)}`);
    const instance = new BearMaster({
        appName: 'foo',
        disableMetrics: true,
        refreshInterval: 0,
        url,
        backupPath,
    });

    test('should warn', async () => {
        return new Promise((resolve, reject) => {
            instance.once('error', err => {
                expect(err).toBeTruthy;
                expect(err.code).toBe('ENOENT');

                instance.destroy();

                resolve()
            });
        })
    });
});

test('should allow request even before unleash is initialized', () => {
    const url = mockNetwork();
    const instance = new BearMaster({
        appName: 'foo',
        disableMetrics: true,
        url,
        backupPath: getRandomBackupPath(),
    }).on('error', err => {
        throw err;
    });
    expect(instance.isEnabled('unknown')).toBeFalsy()
    instance.destroy();
});

test('should consider known feature-toggle as active', () =>
    new Promise((resolve, reject) => {
        const url = mockNetwork();
        const instance = new BearMaster({
            appName: 'foo',
            disableMetrics: true,
            url,
            backupPath: getRandomBackupPath(),
        }).on('error', reject);

        instance.on('ready', () => {
            expect(instance.isEnabled('feature')).toBeTruthy()
            instance.destroy();
            resolve();
        });
    }));

test('should consider unknown feature-toggle as disabled', () =>
    new Promise((resolve, reject) => {
        const url = mockNetwork();
        const instance = new BearMaster({
            appName: 'foo',
            disableMetrics: true,
            url,
            backupPath: getRandomBackupPath(),
        }).on('error', reject);

        instance.on('ready', () => {
            expect(instance.isEnabled('unknown')).toBeFalsy()
            instance.destroy();
            resolve();
        });
    }));

test('should return fallback value until online', () =>
    new Promise((resolve, reject) => {
        const url = mockNetwork();
        const instance = new BearMaster({
            appName: 'foo',
            disableMetrics: true,
            url,
            backupPath: getRandomBackupPath(),
        }).on('error', reject);

        let warnCounter = 0;
        instance.on('warn', () => {
            warnCounter++;
        });

        expect(instance.isEnabled('feature')).toBeFalsy()
        expect(warnCounter).toBe(1)
        expect(instance.isEnabled('feature', {}, false)).toBeFalsy()
        expect(instance.isEnabled('feature', {}, true)).toBeTruthy()
        expect(warnCounter === 3);

        instance.on('ready', () => {
            expect(instance.isEnabled('feature')).toBeTruthy()
            expect(instance.isEnabled('feature', {}, false)).toBeTruthy();
            instance.destroy();
            resolve();
        });
    }));

test('should call fallback function for unknown feature-toggle', () =>
    new Promise((resolve, reject) => {
        const url = mockNetwork();
        const instance = new BearMaster({
            appName: 'foo',
            environment: 'test',
            disableMetrics: true,
            url,
            backupPath: getRandomBackupPath(),
        }).on('error', reject);

        instance.on('ready', () => {
            const fallbackFunc = jest.fn(() => false);
            const name = 'unknown';
            const result = instance.isEnabled(name, { userId: '123' }, fallbackFunc);
            expect(result).toBeFalsy()
            expect(fallbackFunc).toBeCalled()
            expect(
                fallbackFunc).toBeCalledWith(name, {
                    appName: 'foo',
                    environment: 'test',
                    userId: '123',
                })

            instance.destroy();
            resolve();
        });
    }));

test('should not throw when os.userInfo throws', () => {


    return new Promise((resolve, reject) => {
        require('os').userInfo = () => {
            throw new Error('Test exception');
        };
        const url = mockNetwork();
        const instance = new BearMaster({
            appName: 'foo',
            disableMetrics: true,
            url,
            backupPath: getRandomBackupPath(),
        }).on('error', reject);

        instance.on('ready', () => {
            resolve();
        });
    });
});

test('should return known feature-toggle definition', () =>
    new Promise((resolve, reject) => {
        const url = mockNetwork();
        const instance = new BearMaster({
            appName: 'foo',
            disableMetrics: true,
            url,
            backupPath: getRandomBackupPath(),
        }).on('error', reject);

        instance.on('ready', () => {
            const toggle = instance.getFeatureToggleDefinition('feature');
            expect(toggle).toBeTruthy();
            instance.destroy();
            resolve();
        });
    }));

test('should return feature-toggles', () =>
    new Promise((resolve, reject) => {
        const url = mockNetwork();
        const instance = new BearMaster({
            appName: 'foo',
            disableMetrics: true,
            url,
            backupPath: getRandomBackupPath(),
        }).on('error', reject);

        instance.on('ready', () => {
            const toggles = instance.getFeatureToggleDefinitions();
            expect(toggles).toStrictEqual(defaultToggles);
            instance.destroy();
            resolve();
        });
    }));

test('returns undefined for unknown feature-toggle definition', () =>
    new Promise((resolve, reject) => {
        const url = mockNetwork();
        const instance = new BearMaster({
            appName: 'foo',
            disableMetrics: true,
            url,
            backupPath: getRandomBackupPath(),
        }).on('error', reject);

        instance.on('ready', () => {
            const toggle = instance.getFeatureToggleDefinition('unknown');
            expect(toggle).toBeFalsy();
            instance.destroy();
            resolve();
        });
    }));

test('should use the injected repository', () =>
    new Promise((resolve, reject) => {
        const repo = new FakeRepo();
        const url = mockNetwork();
        const instance = new BearMaster({
            appName: 'foo',
            disableMetrics: true,
            url,
            backupPath: getRandomBackupPath(),
            repository: repo,
        }).on('error', reject);
        instance.on('ready', () => {
            expect(instance.isEnabled('fake-feature')).toBeFalsy();
            instance.destroy();
            resolve();
        });
        repo.emit('ready');
    }));

test('should add static context fields', () =>
    new Promise((resolve, reject) => {
        const url = mockNetwork();
        const instance = new BearMaster({
            appName: 'foo',
            disableMetrics: true,
            url,
            backupPath: getRandomBackupPath(),
            environment: 'prod',
            strategies: [new EnvironmentStrategy()],
        }).on('error', reject);

        instance.on('ready', () => {
            expect(instance.isEnabled('f-context')).toBeTruthy()
            instance.destroy();
            resolve();
        });
    }));

test('should local context should take precendence over static context fields', () =>
    new Promise((resolve, reject) => {
        const url = mockNetwork();
        const instance = new BearMaster({
            appName: 'foo',
            disableMetrics: true,
            url,
            backupPath: getRandomBackupPath(),
            environment: 'prod',
            strategies: [new EnvironmentStrategy()],
        }).on('error', reject);

        instance.on('ready', () => {
            expect(instance.isEnabled('f-context', { environment: 'dev' })).toBeFalsy()
            instance.destroy();
            resolve();
        });
    }));
