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

test('should emit error when invalid feature runtime', () => {
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
    client.on('error', (err) => {
        expect(err).toBeTruthy();
        expect(err.message).toContain('Malformed feature');
    })
    
    expect(client.isEnabled('feature-malformed-strategies')).toBeFalsy();
    expect
});
