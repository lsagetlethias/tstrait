tstrait
===
Yet another mixin library but without mixins.

# Installation
## Node (or front)
```sh
yarn add tstrait
# or
npm install tstrait
```

## Deno
```ts
// /!\ Not registered yet in the global deno registry /!\
// in you deps.ts
export * as tstait from 'https://raw.githubusercontent.com/bios21/tstrait/master/mod.ts';

// in your main.ts
import { tstrait } from './mod.ts';

const { Trait, Use } = tstrait;
```

# Example
You can run the example with the command `yarn start` (or `npm run start`)

```ts
import { Trait, traitSelector, Use } from './trait';

// Setup
class GetImageTrait extends Trait {
    public static INSTANCE = 'toto';
    public static S1 = 'Static1';
    public static S2 = 'Static2';
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
            'GetImageTrait::S2': 'S3',
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

console.log('\n--------');

console.log('should log "Static2"');
console.log((Controller3 as any).S3); // should log "Static2"
```


# License
[MIT](./LICENSE)