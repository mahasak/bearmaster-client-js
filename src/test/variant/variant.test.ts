
import { selectVariant } from '../../variant';
import { ParamType } from '../../enums'
import { IExperiment, IExperimentVariant, IExperimentVariantDefinition } from '../../interfaces';

function genVariants(n: Number): IExperimentVariantDefinition[] {
    return Array.from(new Array(n)).map((v, i) => ({
        name: `variant${i + 1}`,
        params: [{
            name: 'test',
            type: 'String',
            value: '',
        }],
        weight: 1,
    }));
}

function createFeature(variants?: IExperimentVariantDefinition[]):IExperiment {
    return {
        name: 'toggleName',
        enabled: true,
        strategies: [],
        variants: variants ?? undefined,
    };
}

test('selectVariant should return null', () => {
    const variant = selectVariant(createFeature(), {
        toggleName: 'toggleName',
        userId: 'a',
    });
    expect(variant).toBe(null);
});


test('selectVariant should select on 1 variant', () => {
    const variant = selectVariant(createFeature(genVariants(1)), {
        toggleName: 'toggleName',
        userId: 'a',
    });
    expect(variant?.name).toBe('variant1');
});


test('selectVariant should select on 2 variants', () => {
    const feature = createFeature(genVariants(2));
    const variant = selectVariant(feature, { toggleName: 'toggleName', userId: 'a' });
    expect(variant?.name).toBe('variant1');
    const variant2 = selectVariant(feature, { toggleName: 'toggleName', userId: '0' });
    expect(variant2?.name).toBe('variant2');
});


test('selectVariant should select on 3 variants', () => {
    const feature = createFeature(genVariants(3));
    const variant = selectVariant(feature, { toggleName: 'toggleName', userId: 'a' });
    expect(variant?.name).toBe('variant1');
    const variant2 = selectVariant(feature, { toggleName: 'toggleName', userId: '0' });
    expect(variant2?.name).toBe('variant2');
    const variant3 = selectVariant(feature, { toggleName: 'toggleName', userId: 'z' });
    expect(variant3?.name).toBe('variant3');
});

test('selectVariant should use variant overrides', () => {
    const variants = genVariants(3);
    variants[0].overrides = [
        {
            contextName: 'userId',
            values: ['z'],
        },
    ];

    const feature = createFeature(variants);
    const variant1 = selectVariant(feature, { toggleName: 'toggleName', userId: 'z' });
    expect(variant1?.name).toBe('variant1');
});

test('selectVariant should use *first* variant override', () => {
    const variants = genVariants(3);
    variants[0].overrides = [
        {
            contextName: 'userId',
            values: ['z', 'b'],
        },
    ];

    variants[1].overrides = [
        {
            contextName: 'userId',
            values: ['z'],
        },
    ];

    const feature = createFeature(variants);
    const variant1 = selectVariant(feature, { toggleName: 'toggleName', userId: 'z' });
    expect(variant1?.name).toBe('variant1');
});

test('selectVariant should use *first* variant override for userId=132', () => {
    const featureToggle = {
        name: 'Feature.Variants.override.D',
        description: 'Variant with overrides',
        enabled: true,
        strategies: [],
        variants: [
            {
                name: 'variant1',
                weight: 33,
                params: [{
                    name: 'test',
                    type: 'string',
                    value: 'val1',
                }],
                overrides: [
                    {
                        contextName: 'userId',
                        values: ['132', '61'],
                    },
                ],
            },
            {
                name: 'variant2',
                weight: 33,
                params: [{
                    name: 'test',
                    type: 'string',
                    value: 'val2',
                }],
            },
            {
                name: 'variant3',
                weight: 34,
                params: [{
                    name: 'test',
                    type: 'string',
                    value: 'val3',
                }],
            },
        ],
    };
    const variant1 = selectVariant(featureToggle, { userId: '132' });
    expect(variant1?.name).toBe('variant1');
});
