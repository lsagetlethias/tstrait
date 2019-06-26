// tslint:disable:no-shadowed-variable
import { Trait, traitSelector, Use } from './trait';

const GETIMAGETRAIT_GETIMAGE = 'GetImageTrait.getImage';
const COMPUTETRAIT_COMPUTE = 'ComputeTrait.compute';
const COMPUTETRAIT_GETIMAGE = 'ComputeTrait.getImage';

// Setup
class GetImageTrait extends Trait {
    public static INSTANCE = 'foo';
    public static S1 = 'Static1';
    public static S2 = 'Static2';
    public getImage(p1?: string, p2 = true) {
        return GETIMAGETRAIT_GETIMAGE;
    }
    public fn1() {}
}

class ComputeTrait extends Trait {
    public compute() {
        return COMPUTETRAIT_COMPUTE;
    }

    public getImage() {
        return COMPUTETRAIT_GETIMAGE;
    }
}

it('should works with an annotation', () => {
    @Use(GetImageTrait)
    class Controller {
        public that = (this as unknown) as Controller & GetImageTrait;
        public foo() {
            return this.that.getImage();
        }
    }

    const controller = new Controller();
    expect(controller.foo()).toBe(GETIMAGETRAIT_GETIMAGE);
});

it('should works as function decorator', () => {
    const Controller = Use([GetImageTrait, ComputeTrait])(
        class Controller {
            public foo(this: Controller & GetImageTrait) {
                return this.getImage();
            }
        },
    );

    const controller = new Controller();
    expect(controller.foo()).toBe(GETIMAGETRAIT_GETIMAGE);
});

describe('traitSelector()', () => {
    it('should produce a valid token', () => {
        expect(traitSelector(GetImageTrait, 'getImage')).toBe('GetImageTrait.getImage');
        expect(traitSelector(GetImageTrait, 'INSTANCE', true)).toBe('GetImageTrait::INSTANCE');
    });

    it('should throw if selected prop is not found', () => {
        expect(() => traitSelector(GetImageTrait, 'aaaaaa' as any)).toThrow(/^Error on TraitSelector/);
        expect(() => traitSelector(GetImageTrait, 'aaaaaa' as any, true)).toThrow(/^Error on TraitSelector/);
    });
});

describe('Trait rules', () => {
    it('should alias a property with another', () => {
        @Use([
            GetImageTrait,
            ComputeTrait,
            {
                as: {
                    [traitSelector(GetImageTrait, 'INSTANCE', true)]: 'protected FOO',
                    'GetImageTrait::S2': 'S3',
                },
            },
        ])
        class Controller {}

        expect((Controller as any).INSTANCE).toBeUndefined();
        expect((Controller as any).FOO).toBe('foo');
        expect((Controller as any).S2).toBeUndefined();
        expect((Controller as any).S3).toBe('Static2');
    });

    it('should throws when selectors are malformed', () => {
        expect(
            Use([
                GetImageTrait,
                {
                    as: {
                        'GetImageTrait getImage': 'foo',
                    },
                },
            ]),
        ).toThrow(/^The selector "GetImageTrait getImage" is malformed/);
    });

    it('should throws when property is not found', () => {
        expect(
            Use([
                GetImageTrait,
                {
                    as: {
                        'GetImageTrait.foo': 'bar',
                    },
                },
            ]),
        ).toThrow(
            'In selector "GetImageTrait.foo", the property or method "foo" was not found on the trait "GetImageTrait" prototype.',
        );

        expect(
            Use([
                GetImageTrait,
                {
                    as: {
                        'GetImageTrait::foo': 'bar',
                    },
                },
            ]),
        ).toThrow(
            'In selector "GetImageTrait::foo", the static property or method "foo" was not found on the trait "GetImageTrait".',
        );
    });

    describe('AS', () => {
        it('should make the initial prop undefined', () => {
            @Use([
                GetImageTrait,
                {
                    as: {
                        'GetImageTrait.getImage': 'foo',
                    },
                },
            ])
            class Controller {}
            expect((new Controller() as any).getImage).toBeUndefined();
        });

        it('should work with no scope', () => {
            @Use([
                GetImageTrait,
                {
                    as: {
                        'GetImageTrait.getImage': 'foo',
                    },
                },
            ])
            class Controller {}
            expect((new Controller() as any).foo()).toBe(GETIMAGETRAIT_GETIMAGE);
        });

        it('should work with only scope', () => {
            @Use([
                GetImageTrait,
                {
                    as: {
                        'GetImageTrait.getImage': 'public',
                    },
                },
            ])
            class Controller {}
            expect((new Controller() as any).getImage()).toBe(GETIMAGETRAIT_GETIMAGE);
        });

        it('should throws if scope is not known', () => {
            expect(
                Use([
                    GetImageTrait,
                    {
                        as: {
                            'GetImageTrait.getImage': 'synchronized foo',
                        },
                    },
                ]),
            ).toThrow(
                'In the "as"-part "synchronized foo", the scope have to be one of these: public, protected, private',
            );
        });

        it('should throws if the property name is not good for JS', () => {
            expect(
                Use([
                    GetImageTrait,
                    {
                        as: {
                            'GetImageTrait.getImage': '0foo',
                        },
                    },
                ]),
            ).toThrow(/^In the "as"-part "0foo", the name "0foo" is not a valid property/);
        });

        it('should throws if we add more than a scope and a name', () => {
            expect(
                Use([
                    GetImageTrait,
                    {
                        as: {
                            'GetImageTrait.getImage': 'public static foo',
                        },
                    },
                ]),
            ).toThrow(/^The "as"-part "public static foo" is not valid/);
        });

        // -----------
        // After parse
        // -----------

        // Can't overlap trait static method
        it('should throws if a collision with an existing prop is found', () => {
            expect(
                Use([
                    GetImageTrait,
                    {
                        as: {
                            'GetImageTrait::INSTANCE': 'S1',
                        },
                    },
                ]),
            ).toThrow(
                'Collision on "as" trait rule. "GetImageTrait.S1" (static) already exists and can\'t be overlap.',
            );

            // Can't overlap trait instance method
            expect(() =>
                Use([
                    GetImageTrait,
                    {
                        as: {
                            'GetImageTrait.getImage': 'fn1',
                        },
                    },
                ])(class Controller {}),
            ).toThrow('Collision on "as" trait rule. "GetImageTrait.fn1" already exists and can\'t be overlap.');

            // Can't overlap traited class static method
            expect(() =>
                Use([
                    GetImageTrait,
                    {
                        as: {
                            'GetImageTrait::INSTANCE': 'FOO',
                        },
                    },
                ])(
                    class Controller {
                        public static FOO = 'FOO';
                    },
                ),
            ).toThrow('Collision on "as" trait rule. "Controller.FOO" (static) already exists and can\'t be overlap.');

            // Can't overlap traited class instance method
            expect(() =>
                Use([
                    GetImageTrait,
                    {
                        as: {
                            'GetImageTrait.getImage': 'foo',
                        },
                    },
                ])(
                    class Controller {
                        public foo() {}
                    },
                ),
            ).toThrow('Collision on "as" trait rule. "Controller.foo" already exists and can\'t be overlap.');
        });

        it('should works with an empty config', () => {
            @Use([
                GetImageTrait,
                {
                    as: {},
                },
            ])
            class Controller {}
            expect((new Controller() as any).getImage()).toBe(GETIMAGETRAIT_GETIMAGE);
        });

        it('should throws with an weird config', () => {
            expect(
                Use([
                    GetImageTrait,
                    {
                        as: {
                            'GetImageTrait.getImage': null,
                        },
                    },
                ]),
            ).toThrow();
        });
    });

    describe('INSTEAD OF', () => {
        it('should replace a trait method by another from another trait', () => {
            @Use([
                GetImageTrait,
                ComputeTrait,
                {
                    insteadOf: {
                        'ComputeTrait.getImage': [GetImageTrait],
                    },
                },
            ])
            class Controller {}
            expect((new Controller() as any).getImage()).toBe(COMPUTETRAIT_GETIMAGE);
        });
    });
});
