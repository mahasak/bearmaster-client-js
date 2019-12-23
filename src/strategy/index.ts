import { IExperimentStrategy } from "../interfaces";
import { DefaultStrategy } from "./DefaultStrategy";
import { HostnameStrategy } from "./HostnameStrategy";
import { GradualRolloutRandomStrategy } from "./GradualRolloutRandomStrategy";
import { GradualRolloutSessionStrategy } from "./GradualRolloutSessionStrategy";
import { GradualRolloutUserStrategy } from "./GradualRolloutUserStrategy";

export const defaultStrategies: IExperimentStrategy[] = [
    new DefaultStrategy(),
    new HostnameStrategy(),
    new GradualRolloutRandomStrategy(),
    new GradualRolloutUserStrategy(),
    new GradualRolloutSessionStrategy(),
];