import { GradualRolloutUserStrategy } from '../../strategy/GradualRolloutUserStrategy';
import { normalizedValue } from '../../utils';

test('gradual-rollout-user-id strategy should have correct name', () => {
    const strategy = new GradualRolloutUserStrategy();
    expect(strategy.getName()).toBe('gradualRolloutUserId');
});

test('should be enabled when percentage is 100', () => {
    const strategy = new GradualRolloutUserStrategy();
    const params = { percentage: '100', groupId: 'gr1' };
    const context = { userId: '123' };
    expect(strategy.isEnabled(params, context)).toBeTruthy();
});

test('should be disabled when percentage is 0', () => {
    const strategy = new GradualRolloutUserStrategy();
    const params = { percentage: '0', groupId: 'gr1' };
    const context = { userId: '123' };
    expect(strategy.isEnabled(params, context)).toBeFalsy();
});

test('should be enabled when percentage is exactly same', () => {
    const strategy = new GradualRolloutUserStrategy();
    const userId = '123123';
    const groupId = 'group1';

    const percentage = normalizedValue(userId, groupId);
    const params = { percentage: `${percentage}`, groupId };
    const context = { userId };
    expect(strategy.isEnabled(params, context)).toBeTruthy();
});

test('should be disabled when percentage is just below required value', () => {
    const strategy = new GradualRolloutUserStrategy();
    const userId = '123123';
    const groupId = 'group1';

    const percentage = normalizedValue(userId, groupId) - 1;
    const params = { percentage: `${percentage}`, groupId };
    const context = { userId };
    expect(strategy.isEnabled(params, context)).toBeFalsy();
});

test('should only at most miss by one percent', () => {
    const strategy = new GradualRolloutUserStrategy();

    const percentage = 10;
    const groupId = 'groupId';

    const rounds = 200000;
    let enabledCount = 0;

    for (let i = 0; i < rounds; i++) {
        let params = { percentage, groupId };
        let context = { userId: i.toString() };
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
