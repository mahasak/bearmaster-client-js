import { GradualRolloutRandomStrategy } from '../../strategy/GradualRolloutRandomStrategy';

test('should have correct name', () => {
    const strategy = new GradualRolloutRandomStrategy();
    expect(strategy.getName()).toBe('gradualRolloutRandom');
});

test('should only at most miss by one percent', () => {
    const strategy = new GradualRolloutRandomStrategy();

    const percentage = 25;
    const groupId = 'groupId';

    const rounds = 200000;
    let enabledCount = 0;

    for (let i = 0; i < rounds; i++) {
        let params = { percentage, groupId };
        let context =  { sessionId: i.toString() };
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

test('should be disabled when percentage is lower than random', () => {
    const strategy = new GradualRolloutRandomStrategy(() => 50);
    let params = { percentage: '20', groupId: 'test' };
    expect(strategy.isEnabled(params)).toBeFalsy();
});

test('should be disabled when percentage=0', () => {
    const strategy = new GradualRolloutRandomStrategy(() => 1);
    let params = { percentage: '0', groupId: 'test' };
    expect(strategy.isEnabled(params)).toBeFalsy();
});

test('should be disabled when percentage=0 and random is not zero', () => {
    const strategy = new GradualRolloutRandomStrategy(() => 50);
    let params = { percentage: '0', groupId: 'test' };
    expect(strategy.isEnabled(params)).toBeFalsy();
});

test('should be enabled when percentage is greater than random', () => {
    const strategy = new GradualRolloutRandomStrategy(() => 10);
    let params = { percentage: '20', groupId: 'test' };
    expect(strategy.isEnabled(params)).toBeTruthy();
});

test('should be enabled when percentage=100', () => {
    const strategy = new GradualRolloutRandomStrategy(() => 90);
    let params = { percentage: '100', groupId: 'test' };
    expect(strategy.isEnabled(params)).toBeTruthy();
});

test('should be enabled when percentage and random are the same', () => {
    const strategy = new GradualRolloutRandomStrategy(() => 55);
    let params = { percentage: '55', groupId: 'test' };
    expect(strategy.isEnabled(params)).toBeTruthy();
});