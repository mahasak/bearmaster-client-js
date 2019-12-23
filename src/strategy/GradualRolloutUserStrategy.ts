import { Strategy } from './Strategy';
import { normalizedValue } from '../utils';
import { IExperimentContext } from '../interfaces';

export class GradualRolloutUserStrategy extends Strategy {
    constructor() {
        super('gradualRolloutUserId');
    }

    isEnabled(parameters: any, context?: IExperimentContext) {
        const userId = context?.userId;
        if (!userId) {
            return false;
        }

        const percentage = Number(parameters.percentage);
        const groupId = parameters.groupId || '';

        const normalizedUserId = normalizedValue(userId, groupId);

        return percentage > 0 && normalizedUserId <= percentage;
    }
}
