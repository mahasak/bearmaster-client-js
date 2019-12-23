import { IExperimentStrategy } from "../interfaces";
import { DefaultStrategy } from "./DefaultStrategy";
import { HostnameStrategy } from "./HostnameStrategy";
import { GradualRolloutRandomStrategy } from "./GradualRolloutRandomStrategy";
import { GradualRolloutSessionStrategy } from "./GradualRolloutSessionStrategy";
import { GradualRolloutUserStrategy } from "./GradualRolloutUserStrategy";
import { UserWithIdStrategy } from "./UserWithIdStrategy";
import { RemoteAddressStrategy } from "./RemoteAddressStrategy";
import { FlexibleRolloutStrategy } from "./FlexibleRolloutStrategy";

export const defaultStrategies: IExperimentStrategy[] = [
    new DefaultStrategy(),
    new HostnameStrategy(),
    new GradualRolloutRandomStrategy(),
    new GradualRolloutUserStrategy(),
    new GradualRolloutSessionStrategy(),
    new UserWithIdStrategy(),
    new RemoteAddressStrategy(),
    new FlexibleRolloutStrategy();
];