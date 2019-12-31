
import Metrics, { MetricsOptions } from '../../metric';
import * as nock from 'nock';
import { IExperimentStrategy } from '../../interfaces';
import { DefaultStrategy } from '../../strategy/DefaultStrategy';
import { resolve } from 'dns';

let counter = 1;
const getUrl = () => `http://test-data${counter++}-test.mahasak.com/`;

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

test('should be disabled by flag disableMetrics', () => {
    defaultMetricsOption.disableMetrics = true;
    const metrics = new Metrics(defaultMetricsOption);
    metrics.count('foo', true);

    expect(metrics.getBucketToggleLength()).toBe(0);
});

test('registerInstance, sendMetrics, startTimer and count should respect disabled', async () => {
    defaultMetricsOption.url = getUrl();
    defaultMetricsOption.disableMetrics = true;

    const metrics = new Metrics(defaultMetricsOption);
    const registerInstance = await metrics.registerInstance();
    const sendMetrics = await metrics.sendMetrics();

    expect(metrics.getIsStarted()).toBeFalsy();
    expect(registerInstance).toBeFalsy();
    expect(sendMetrics).toBeFalsy();
});

test('should not start fetch/register when metricsInterval is 0', () => {
    defaultMetricsOption.url = getUrl();
    defaultMetricsOption.metricsInterval = 0;
    defaultMetricsOption.disableMetrics= false;
    const metrics = new Metrics(defaultMetricsOption);

    expect(metrics.getTimer()).toBe(undefined);
});

describe('should sendMetrics and register when metricsInterval is a positive number', () => {
    const url = getUrl();
    const metricsEP = nockMetrics(url);
    const regEP = nockRegister(url);

    defaultMetricsOption.url = url;
    defaultMetricsOption.metricsInterval = 50;
    defaultMetricsOption.disableMetrics= false;

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

test('sendMetrics should not send empty buckets', () => {
    const url = getUrl();

    const metricsEP = nockMetrics(url);
    const regEP = nockRegister(url);

    defaultMetricsOption.url = url;
    defaultMetricsOption.metricsInterval = 50;
    defaultMetricsOption.disableMetrics= false;


    const metrics = new Metrics(defaultMetricsOption);

    metrics.sendMetrics().then(result => {
        expect(metrics.getIsDisbled()).toBeTruthy();
        expect(result).toBeFalsy();

        setTimeout(() => {
            expect(metricsEP.isDone()).toBeFalsy();
        }, 10);
    }).catch((err) => true);;
});


test('count should increment yes and no counters', () => {
    const url = getUrl();

    const metricsEP = nockMetrics(url);
    const regEP = nockRegister(url);

    defaultMetricsOption.url = url;
    defaultMetricsOption.metricsInterval = 50;
    defaultMetricsOption.disableMetrics= false;
    const metrics = new Metrics(defaultMetricsOption);

    const name = `name-${Math.round(Math.random() * 1000)}`;
    expect(metrics.getToggle(name)).toBeFalsy();
    
    metrics.count(name, true);
    const toggleCount = metrics.getToggle(name);
    
    expect(toggleCount).toBeTruthy();
    expect(toggleCount.yes).toBe(1);
    expect(toggleCount.no).toBe(0);

    metrics.count(name, true);
    metrics.count(name, true);
    metrics.count(name, false);
    metrics.count(name, false);
    metrics.count(name, false);
    metrics.count(name, false);
    
    expect(toggleCount.yes).toBe(3);
    expect(toggleCount.no).toBe(4);
});



test('count should increment yes and no counters with variants', () => {
    const url = getUrl();
    const metricsEP = nockMetrics(url);
    const regEP = nockRegister(url);

    defaultMetricsOption.url = url;
    defaultMetricsOption.metricsInterval = 50;
    defaultMetricsOption.disableMetrics= false;
    const metrics = new Metrics(defaultMetricsOption);

    const name = `name-${Math.round(Math.random() * 1000)}`;

    expect(metrics.getToggle(name)).toBeFalsy();

    metrics.count(name, true);

    const toggleCount = metrics.getToggle(name);
    expect(toggleCount).toBeTruthy();
    expect(toggleCount.yes).toBe(1);
    expect(toggleCount.no).toBe(0);

    metrics.countVariant(name, 'variant1');
    metrics.countVariant(name, 'variant1');
    metrics.count(name, false);
    metrics.count(name, false);
    metrics.countVariant(name, 'disabled');
    metrics.countVariant(name, 'disabled');
    metrics.countVariant(name, 'variant2');
    metrics.countVariant(name, 'variant2');
    metrics.countVariant(name, 'variant2');

    expect(toggleCount.yes).toBe(1);
    expect(toggleCount.no ).toBe(2);
    expect(toggleCount.variants?.disabled).toBe(2);
    expect(toggleCount.variants?.variant1).toBe(2);
    expect(toggleCount.variants?.variant2 ).toBe(3);
});

test('getClientData should return a object', () => {
    const url = getUrl();
    const metricsEP = nockMetrics(url);
    const regEP = nockRegister(url);

    defaultMetricsOption.url = url;
    defaultMetricsOption.metricsInterval = 50;
    defaultMetricsOption.disableMetrics= false;
    const metrics = new Metrics(defaultMetricsOption);

    const result = metrics.getClientData();
    expect(typeof result).toBe('object');
});

test('getMetricsData should return a bucket', () => {
    const url = getUrl();
    const metricsEP = nockMetrics(url);
    const regEP = nockRegister(url);

    defaultMetricsOption.url = url;
    defaultMetricsOption.metricsInterval = 50;
    defaultMetricsOption.disableMetrics= false;
    const metrics = new Metrics(defaultMetricsOption);

    const result = metrics.getMetricsData();
    expect(typeof result).toBe('object');
    expect(typeof result.bucket).toBe('object');
});
