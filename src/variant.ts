import {
    IContextOverride,
    IExperiment,
    IExperimentVariant,
    IExperimentContext,
    IExperimentVariantDefinition
} from './interfaces';
import { normalizedValue } from './utils';

export function getDefaultVariant(): IExperimentVariant {
    return {
        name: 'disabled',
        enabled: false,
    };
}

const stickynessSelectors = ['userId', 'sessionId', 'remoteAddress'];
function getSeed(context: IExperimentContext): string {
    let result;
    stickynessSelectors.some(
        (key: string): boolean => {
            const value = context[key];
            if (typeof value === 'string' && value !== '') {
                result = value;
                return true;
            }
            return false;
        },
    );
    return result || String(Math.round(Math.random() * 100000));
}

function overrideMatchesContext(context: IExperimentContext): (o: IContextOverride) => boolean {
    return (o: IContextOverride) => o.values.some(value => value === context[o.contextName]);
}

function findOverride(feature: IExperiment, context: IExperimentContext): IExperimentVariantDefinition | undefined {
    return feature.variants
        .filter(variant => variant.overrides)
        .find(variant => variant.overrides.some(overrideMatchesContext(context)));
}

export function selectVariant(
    feature: IExperiment,
    context: IExperimentContext,
): IExperimentVariantDefinition | null {
    const totalWeight = feature.variants.reduce((acc, v) => acc + v.weight, 0);
    if (totalWeight <= 0) {
        return null;
    }
    const variantOverride = findOverride(feature, context);
    if (variantOverride) {
        return variantOverride;
    }
    const target = normalizedValue(getSeed(context), feature.name, totalWeight);

    let counter = 0;
    const variant = feature.variants.find(
        (variant: IExperimentVariantDefinition): any => {
            if (variant.weight === 0) {
                return;
            }
            counter += variant.weight;
            if (counter < target) {
                return;
            } else {
                return variant;
            }
        },
    );
    return variant || null;
}
