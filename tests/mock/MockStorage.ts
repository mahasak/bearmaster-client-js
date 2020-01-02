import { Storage } from '../../src/storage';
const appName = 'foo';
const instanceId = 'bar';

export class MockStorage extends Storage {
    constructor() {
        super({
            backupPath: "/test",
            appName: appName
        });
        this.data = {};
        process.nextTick(() => this.emit('ready'));
    }

    safeAppName(appName: string = '') {
        return appName.replace(/\//g, '_');
    }

    persist(): void {
    }

    load(): void {
    }

    reset(data: any) {
        this.data = data;
    }

    get(name: string) {
        return this.data[name];
    }

    getAll() {
        return this.data;
    }
}