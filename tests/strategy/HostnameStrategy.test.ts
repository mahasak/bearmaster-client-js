import { hostname } from 'os';
import { HostnameStrategy } from '../../src/strategy/HostnameStrategy';

test('strategy should have correct name', () => {
    const strategy = new HostnameStrategy();
    expect(strategy.getName()).toBe('hostname');
});

test('strategy should be disabled when no hostname defined', () => {
    const strategy = new HostnameStrategy();
    const context = { hostNames: '' };
    expect(strategy.isEnabled(context)).toBeFalsy();
});

test('strategy should be enabled when hostname is defined', () => {
    process.env.HOSTNAME = '';
    const strategy = new HostnameStrategy();
    const context = { hostNames: hostname() };
    expect(strategy.isEnabled(context)).toBeTruthy();
});

test('strategy should be enabled when hostname is defined in list', () => {
    process.env.HOSTNAME = '';
    const strategy = new HostnameStrategy();
    const context = { hostNames: `localhost, ${hostname()}` };
    expect(strategy.isEnabled(context)).toBeTruthy();
});

test('strategy should be enabled when hostname is defined via env', () => {
    process.env.HOSTNAME = 'some-random-name';
    const strategy = new HostnameStrategy();
    const context = { hostNames: 'localhost, some-random-name' };
    expect(strategy.isEnabled(context)).toBeTruthy();
});

test('strategy should handle wierd casing', () => {
    process.env.HOSTNAME = 'some-random-NAME';
    const strategy = new HostnameStrategy();
    const context = { hostNames: 'localhost, some-random-name' };
    expect(strategy.isEnabled(context)).toBeTruthy();
});
