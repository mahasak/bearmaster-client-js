import { DefaultStrategy } from '../../strategy/DefaultStrategy';

test('default strategy should enabled by default', () => {
    const defaultStrategy = new DefaultStrategy()
    expect(defaultStrategy.isEnabled()).toBe(true);
});

test('default strategy should enabled by default', () => {
    const defaultStrategy = new DefaultStrategy()
    expect(defaultStrategy.name === "default");
});