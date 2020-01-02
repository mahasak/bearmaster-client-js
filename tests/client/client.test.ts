import Client from '../../src/client';
import { Strategy } from '../../src/strategy/Strategy'
import {
    IExperimentVariantDefinition,
    IExperimentStrategyInfo,
    IExperiment,
    IExperimentStrategy
} from '../../src/interfaces';
import { setup } from '../repository/setup';
import { MockStorage } from '../mock/MockStorage';
import Repository from '../../src/repository';
import { DefaultStrategy } from '../../src/strategy/DefaultStrategy';
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
    }, () => buildToggle('feature', true, [{ name: 'custom', parameters: {}, constraints: [] }, { name: 'custom-false', parameters: {}, constraints: [] }]))

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

test('should emit error when invalid feature runtime', () => {
    expect.assertions(3)
    const repo = new MockRepository({
        backupPath: 'foo',
        url: 'http://experiment-server-client-01.mahasak.com',
        appName,
        instanceId,
        refreshInterval: 0
    }, () => {
        return {
            name: 'feature-malformed-strategies',
            enabled: true,
            strategies: true,
        }
    })

    const strategies: IExperimentStrategy[] = [new DefaultStrategy()];
    const client = new Client(repo, strategies);
    client.on('error', (err) => {
        expect(err).toBeTruthy();
        expect(err.message).toContain('Malformed feature');
    })

    expect(client.isEnabled('feature-malformed-strategies')).toBeFalsy();
});



test('should emit error when mising feature runtime', () => {
    expect.assertions(3);

    const repo = new MockRepository({
        backupPath: 'foo',
        url: 'http://experiment-server-client-01.mahasak.com',
        appName,
        instanceId,
        refreshInterval: 0
    }, () => {
        return {
            name: 'feature-wrong-strategy',
            enabled: true,
            strategies: [new CustomFalseStrategy()],
        }
    })

    const strategies: IExperimentStrategy[] = [new DefaultStrategy()];
    const client = new Client(repo, strategies);
    client.on('error', log);
    client.on('warn', msg => {
        expect(msg).toBeTruthy();
        expect(msg).toContain('Missing strategy');
    });

    expect(client.isEnabled('feature-wrong-strategy')).toBeFalsy()
});

[
    [['y', 1], ['0', 1], ['1', 1]],
    [['3', 33], ['2', 33], ['0', 33]],
    [['aaa', 100], ['3', 100], ['1', 100]],
].forEach(([[id1, weight1], [id2, weight2], [id3, weight3]]) => {
    test(`should return variant when equal weight on ${weight1},${weight2},${weight3}`, () => {
        const repo = new MockRepository({
            backupPath: 'foo',
            url: 'http://experiment-server-client-01.mahasak.com',
            appName,
            instanceId,
            refreshInterval: 0
        }, () => {
            return buildToggle('feature', true, [], [
                {
                    name: 'variant1',
                    weight: parseInt(weight1.toString()),
                    params: [{
                        name: 'p1',
                        type: 'string',
                        value: 'val1',
                    }],
                },
                {
                    name: 'variant2',
                    weight: parseInt(weight2.toString()),
                    params: [{
                        name: 'p1',
                        type: 'string',
                        value: 'val2',
                    }],
                },
                {
                    name: 'variant3',
                    weight: parseInt(weight3.toString()),
                    params: [{
                        name: 'p1',
                        type: 'string',
                        value: 'val3',
                    }],
                },
            ]);
        });

        const strategies = [new DefaultStrategy()];
        const client = new Client(repo, strategies);
        client.on('error', log).on('warn', log);
        const result = client.isEnabled('feature');

        expect(result).toBeTruthy();

        [id1, id2, id3].forEach(id => {
            expect(client.getVariant('feature', { userId: id.toString() })).toMatchSnapshot()
        });
    });
});


test('should always return defaultVariant if missing variant', () => {

    const repo = new MockRepository({
        backupPath: 'foo',
        url: 'http://experiment-server-client-01.mahasak.com',
        appName,
        instanceId,
        refreshInterval: 0
    }, () => buildToggle('feature-but-no-variant', true, []));

    const strategies = [new DefaultStrategy()];
    const client = new Client(repo, strategies);

    client.on('error', log).on('warn', log);
    const result = client.getVariant('feature-but-no-variant', {});
    const defaultVariant = {
        enabled: false,
        name: 'disabled',
    };
    expect(result).toEqual(defaultVariant);

    const fallback = {
        enabled: false,
        name: 'customDisabled',
        payload: {
            type: 'string',
            value: '',
        },
    };
    const result2 = client.getVariant('feature-but-no-variant', {}, fallback);

    expect(result2).toEqual(fallback);

    const result3 = client.getVariant('missing-feature-x', {});
    expect(result3).toEqual(defaultVariant);
});
