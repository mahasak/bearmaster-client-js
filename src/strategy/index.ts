import { IExperimentStrategy } from "../interfaces";
import { DefaultStrategy } from "./DefaultStrategy";

export const defaultStrategies: IExperimentStrategy[] = [
    new DefaultStrategy(),
];