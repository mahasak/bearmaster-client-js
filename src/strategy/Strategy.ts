import { IExperimentStrategy, IExperimentConstraint, IExperimentContext } from "../interfaces";
import { Operator } from "../enums";

const resolveContextValue = (context: IExperimentContext, field: string) => {
    if (context[field]) {
        return context[field];
    } else if (context.properties && context.properties[field]) {
        return context.properties[field];
    } else {
        return undefined;
    }
}

export abstract class Strategy implements IExperimentStrategy {
    public name: string;
    private returnValue: boolean;

    constructor(name: string, returnValue: boolean = false) {
        this.name = name || 'unknown';
        this.returnValue = returnValue;
    }

    checkConstraint(constraint: IExperimentConstraint, context: IExperimentContext): boolean {
        const field = constraint.contextName;
        const contextValue = resolveContextValue(context, field);
        const isIn = constraint.values.some(val => val.trim() === contextValue);
        return constraint.operator === Operator.IN ? isIn : !isIn;
    }

    checkConstraints(constraints: IExperimentConstraint[], context: IExperimentContext): boolean {
        if (!constraints || constraints.length === 0) {
            return true;
        }
        return constraints.every(constraint => this.checkConstraint(constraint, context));
    }

    isEnabled(params: any, context: IExperimentContext): boolean {
        return this.returnValue;
    }

    isEnabledWithConstraint(params: any, context: IExperimentContext, constraints: IExperimentConstraint[]): boolean {
        return this.checkConstraints(constraints, context) && this.isEnabled(params, context);
    }
}
