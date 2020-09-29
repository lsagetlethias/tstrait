@lsagetlethias/tstrait
===
Yet another mixin library but without mixins.

# Goal
Depending on how your architecture or your codebase are made, sometimes Mixin are not good enough or simply not good at all. The Trait feature from PHP resolve the instance imutability that Mixin most of the times lacks of.

You can check some definition from PHP manual if you need to: https://www.php.net/manual/fr/language.oop5.traits.php

But TL;DR, Trait are made for multiple inheritance without constructor collision. In another words, traits gives you a way to factorize common methods between classes without putting them in a abstract class.  
They can be usefull in override situations.

# Installation
## Node (or front)
```sh
yarn add @lsagetlethias/tstrait
# or
npm install @lsagetlethias/tstrait
```

## Deno
```ts
// /!\ Not registered yet in the global deno registry /!\
// in you deps.ts
export * as tstait from 'https://raw.githubusercontent.com/lsagetlethias/tstrait/master/mod.ts';

// in your main.ts
import { tstrait } from './mod.ts';

const { Trait, Use } = tstrait;
```

# Usage
## Basic
At first, you need to create your trait. Becasue traits are not a language feature by default, you need to make you trait extends the `Trait` class to have some control in your types (in TypeScript only). Extending is not a problem because a trait cannot extends another class or implementing another interface. A trait can only use another trait.

```ts
class MyTrait extends Trait {
    // a trait doesn't need a constructor so you can skip it or even make your class abstract
    public something() {}
}
```

Then you will need the `@Use` decorator to apply your trait on your class. For the same reasons, the `use` keyword doesn't exists in JS/TS so an annotation should do the job instead.
```ts
@Use(MyTrait)
class Foo {}

const Bar = Use(MyTrait)(class Bar {}); // will be fully typed
```

At this point, any `Foo` instance will have a `something()` method for the trait used.

### Regarding traits on Abstract Classes
Due to typings issues with abstract, abstract classes cannot be traited with decorators. Only straight call of `Use` function can works by emulating a fake public constructor on the abstract class with cast.

e.g.
```ts
import { Use, Ctor } from '@lsagetlethias/tstrait';
class MyTrait {}

@Use(MyTrait) // Argument of type 'typeof Foo' is not assignable to parameter of type 'Ctor'. Cannot assign an abstract constructor type to a non-abstract constructor type. ts(2345)
abstract class Foo {}

abstract class _Bar {}
const Bar = Use(MyTrait)(_Bar as Ctor<_Bar>); // ok
```

## Advanced
If you need to, you can use as many trait as you want. In this case, the `@Use` will takes an array of trait as single parameter:
```ts
@Use(Trait1, Trait2, Trait3 /* ... and so on */)
class Foo {}
```
In this case, Traits will be applied in array order, from left to right.

Sometimes, you will also need to configure properly how your trait is applied or handle collision between multiple traits:
```ts
@Use(Trait1, Trait2, {
    as: { 'Trait1.method': 'fooBarFunction' } // The "method" from Trait1 will be aliased "fooBarFunction" before being applied to Foo class
})
class Foo {}

(new Foo()).method(); // KO ; doesn't exists on Foo
(new Foo()).fooBarFunction(); // ok
```

## Config
### As

With `as`, you can alias a member and/or change its scope (*scopes are not yet handled*).  
Alias must be seen like this: `alias "Trait.member" as "scope newName"`.

e.g.
```ts
@Use(Trait1, {
    as: { 'Trait1.method': 'fooBarFunction' } // Alias "Trait1.method" as "fooBarFunction" when used in Foo class
})
class Foo {}

(new Foo()).method(); // KO ; doesn't exists on Foo
(new Foo()).fooBarFunction(); // ok
```

### InsteadOf

With `insteadof`, you can solve collision between similar Traits.
InsteadOf must be seen like this: `use "Trait1.method" instead of what's found in "[Trait2, Trait3, ...]" with the same method name`

e.g.
```ts
class Trait1 extends Trait {
    public foo() {
        console.log('A');
    }
}
class Trait2 extends Trait {
    public foo() {
        console.log('B');
    }
}

@Use(Trait1, Trait2, {
    insteadOf: { 'Trait1.foo': [Trait2] } // Use Trait1.foo instead of the same method in Trait2
})
class Foo {}

(new Foo()).foo(); // will log "A" instead of "B"
```

---

# Example
You can run the example with the command `yarn start` (or `npm run start`)
See [example file](./example.ts) 😀


# License
[MIT](./LICENSE)
