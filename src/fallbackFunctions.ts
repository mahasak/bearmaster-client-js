import { IExperimentContext } from './interfaces';

export type FallbackFunction = (name: string, context: IExperimentContext) => boolean;

export function createFallbackFunction(
    name: string,
    context: IExperimentContext,
    fallback?: FallbackFunction | boolean,
): Function {
    if (typeof fallback === 'function') {
        return () => fallback(name, context);
    } else if (typeof fallback === 'boolean') {
        return () => fallback;
    } else {
        return () => false;
    }
}
