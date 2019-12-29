import Client from '../../client';
import { Strategy } from '../../strategy/Strategy'
import {
    IExperimentVariantDefinition,
    IExperimentStrategyInfo,
    IExperiment,
    IExperimentStrategy
} from '../../interfaces';
import { setup } from '../repository/setup';
import { MockStorage } from '../mock/MockStorage';
import Repository from '../../repository';
import { DefaultStrategy } from '../../strategy/DefaultStrategy';
import { MockRepository } from '../mock/MockRepository';

const appName = 'foo';
const instanceId = 'bar';

function buildToggle(name: string, active: boolean, strategies?: IExperimentStrategyInfo[], variants: IExperimentVariantDefinition[] = []): IExperiment {
    return {
        name,
        enabled: active,
        strategies: strategies || [{ name: 'default', parameters: {}, constraints: [] }],
        variants,
    };
}

class CustomStrategy extends Strategy {
    constructor() {
        super('custom');
    }

    isEnabled() {
        return true;
    }
}

class CustomFalseStrategy extends Strategy {
    constructor() {
        super('custom-false');
    }

    isEnabled() {
        return false;
    }
}

const log = (err: any) => {
    console.error(err);
};

test('should use provided repository', () => {
    const repo = new MockRepository({
        backupPath: 'foo',
        url: 'http://experiment-server-client-01.mahasak.com',
        appName,
        instanceId,
        refreshInterval: 0
    }, () => buildToggle('feature', true))
    const client = new Client(repo, [new DefaultStrategy()]);
    client.on('error', log).on('warn', log);
    const result = client.isEnabled('feature');

    expect(result).toBeTruthy();
});

test('should fallback when missing feature', () => {
    const repo = new MockRepository({
        backupPath: 'foo',
        url: 'http://experiment-server-client-01.mahasak.com',
        appName,
        instanceId,
        refreshInterval: 0
    }, () => null)
    const client = new Client(repo, []);
    client.on('error', log).on('warn', log);

    const result = client.isEnabled('feature-x', {}, () => false);
    expect(result).toBeFalsy();

    const result2 = client.isEnabled('feature-x', {}, () => true);
    expect(result2).toBeTruthy();
});

test('should consider toggle not active', () => {
    const repo = new MockRepository({
        backupPath: 'foo',
        url: 'http://experiment-server-client-01.mahasak.com',
        appName,
        instanceId,
        refreshInterval: 0
    }, () => buildToggle('feature', false))

    const client = new Client(repo, [new DefaultStrategy()]);
    client.on('error', log).on('warn', log);
    const result = client.isEnabled('feature');

    expect(result).toBeFalsy();
});

test('should use custom strategy', () => {
    const repo = new MockRepository({
        backupPath: 'foo',
        url: 'http://experiment-server-client-01.mahasak.com',
        appName,
        instanceId,
        refreshInterval: 0
    }, () => buildToggle('feature', true, [{ name: 'custom', parameters: {}, constraints: [] }]))
    

    const client = new Client(repo, [new DefaultStrategy(), new CustomStrategy()]);
    client.on('error', log).on('warn', log);
    const result = client.isEnabled('feature');

    expect(result).toBeTruthy();
});

test('should use a set of custom strategies', () => {
    const repo = new MockRepository({
        backupPath: 'foo',
        url: 'http://experiment-server-client-01.mahasak.com',
        appName,
        instanceId,
        refreshInterval: 0
    }, () => buildToggle('feature', true, [{ name: 'custom', parameters: {}, constraints: []  }, { name: 'custom-false' , parameters: {}, constraints: [] }]))

    const strategies = [new CustomFalseStrategy(), new CustomStrategy()];
    const client = new Client(repo, strategies);
    client.on('error', log).on('warn', log);
    const result = client.isEnabled('feature');

    expect(result).toBeTruthy();
});

test('should return false a set of custom-false strategies', () => {
    const repo = new MockRepository({
        backupPath: 'foo',
        url: 'http://experiment-server-client-01.mahasak.com',
        appName,
        instanceId,
        refreshInterval: 0
    }, () => buildToggle('feature', true, [
        { name: 'custom-false', parameters: {}, constraints: [] },
        { name: 'custom-false', parameters: {}, constraints: [] },
    ]))

    const strategies = [new CustomFalseStrategy(), new CustomStrategy()];
    const client = new Client(repo, strategies);
    client.on('error', log).on('warn', log);
    const result = client.isEnabled('feature');

    expect(result === false).toBeTruthy;
});

describe('should emit error when invalid feature runtime', () => {
    const repo = new MockRepository({
        backupPath: 'foo',
        url: 'http://experiment-server-client-01.mahasak.com',
        appName,
        instanceId,
        refreshInterval: 0
    }, () => { return {
        name: 'feature-malformed-strategies',
        enabled: true,
        strategies: true,
    }})

    const strategies: IExperimentStrategy[] = [new DefaultStrategy()];
    const client = new Client(repo, strategies);
    /*
    test('should emit error', async () => {
        return new Promise((resolve, reject) => {
            client.on('clientError', (err) => {
                try {
                    console.log(err);
                    expect(err).toBeTruthy();
                    expect(err.message).toContain('Malformed feature');
                    resolve()
                } catch (err) {
                    reject(err)
                }
            })
        })
    })
    */

    test('should get default error', async () => {
        expect(client.isEnabled('feature-malformed-strategies')).toBeFalsy();
    });
    
    
});

/*
test('should emit error when mising feature runtime', () => {
    t.plan(3);
    const repo = {
        getToggle() {
            return {
                name: 'feature-wrong-strategy',
                enabled: true,
                strategies: [{ name: 'non-existent' }],
            };
        },
    };

    const strategies = [];
    const client = new Client(repo, strategies);
    client.on('error', log);
    client.on('warn', msg => {
        t.truthy(msg);
        t.true(msg.startsWith('Missing strategy'));
    });

    t.true(client.isEnabled('feature-wrong-strategy') === false);
});

[
    [['y', 1], ['0', 1], ['1', 1]],
    [['3', 33], ['2', 33], ['0', 33]],
    [['aaa', 100], ['3', 100], ['1', 100]],
].forEach(([[id1, weight1], [id2, weight2], [id3, weight3]]) => {
    test(`should return variant when equal weight on ${weight1},${weight2},${weight3}`, () => {
        const repo = {
            getToggle() {
                return buildToggle('feature', true, null, [
                    {
                        name: 'variant1',
                        weight: weight1,
                        payload: {
                            type: 'string',
                            value: 'val1',
                        },
                    },
                    {
                        name: 'variant2',
                        weight: weight2,
                        payload: {
                            type: 'string',
                            value: 'val2',
                        },
                    },
                    {
                        name: 'variant3',
                        weight: weight3,
                        payload: {
                            type: 'string',
                            value: 'val3',
                        },
                    },
                ]);
            },
        };

        const strategies = [new Strategy('default', true)];
        const client = new Client(repo, strategies);
        client.on('error', log).on('warn', log);
        const result = client.isEnabled('feature');

        t.true(result === true);

        [id1, id2, id3].forEach(id => {
            t.snapshot(client.getVariant('feature', { userId: id }));
        });
    });
});

test('should always return defaultVariant if missing variant', () => {
    const repo = {
        getToggle() {
            return buildToggle('feature-but-no-variant', true, []);
        },
    };

    const client = new Client(repo);

    client.on('error', log).on('warn', log);
    const result = client.getVariant('feature-but-no-variant', {});
    const defaultVariant = {
        enabled: false,
        name: 'disabled',
    };
    t.deepEqual(result, defaultVariant);

    const fallback = {
        enabled: false,
        name: 'customDisabled',
        payload: {
            type: 'string',
            value: '',
        },
    };
    const result2 = client.getVariant('feature-but-no-variant', {}, fallback);

    t.deepEqual(result2, fallback);

    const result3 = client.getVariant('missing-feature-x', {});
    t.deepEqual(result3, defaultVariant);
});
*/