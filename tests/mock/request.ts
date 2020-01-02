export const request = {
    get: jest.fn( ()=> {
        console.log(
            'Invoked'
        );
            Promise.resolve({
            name: 'feature',
            enabled: true,
            strategies: [
                {
                    name: 'default',
                },
            ],
        });
    })
}
