import { IExperimentStrategy } from "../interfaces";
import { DefaultStrategy } from "./DefaultStrategy";
import { HostnameStrategy } from "./HostnameStrategy";

export const defaultStrategies: IExperimentStrategy[] = [
    new DefaultStrategy(),
    new HostnameStrategy(),
];