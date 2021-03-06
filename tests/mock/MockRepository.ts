import { Storage } from '../../src/storage';
import Repository, {
    RepositoryOptions
} from '../../src/repository';
const appName = 'foo';
const instanceId = 'bar';
import { MockStorage } from './MockStorage'
import { IExperiment } from '../../src/interfaces';

export class MockRepository extends Repository {
    private toggleFunction: Function;
    constructor({
        backupPath,
        url,
        appName,
        instanceId,
        refreshInterval,
        StorageImpl = MockStorage,
        timeout,
        headers,
        customHeadersFunction,
    }: RepositoryOptions, toggleFunction: Function) {
        super({
            backupPath,
            url,
            appName,
            instanceId,
            refreshInterval,
            StorageImpl,
            timeout,
            headers,
            customHeadersFunction,
        });
        this.toggleFunction = toggleFunction;
    }


    async fetch() { }


    getToggle(name: string): IExperiment {
        return this.toggleFunction();
    }

    getToggles(): IExperiment[] {
        return this.toggleFunction();
    }

    getETag(): string {
        return this.etag ?? '';
    }

    setEtag(etag: string): void {
        this.etag = etag;
    }
}