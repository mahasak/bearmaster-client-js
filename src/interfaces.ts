import { EventEmitter } from 'events';
import { Operator, ParamType } from './enums';



export interface IExperimentContext {
    [key: string]: string | undefined | number;
    userId?: string;
    sessionId?: string;
    ipAddress?: string;
    environment?: string;
    appName?: string;
    properties?: any;
}

export interface IExperiment {
    name: string;
    description?: string;
    enabled: boolean;
    strategies: IExperimentStrategyInfo[];
    variants: IExperimentVariantDefinition[];
}

export interface IExperimentStrategy {
    checkConstraint(constraint: IExperimentConstraint, context: IExperimentContext): boolean;
    checkConstraints(constraints: IExperimentConstraint[], context: IExperimentContext): boolean;
    getName(): string;
    isEnabled(params: any, context?: IExperimentContext): boolean;
    isEnabledWithConstraint(params: any, context?: IExperimentContext, constraints?: IExperimentConstraint[]): boolean;
}

export interface IExperimentStrategyInfo {
    name: string;
    parameters: any;
    constraints: IExperimentConstraint[];
}

export interface IExperimentConstraint {
    contextName: string;
    operator: Operator;
    values: string[];
}

export interface IExperimentParam {
    name: string;
    type: ParamType;
    value: string;
}

export interface IExperimentVariantDefinition {
    name: string;
    weight: number;
    params: IExperimentParam[];
}

export interface IExperimentVariant {
    name: string;
    enabled: boolean;
    params: IExperimentParam[];
}

export interface IExperimentClient {
    isEnable(name: string, context: IExperimentContext, fallback?: any):boolean;
    isEnable(experiment: IExperiment, context: IExperimentContext, fallback: Function): boolean;
    getVariant(name: string, context: IExperimentContext, fallback?: IExperimentVariant): IExperimentVariant;
    getVariant(experiment: IExperiment, context: IExperimentContext, fallback?: IExperimentVariant): IExperimentVariant;
}

export interface IExperimentPlatform {
    client: IExperimentClient;
    destroy(): void;
    getVariant(name: string, context: IExperimentContext, fallback?: IExperimentVariant): IExperimentVariant;
    isEnabled(name: string, context: IExperimentContext, fallback?: Function): boolean;
}

export interface CustomHeaders {
    [key: string]: string;
}

export type CustomHeadersFunction = () => Promise<CustomHeaders>;

export interface IExperimentPlatformConfig {
    appName: string;
    environment?: string;
    instanceId?: string;
    url: string;
    refreshInterval?: number;
    metricsInterval?: number;
    disableMetrics?: boolean;
    backupPath?: string;
    strategies?: IExperimentStrategyInfo[];
    customHeaders?: CustomHeaders;
    customHeadersFunction?: CustomHeadersFunction;
    timeout?: number;
    repository?: IExperimentRepository;
}

export interface IExperimentRepository extends EventEmitter {
    getExperiment(name: string): IExperiment;
    getExperiments(): IExperiment[];
    stop(): void;
}
