import { FlexibleRolloutStrategy } from '../../src/strategy/FlexibleRolloutStrategy';

test('should have correct name', () => {
    const strategy = new FlexibleRolloutStrategy();
    expect(strategy.getName()).toEqual('flexibleRollout');
});

test('should NOT be enabled for userId=61 and rollout=9', () => {
    const strategy = new FlexibleRolloutStrategy();
    const params = { rollout: 9, stickiness: 'default', groupId: 'Demo' };
    const context = { userId: '61', application: 'web' };
    expect(strategy.isEnabled(params, context)).toBeFalsy();
});

test('should be enabled for userId=61 and rollout=10', () => {
    const strategy = new FlexibleRolloutStrategy();
    const params = { rollout: '10', stickiness: 'default', groupId: 'Demo' };
    const context = { userId: '61', application: 'web' };
    expect(strategy.isEnabled(params, context)).toBeTruthy();
});

test('should be disabled when stickiness=userId and userId not on context', () => {
    const strategy = new FlexibleRolloutStrategy();
    const params = { rollout: '100', stickiness: 'userId', groupId: 'Demo' };
    const context = {};
    expect(strategy.isEnabled(params, context)).toBeFalsy();
});

test('should fallback to random if stickiness=default and empty context', () => {
    const randomGenerator = jest.fn(() => 42);

    const strategy = new FlexibleRolloutStrategy(randomGenerator);
    const params = { rollout: '100', stickiness: 'default', groupId: 'Demo' };
    const context = {};

    expect(strategy.isEnabled(params, context)).toBeTruthy();
    expect(randomGenerator).toBeCalled();
});

test('should NOT be enabled for rollout=10% when userId is 123', () => {
    const strategy = new FlexibleRolloutStrategy();
    const params = { rollout: 10, stickiness: 'default', groupId: 'toggleName' };
    const context = { environment: 'dev', userId: '123' };
    expect(strategy.isEnabled(params, context)).toBeFalsy();
});
