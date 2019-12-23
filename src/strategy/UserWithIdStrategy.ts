import { Strategy } from "./strategy";
import { IExperimentContext } from "../interfaces";

export class UserWithIdStrategy extends Strategy {
    constructor() {
        super('userWithId');
    }

    isEnabled(parameters: any, context: IExperimentContext) {
        const userIdList = parameters.userIds.split(/\s*,\s*/);
        return userIdList.includes(context.userId);
    }
}
