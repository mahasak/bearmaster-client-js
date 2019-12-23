import { Strategy } from './Strategy';
import { IExperimentContext } from '../interfaces';
import * as ip from 'ip';

export class RemoteAddressStrategy extends Strategy {
    constructor() {
        super('remoteAddress');
    }

    isEnabled(parameters: any, context?: IExperimentContext) {
        if (!parameters.IPs) {
            return false;
        }

        const remoteAddr = context?.remoteAddress?.toString() ?? '';
        
        for (const range of parameters.IPs.split(/\s*,\s*/)) {
            try {
                if (range === remoteAddr) {
                    return true;
                } else if (!ip.isV6Format(range)) {
                    if (ip.cidrSubnet(range).contains(remoteAddr)) {
                        return true;
                    }
                }
            } catch (e) {
                continue;
            }
        }

        return false;
    }
}