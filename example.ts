// tslint:disable:no-shadowed-variable
// tslint:disable:no-console
import { Trait, TraitConfig, traitSelector, Use } from './trait';

// Setup
class GetImageTrait extends Trait {
    public static INSTANCE = 'toto';
    public getImage(p1?: string, p2 = true) {
        console.log('GetImageTrait.getImage');
        // i.e. make a request to retrieve an image
        return null;
    }
}

class ComputeTrait extends Trait {
    public compute() {
        // i.e. compute anything
    }

    public getImage() {
        console.log('ComputeTrait.getImage');
    }
}

// 1. Simple Usage
console.log('======= EXAMPLE 1');
@Use(GetImageTrait)
class Controller {
    public that = (this as unknown) as Controller & GetImageTrait;
    public foo() {
        this.that.getImage();
    }
}

// ----------------

const controller = new Controller();
console.log('should log "GetImageTrait.getImage"');
controller.foo();

// 2. Function decorator usage for Intellisense
console.log('\n\n======= EXAMPLE 2');
const Controller2 = Use([GetImageTrait, ComputeTrait])(
    class Controller2 {
        public foo(this: Controller2 & GetImageTrait) {
            this.getImage();
        }
    },
);

// ----------------

const controller2 = new Controller2();
console.log('should log "GetImageTrait.getImage"');
controller2.foo();

// 3 "as" & "insteadof" trait rules
console.log('\n\n======= EXAMPLE 3');
@Use([
    GetImageTrait,
    ComputeTrait,
    {
        as: {
            // can use the helper method as selector
            // scope is not handled yet
            [traitSelector(GetImageTrait, 'INSTANCE', true)]: 'protected III',
        },
        insteadOf: {
            // or do the selector ourselves (only in non-obfuscated code)
            'ComputeTrait.getImage': [GetImageTrait],
        },
    },
])
class Controller3 {}

// ----------------

const controller3: any = new Controller3();
console.log('should log undefined');
console.log((Controller3 as any).INSTANCE); // should log undefined

console.log('\n--------');

console.log('should log "toto"');
console.log((Controller3 as any).III); // should log "toto"

console.log('\n--------');

console.log('should log "ComputeTrait.getImage"');
controller3.getImage(); // should log "ComputeTrait.getImage"
