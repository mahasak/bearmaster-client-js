import Metrics, { MetricsOptions } from '../../metric';
import * as nock from 'nock';
import { IExperimentStrategy } from '../../interfaces';
import { DefaultStrategy } from '../../strategy/DefaultStrategy';
import { resolve } from 'dns';

let counter = 1;
const getUrl = () => `http://test-sender-${counter++}-test.mahasak.com/`;

const metricsUrl = '/client/metrics';
const nockMetrics = (url: string, code: number = 200) =>
    nock(url)
        .post(metricsUrl)
        .reply(code, '');

const registerUrl = '/client/register';
const nockRegister = (url: string, code: number = 200) =>
    nock(url)
        .post(registerUrl)
        .reply(code, '');
const appName: string = "foo";
const instanceId: string = "bar";
const defaultStrategies: string[] = ['default'];

let defaultMetricsOption: MetricsOptions = {
    appName: appName,
    instanceId: instanceId,
    strategies: defaultStrategies,
    metricsInterval: 0,
    url: ""
}


describe('should sendMetrics', () => {
    const url = getUrl();
    const metricsEP = nock(url)
        .post(metricsUrl, payload => {
            expect(payload.bucket).toBeTruthy();
            expect(payload.bucket.start).toBeTruthy();
            expect(payload.bucket.stop).toBeTruthy();
            expect(payload.bucket.toggles).toStrictEqual({
                'toggle-x': { yes: 1, no: 1 },
                'toggle-y': { yes: 1, no: 0 },
            });
            return true;
        })
        .reply(200, '');
    const regEP = nockRegister(url);

    defaultMetricsOption.url = url;
    defaultMetricsOption.metricsInterval = 50;

    const metrics = new Metrics(defaultMetricsOption);

    metrics.count('toggle-x', true);
    metrics.count('toggle-x', false);
    metrics.count('toggle-y', true);

    test('should register successfully', async () => {
        return new Promise((resolve, reject) => {
            metrics.on('registered', () => {
                expect(regEP.isDone()).toBeTruthy();
                resolve();
            })

            metrics.on('warn', () => {
                reject()
            })
        })
    });

    test('should sent successfully', async () => {
        return new Promise((resolve, reject) => {
            metrics.on('sent', () => {
                expect(metricsEP.isDone()).toBeTruthy();
                metrics.stop();
                resolve()
            });
            metrics.on('warn', () => {
                reject()
            })
        })
    });
});

describe('should send custom headers', () => {
    const url = getUrl();
    const randomKey = `value-${Math.random()}`;
    const metricsEP = nockMetrics(url).matchHeader('randomKey', randomKey);
    const regEP = nockRegister(url).matchHeader('randomKey', randomKey);

    defaultMetricsOption.url = url;
    defaultMetricsOption.metricsInterval = 50;
    defaultMetricsOption.headers = {
        randomKey,
    }

    const metrics = new Metrics(defaultMetricsOption);

    metrics.count('toggle-x', true);
    metrics.count('toggle-x', false);
    metrics.count('toggle-y', true);

    test('should sent successfully', async () => {
        return new Promise((resolve, reject) => {
            metrics.on('sent', () => {
                expect(regEP.isDone()).toBeTruthy();
                expect(metricsEP.isDone()).toBeTruthy();
                metrics.stop();
                resolve()
            });
            metrics.on('warn', () => {
                reject()
            })
        })
    });
});



describe('request with customHeadersFunction should take precedence over customHeaders', () => {
    const url = getUrl();
    const customHeadersKey = `value-${Math.random()}`;
    const randomKey = `value-${Math.random()}`;
    const metricsEP = nockMetrics(url)
        .matchHeader('randomKey', value => value === undefined)
        .matchHeader('customHeadersKey', value => value === customHeadersKey);

    const regEP = nockRegister(url)
        .matchHeader('randomKey', value => value === undefined)
        .matchHeader('customHeadersKey', value => value === customHeadersKey);

    defaultMetricsOption.url = url;
    defaultMetricsOption.metricsInterval = 50;
    defaultMetricsOption.headers = {
        randomKey,
    }
    defaultMetricsOption.customHeadersFunction = () => Promise.resolve({ customHeadersKey })
    const metrics = new Metrics(defaultMetricsOption);

    metrics.count('toggle-x', true);
    metrics.count('toggle-x', false);
    metrics.count('toggle-y', true);

    test('should sent successfully', async () => {
        return new Promise((resolve, reject) => {
            metrics.on('sent', () => {
                expect(regEP.isDone()).toBeTruthy();
                expect(metricsEP.isDone()).toBeTruthy();
                metrics.stop();
                resolve()
            });
            metrics.on('warn', () => {
                reject()
            })
        })
    });
});
