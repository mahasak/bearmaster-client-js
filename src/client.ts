import { EventEmitter } from 'events';
import { RepositoryInterface } from './repository';
import { getDefaultVariant, selectVariant } from './variant';
import {
    IExperiment,
    IExperimentStrategy,
    IExperimentContext,
    IExperimentVariant,
    IExperimentVariantDefinition,
    IExperimentStrategyInfo
} from './interfaces';

interface BooleanMap {
    [key: string]: boolean;
}

export default class Client extends EventEmitter {
    private repository: RepositoryInterface;
    private strategies: IExperimentStrategy[];
    private warned: BooleanMap;

    constructor(repository: RepositoryInterface, strategies: IExperimentStrategy[]) {
        super();
        this.repository = repository;
        this.strategies = strategies || [];
        this.warned = {};

        this.strategies.forEach((strategy: IExperimentStrategy) => {
            if (
                !strategy ||
                !strategy.getName() ||
                //typeof strategy.getName !== 'string' ||
                !strategy.isEnabled ||
                typeof strategy.isEnabled !== 'function'
            ) {
                throw new Error('Invalid strategy data / interface');
            }
        });
    }

    private getStrategy(name: string): IExperimentStrategy | undefined {
        return this.strategies.find(
            (strategy: IExperimentStrategy): boolean => {
                return strategy.getName() === name;
            },
        );
    }

    warnOnce(missingStrategy: string, name: string, strategies: IExperimentStrategyInfo[]) {
        if (!this.warned[missingStrategy + name]) {
            this.warned[missingStrategy + name] = true;
            this.emit(
                'warn',
                `Missing strategy "${missingStrategy}" for toggle "${name}". Ensure that "${strategies
                    .map(({ name }) => name)
                    .join(', ')}" are supported before using this toggle`,
            );
        }
    }

    isEnabled(name: string, context?: IExperimentContext, fallback: Function = () => false): boolean {
        const feature = this.repository.getToggle(name);
        return this.isFeatureEnabled(feature, context, fallback);
    }

    isFeatureEnabled(feature: IExperiment, context?: IExperimentContext, fallback: Function = () => false): boolean {
        if (!feature) {
            return fallback();
        }

        if (!feature || !feature.enabled) {
            return false;
        }

        if (!Array.isArray(feature.strategies)) {
            return false;
            this.emit(
                'clientError',
                `Malformed feature, strategies not an array, is a ${typeof feature.strategies}`,

            );
            
        }

        if (feature.strategies.length === 0) {
            return feature.enabled;
        }

        return (
            feature.strategies.length > 0 &&
            feature.strategies.some(
                (strategySelector): boolean => {
                    const strategy = this.getStrategy(strategySelector.name);
                    if (!strategy) {
                        this.warnOnce(strategySelector.name, feature.name, feature.strategies);
                        return false;
                    }
                    return strategy.isEnabledWithConstraint(
                        strategySelector.parameters,
                        context,
                        strategySelector.constraints,
                    );
                },
            )
        );
    }

    getVariant(name: string, context: IExperimentContext, fallbackVariant?: IExperimentVariant): IExperimentVariant {
        if (!fallbackVariant) {
            fallbackVariant = getDefaultVariant();
        }
        const feature = this.repository.getToggle(name);
        if (
            typeof feature === 'undefined' ||
            !feature.variants ||
            !Array.isArray(feature.variants) ||
            feature.variants.length === 0
        ) {
            return fallbackVariant;
        }

        const enabled = this.isFeatureEnabled(feature, context, () =>
            fallbackVariant ? fallbackVariant.enabled : false,
        );
        if (!enabled) {
            return fallbackVariant;
        }

        const variant: IExperimentVariantDefinition | null = selectVariant(feature, context);
        if (variant === null) {
            return fallbackVariant;
        }

        return {
            name: variant.name,
            params: variant.params,
            enabled,
        };
    }
}
