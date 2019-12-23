import { DefaultStrategy } from '../../strategy/DefaultStrategy';

test('default strategy should enabled by default', () => {
    const strategy = new DefaultStrategy();
    expect(strategy.isEnabled()).toBe(true);
});

test('default strategy name should be default', () => {
    const strategy = new DefaultStrategy();
    expect(strategy.getName()).toBe("default");
});