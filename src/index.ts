import { BearMaster, BearMasterConfig } from './BearMaster';
import { getDefaultVariant } from './variant';
import { 
    IExperimentVariant,
    IExperimentContext,
    IExperimentStrategy
} from './interfaces'

export { IExperimentStrategy } from './interfaces'
export { Strategy } from './strategy/Strategy';
export { BearMaster } from './BearMaster';

let instance: BearMaster | undefined;
export function initialize(options: BearMasterConfig): BearMaster {
    instance = new BearMaster(options);
    
    return instance;
}

export function isEnabled(name: string, context: IExperimentContext = {}, fallbackValue?: boolean): boolean {
    return !!instance && instance.isEnabled(name, context, fallbackValue);
}

export function destroy() {
    return instance && instance.destroy();
}

export function getFeatureToggleDefinition(toggleName: string) {
    return instance && instance.getFeatureToggleDefinition(toggleName);
}

export function getFeatureToggleDefinitions() {
    return instance && instance.getFeatureToggleDefinitions();
}

export function getVariant(
    name: string,
    context: IExperimentContext = {},
    fallbackVariant?: IExperimentVariant,
): IExperimentVariant {
    if (!fallbackVariant) {
        fallbackVariant = getDefaultVariant();
    }
    return instance ? instance.getVariant(name, context, fallbackVariant) : fallbackVariant;
}

export function count(toggleName: string, enabled: boolean) {
    return instance && instance.count(toggleName, enabled);
}

export function countVariant(toggleName: string, variantName: string) {
    return instance && instance.countVariant(toggleName, variantName);
}
