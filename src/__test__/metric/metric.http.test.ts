
import Metrics, { MetricsOptions } from '../../metric';
import * as nock from 'nock';
import { IExperimentStrategy } from '../../interfaces';
import { DefaultStrategy } from '../../strategy/DefaultStrategy';
import { resolve } from 'dns';

let counter = 1;
const getUrl = () => `http://test-senderlong--${counter++}-test.mahasak.com/`;

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

describe('registerInstance should warn when non 200 statusCode', () => {
    const url = getUrl();
    const regEP = nockRegister(url, 500);
    const metricsEP = nockMetrics(url, 500);

    defaultMetricsOption.url = url;
    defaultMetricsOption.metricsInterval = 50;
    const metrics = new Metrics(defaultMetricsOption);
    metrics.registerInstance().then( a => expect(a).toBeTruthy());

    test('should failed', async () => {
        return new Promise((resolve, reject) => {
            metrics.on('error', e => {
                expect(e).toBeTruthy();
                resolve()
            });
        })
    });

    test('should warn', async () => {
        return new Promise((resolve, reject) => {
            metrics.on('warn', e => {
                expect(regEP.isDone()).toBeTruthy();
                expect(e).toBeTruthy();
                resolve();
            });
        })
    });
});


describe('sendMetrics should stop/disable metrics if endpoint returns 404', () => {
    const url = getUrl();
    const regEP = nockRegister(url, 404);
    const metricsEP = nockMetrics(url, 404);
    defaultMetricsOption.url = url;
    defaultMetricsOption.metricsInterval = 50;
    const metrics = new Metrics(defaultMetricsOption);

    test('should warn', async () => {
        return new Promise((resolve, reject) => {
            metrics.on('warn', e => {
                metrics.stop();
                expect(regEP.isDone()).toBeTruthy();
                expect(metrics.getIsDisbled()).toBeTruthy();
                resolve()
            });
        })
    });

    metrics.count('x-y-z', true);
    metrics.sendMetrics();
    expect(metrics.getIsDisbled()).toBeFalsy();
});

describe('sendMetrics should emit warn on non 200 statusCode', () => {
    const url = getUrl();
    const regEP = nockRegister(url, 200);
    const metricsEP = nockMetrics(url, 500);
    defaultMetricsOption.url = url;
    defaultMetricsOption.metricsInterval = 50;
    const metrics = new Metrics(defaultMetricsOption);

    test('should warn', async () => {
        return new Promise((resolve, reject) => {
            metrics.on('warn', e => {
                expect(metricsEP.isDone()).toBeTruthy();
                metrics.stop();
                resolve()
            });
        })
    });

    metrics.count('x-y-z', true);

    metrics.sendMetrics();
});