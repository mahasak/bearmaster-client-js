import { Strategy } from './Strategy';
import { normalizedValue } from '../utils';
import { IExperimentContext } from '../interfaces';

export class GradualRolloutSessionStrategy extends Strategy {
    constructor() {
        super('gradualRolloutSessionId');
    }

    isEnabled(parameters: any, context?: IExperimentContext) {
        const sessionId = context?.sessionId;
        if (!sessionId) {
            return false;
        }

        const percentage = Number(parameters.percentage);
        const groupId = parameters.groupId || '';

        const normalizedId = normalizedValue(sessionId, groupId);

        return percentage > 0 && normalizedId <= percentage;
    }
}
