import { IExperimentStrategyInfo, IExperimentVariantDefinition, IExperiment } from "../../interfaces";

export function buildToggle(name: string, active: boolean, strategies?: IExperimentStrategyInfo[] , variants: IExperimentVariantDefinition[] = []): IExperiment {
    return {
        name,
        enabled: active,
        strategies: strategies || [{ name: 'default', parameters: {}, constraints: [] }],
        variants,
    };
}