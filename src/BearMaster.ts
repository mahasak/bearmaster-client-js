import Client from './client';
import Repository, { RepositoryInterface } from './repository';
import { 
    IExperimentContext,
    IExperimentVariant,
    IExperimentStrategy,
    IExperiment
} from './interfaces';
import { defaultStrategies } from './strategy';
export { IExperimentStrategy };
import { tmpdir } from 'os';
import { EventEmitter } from 'events';
import { userInfo, hostname } from 'os';
import { getDefaultVariant } from './variant';
import { FallbackFunction, createFallbackFunction } from './fallbackFunctions';
import Metrics from './metric';

const BACKUP_PATH: string = tmpdir();

export interface CustomHeaders {
    [key: string]: string;
}

export type CustomHeadersFunction = () => Promise<CustomHeaders>;

export interface BearMasterConfig {
    appName: string;
    environment?: string;
    instanceId?: string;
    url: string;
    refreshInterval?: number;
    metricsInterval?: number;
    disableMetrics?: boolean;
    backupPath?: string;
    strategies?: IExperimentStrategy[];
    customHeaders?: CustomHeaders;
    customHeadersFunction?: CustomHeadersFunction;
    timeout?: number;
    repository?: RepositoryInterface;
}

export interface StaticContext {
    appName: string;
    environment: string;
}

export class BearMaster extends EventEmitter {
    private repository: RepositoryInterface;
    private client: Client | undefined;
    private metrics: Metrics;
    private staticContext: StaticContext;

    constructor({
        appName,
        environment = 'default',
        instanceId,
        url,
        refreshInterval = 15 * 1000,
        metricsInterval = 60 * 1000,
        disableMetrics = false,
        backupPath = BACKUP_PATH,
        strategies = [],
        repository,
        customHeaders,
        customHeadersFunction,
        timeout,
    }: BearMasterConfig) {
        super();

        if (!url) {
            throw new Error('Unleash server URL missing');
        }

        if (url.endsWith('/features')) {
            const oldUrl = url;
            process.nextTick(() =>
                this.emit(
                    'warn',
                    `Unleash server URL "${oldUrl}" should no longer link directly to /features`,
                ),
            );
            url = url.replace(/\/features$/, '');
        }

        if (!url.endsWith('/')) {
            url += '/';
        }

        if (!appName) {
            throw new Error('Unleash client appName missing');
        }

        if (!instanceId) {
            let info;
            try {
                info = userInfo();
            } catch (e) {
                //unable to read info;
            }

            const prefix = info
                ? info.username
                : `generated-${Math.round(Math.random() * 1000000)}-${process.pid}`;
            instanceId = `${prefix}-${hostname()}`;
        }

        this.staticContext = { appName, environment };

        this.repository =
            repository ||
            new Repository({
                backupPath,
                url,
                appName,
                instanceId,
                refreshInterval,
                headers: customHeaders,
                customHeadersFunction,
                timeout,
            });

        strategies = defaultStrategies.concat(strategies);

        this.repository.on('ready', () => {
            this.client = new Client(this.repository, strategies);
            this.client.on('error', err => this.emit('error', err));
            this.client.on('warn', msg => this.emit('warn', msg));
            this.emit('ready');
        });

        this.repository.on('error', err => {
            err.message = `Unleash Repository error: ${err.message}`;
            this.emit('error', err);
        });

        this.repository.on('warn', msg => {
            this.emit('warn', msg);
        });
        
        this.metrics = new Metrics({
            disableMetrics,
            appName,
            instanceId,
            strategies: strategies.map((strategy: IExperimentStrategy) => strategy.getName()),
            metricsInterval,
            url,
            headers: customHeaders,
            customHeadersFunction,
            timeout,
        });

        this.metrics.on('error', err => {
            err.message = `Unleash Metrics error: ${err.message}`;
            this.emit('error', err);
        });

        this.metrics.on('warn', msg => {
            this.emit('warn', msg);
        });

        this.metrics.on('count', (name, enabled) => {
            this.emit('count', name, enabled);
        });

        this.metrics.on('sent', payload => {
            this.emit('sent', payload);
        });

        this.metrics.on('registered', payload => {
            this.emit('registered', payload);
        });
    }

    destroy() {
        this.repository.stop();
        //this.metrics.stop();
        this.client = undefined;
    }

    isEnabled(name: string, context?: IExperimentContext, fallbackFunction?: FallbackFunction): boolean;
    isEnabled(name: string, context?: IExperimentContext, fallbackValue?: boolean): boolean;
    isEnabled(name: string, context?: IExperimentContext, fallback?: FallbackFunction | boolean): boolean {
        const enhancedContext = Object.assign({}, this.staticContext, context);
        const fallbackFunc = createFallbackFunction(name, enhancedContext, fallback);

        let result;
        if (this.client !== undefined) {
            result = this.client.isEnabled(name, enhancedContext, fallbackFunc);
        } else {
            result = fallbackFunc();
            this.emit(
                'warn',
                `Unleash has not been initialized yet. isEnabled(${name}) defaulted to ${result}`,
            );
        }
        this.count(name, result);
        return result;
    }

    getVariant(name: string, context: any, fallbackVariant?: IExperimentVariant): IExperimentVariant {
        let result;
        if (this.client !== undefined) {
            result = this.client.getVariant(name, context, fallbackVariant);
        } else {
            result = typeof fallbackVariant !== 'undefined' ? fallbackVariant : getDefaultVariant();
            this.emit(
                'warn',
                `Unleash has not been initialized yet. isEnabled(${name}) defaulted to ${result}`,
            );
        }
        if (result.name) {
            this.countVariant(name, result.name);
        } else {
            this.count(name, result.enabled);
        }

        return result;
    }

    getFeatureToggleDefinition(toggleName: string): IExperiment {
        return this.repository.getToggle(toggleName);
    }

    getFeatureToggleDefinitions(): IExperiment[] {
        return this.repository.getToggles();
    }

    count(toggleName: string, enabled: boolean) {
        this.metrics.count(toggleName, enabled);
    }

    countVariant(toggleName: string, variantName: string) {
        this.metrics.countVariant(toggleName, variantName);
    }

    getRepository(): RepositoryInterface {
        return this.repository
    }

    getMetrics(): Metrics {
        return this.metrics
    }

    getRepositoryUrl(): string {
        return this.repository.getUrl();
    }

    isClientTerminated(): boolean {
        return this.client === undefined;
    }
}
