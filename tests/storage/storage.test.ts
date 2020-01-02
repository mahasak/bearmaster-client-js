import { writeFileSync } from 'fs';
import { tmpdir } from 'os';
import { join } from 'path';
import { Storage } from '../../src/storage';
import * as mkdirp from 'mkdirp';

function setup(name: string) {
    const tmp = join(tmpdir(), name + Math.round(10000 * Math.random()));
    mkdirp.sync(tmp);
    const storage = new Storage({ backupPath: tmp, appName: 'test' });

    storage.on('error', err => {
        throw err;
    });
    return storage;
}

test('should load content from backup file', async () => {
    return new Promise((resolve, reject) => {
        const tmp = join(tmpdir(), 'backup-file-test');
        mkdirp.sync(tmp);
        const storage = new Storage({ backupPath: tmp, appName: 'test' });
        const data = { random: Math.random() };
        storage.on('error', reject);

        storage.once('persisted', () => {
            expect(storage.get('random') === data.random).toBeTruthy();

            const storage2 = new Storage({ backupPath: tmp, appName: 'test' });
            storage2.on('error', reject);
            storage2.on('ready', () => {
                expect(storage2.get('random') === data.random).toBeTruthy();
                resolve();
            });
        });
        storage.reset(data);
    });
});

test('should handle complex appNames', async () => {
    return new Promise((resolve, reject) => {
        const tmp = join(tmpdir(), 'backup-file-test');
        mkdirp.sync(tmp);
        const appName = '@namspace-dash/slash-some-app';
        const storage = new Storage({ backupPath: tmp, appName });
        const data = { random: Math.random() };
        storage.on('error', reject);

        storage.once('persisted', () => {
            expect(storage.get('random') === data.random).toBeTruthy();

            const storage2 = new Storage({ backupPath: tmp, appName });
            storage2.on('error', reject);
            storage2.on('ready', () => {
                expect(storage2.get('random') === data.random).toBeTruthy();
                resolve();
            });
        });
        storage.reset(data);
    });
});

test('should emit error when non-existent target backupPath', () => {
    const storage = new Storage({
        backupPath: join(tmpdir(), `random-${Math.round(Math.random() * 10000)}`),
        appName: 'test',
    });
    storage.reset({ random: Math.random() });
    storage.on('error', err => {
        expect(err).toBeTruthy();
        expect(err.code === 'ENOENT').toBeTruthy;
        //expect.end();
    });
});

test('should emit error when stored data is invalid', () => {
    const dir = join(tmpdir(), `random-${Math.round(Math.random() * 10123000)}`);
    mkdirp.sync(dir);
    writeFileSync(join(dir, 'unleash-repo-schema-v1-test.json'), '{invalid: json, asd}', 'utf8');
    const storage = new Storage({
        backupPath: dir,
        appName: 'test',
    });
    storage.on('persisted', console.log);
    storage.on('error', err => {
        expect(err).toBeTruthy();
        expect(err.message).toContain(/Unexpected token/);
    });
});

test('should not write content from backup file if ready has been fired', async () => {
    return new Promise((resolve, reject) => {
        const tmp = join(tmpdir(), 'ignore-backup-file-test');
        mkdirp.sync(tmp);
        const storage = new Storage({
            backupPath: tmp,
            appName: 'test',
        });
        const data = { random: Math.random() };
        storage.on('error', reject);

        storage.once('persisted', () => {
            expect(storage.get('random') === data.random).toBeTruthy();

            const storage2 = new Storage({
                backupPath: tmp,
                appName: 'test',
            });
            const overwrite = { random: Math.random() };

            storage2.on('error', reject);
            storage2.on('ready', () => {
                expect(storage2.get('random') !== data.random).toBeTruthy();
                expect(storage2.get('random') === overwrite.random).toBeTruthy();
                resolve();
            });

            // Lets pretend "server" finished read first
            storage2.reset(overwrite);
        });
        storage.reset(data);
    });
});

test('should provide Get method from data', () => {
    const storage = setup('get-method');
    const result = storage.get('some-key');

    expect(result === undefined).toBeTruthy;

    storage.reset({ 'some-key': 'some-value' });

    const result2 = storage.get('some-key');

    expect(result2 === 'some-value').toBeTruthy;
});

test('should provide getAll method for data object', () => {
    const storage = setup('get-all-method');
    const result = storage.getAll();

    expect(result).toStrictEqual({});

    storage.reset({ 'some-key': 'some-value' });

    const result2 = storage.getAll();

    expect(result2).toStrictEqual( { 'some-key': 'some-value' });
});

test('should persist data on reset', async () => {
    return new Promise(resolve => {
        const storage = setup('persist');
        const data = { random: Math.random() };

        storage.once('persisted', () => {
            expect(storage.get('random') === data.random).toBeTruthy();
            resolve();
        });

        expect(storage.get('random') !== data.random).toBeTruthy();
        storage.reset(data);
        expect(storage.get('random') === data.random).toBeTruthy();
    }); 
});

test('should persist again after data reset', async () => {
    return new Promise(resolve => {
        const storage = setup('persist2');
        const data = { random: Math.random() };

        storage.once('persisted', () => {
            expect(storage.get('random') === data.random).toBeTruthy();
            const data2 = { random: Math.random() };

            storage.once('persisted', () => {
                expect(storage.get('random') === data2.random).toBeTruthy();
                resolve();
            });

            storage.reset(data2);
        });

        expect(storage.get('random') !== data.random).toBeTruthy();
        storage.reset(data);
        expect(storage.get('random') === data.random).toBeTruthy();
    });
});
