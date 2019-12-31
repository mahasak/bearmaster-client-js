
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
