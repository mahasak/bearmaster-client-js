
import { GradualRolloutSessionStrategy } from '../../strategy/GradualRolloutSessionStrategy';
import { normalizedValue } from '../../utils';

test('gradual-rollout-user-id strategy should have correct name', () => {
    const strategy = new GradualRolloutSessionStrategy();
    expect(strategy.getName()).toBe('gradualRolloutSessionId');
});

test('should be enabled when percentage is 100', () => {
    const strategy = new GradualRolloutSessionStrategy();
    const params = { percentage: '100', groupId: 'gr1' };
    const context = { sessionId: '123' };
    expect(strategy.isEnabled(params, context)).toBeTruthy();
});

test('should be disabled when percentage is 0', () => {
    const strategy = new GradualRolloutSessionStrategy();
    const params = { percentage: '0', groupId: 'gr1' };
    const context = { sessionId: '123' };
    expect(strategy.isEnabled(params, context)).toBeFalsy();
});

test('should be enabled when percentage is exactly same', () => {
    const strategy = new GradualRolloutSessionStrategy();
    const sessionId = '123123';
    const groupId = 'group1';

    const percentage = normalizedValue(sessionId, groupId);
    const params = { percentage: `${percentage}`, groupId };
    const context = { sessionId };
    expect(strategy.isEnabled(params, context)).toBeTruthy();
});

test('should be disabled when percentage is just below required value', () => {
    const strategy = new GradualRolloutSessionStrategy();
    const sessionId = '123123';
    const groupId = 'group1';

    const percentage = normalizedValue(sessionId, groupId) - 1;
    const params = { percentage: `${percentage}`, groupId };
    const context = { sessionId };
    expect(strategy.isEnabled(params, context)).toBeFalsy();
});

test('should only at most miss by one percent', () => {
    const strategy = new GradualRolloutSessionStrategy();

    const percentage = 25;
    const groupId = 'groupId';

    const rounds = 200000;
    let enabledCount = 0;

    for (let i = 0; i < rounds; i++) {
        let params = { percentage, groupId };
        let context = { sessionId: i.toString() };
        if (strategy.isEnabled(params, context)) {
            enabledCount++;
        }
    }
    const actualPercentage = Math.round((enabledCount / rounds) * 100);
    const highMark = percentage + 1;
    const lowMark = percentage - 1;

    expect(lowMark <= actualPercentage).toBeTruthy();
    expect(highMark >= actualPercentage).toBeTruthy();
});
