import { UserWithIdStrategy } from "../../strategy/UserWithIdStrategy";

test('default strategy should have correct name', () => {
    const strategy = new UserWithIdStrategy();
    expect(strategy.getName()).toEqual('userWithId');
});

test('user-with-id-strategy should be enabled for userId', () => {
    const strategy = new UserWithIdStrategy();
    const params = { userIds: '123' };
    const context = { userId: '123' };
    expect(strategy.isEnabled(params, context)).toBeTruthy();
});

test('user-with-id-strategy should be enabled for userId in list (spaced commas)', () => {
    const strategy = new UserWithIdStrategy();
    const params = { userIds: '123, 122, 12312312' };
    const context = { userId: '12312312' };
    expect(strategy.isEnabled(params, context)).toBeTruthy();
});

test('user-with-id-strategy should not be enabled for userId NOT in list', () => {
    const strategy = new UserWithIdStrategy();
    const params = { userIds: '123, 122, 122' };
    const context = { userId: '12' };
    expect(strategy.isEnabled(params, context)).toBeFalsy();
});

test('user-with-id-strategy should be enabled for userId in list', () => {
    const strategy = new UserWithIdStrategy();
    const params = { userIds: '123,122,12312312' };
    const context = { userId: '122' };
    expect(strategy.isEnabled(params, context)).toBeTruthy();
});
