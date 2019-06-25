// tslint:disable:no-shadowed-variable
import { Trait, traitSelector, Use } from './trait';

// Setup
class GetImageTrait extends Trait {
    public static INSTANCE = 'foo';
    public static S1 = 'Static1';
    public static S2 = 'Static2';
    public getImage(p1?: string, p2 = true) {
        return 'GetImageTrait.getImage';
    }
}

class ComputeTrait extends Trait {
    public compute() {
        return 'ComputeTrait.compute';
    }

    public getImage() {
        return 'ComputeTrait.getImage';
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
    expect(controller.foo()).toBe('GetImageTrait.getImage');
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
    expect(controller.foo()).toBe('GetImageTrait.getImage');
});

describe('Trait rules', () => {
    it('should alias a property with another', () => {
        @Use([
            GetImageTrait,
            ComputeTrait,
            {
                as: {
                    // can use the helper method as selector
                    // scope is not handled yet
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
});

// 3 "as" & "insteadof" trait rules
// console.log('\n\n======= EXAMPLE 3');
// @Use([
//     GetImageTrait,
//     ComputeTrait,
//     {
//         as: {
//             // can use the helper method as selector
//             // scope is not handled yet
//             [traitSelector(GetImageTrait, 'INSTANCE', true)]: 'protected III',
//             'GetImageTrait::S2': 'S3',
//         },
//         insteadOf: {
//             // or do the selector ourselves (only in non-obfuscated code)
//             'ComputeTrait.getImage': [GetImageTrait],
//         },
//     },
// ])
// class Controller3 {}

// // ----------------

// const controller3: any = new Controller3();
// console.log('should log undefined');
// console.log((Controller3 as any).INSTANCE); // should log undefined

// console.log('\n--------');

// console.log('should log "toto"');
// console.log((Controller3 as any).III); // should log "toto"

// console.log('\n--------');

// console.log('should log "ComputeTrait.getImage"');
// controller3.getImage(); // should log "ComputeTrait.getImage"

// console.log('\n--------');

// console.log('should log "Static2"');
// console.log((Controller3 as any).S3); // should log "Static2"
