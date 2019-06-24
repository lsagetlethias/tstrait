//#region Helper types
type Ctor<T = Trait> = new (...args: any[]) => T;
type MultipleClass<
    A extends Ctor,
    B extends Ctor,
    C extends Ctor,
    D extends Ctor,
    E extends Ctor,
    F extends Ctor,
    G extends Ctor,
    H extends Ctor,
    I extends Ctor,
    J extends Ctor,
    K extends Ctor
> = new (...args: any[]) => InstanceType<A> &
    InstanceType<B> &
    InstanceType<C> &
    InstanceType<D> &
    InstanceType<E> &
    InstanceType<F> &
    InstanceType<G> &
    InstanceType<H> &
    InstanceType<I> &
    InstanceType<J> &
    InstanceType<K>;
type CombinedClass<
    A extends Ctor,
    B extends Ctor,
    C extends Ctor = Ctor,
    D extends Ctor = Ctor,
    E extends Ctor = Ctor,
    F extends Ctor = Ctor,
    G extends Ctor = Ctor,
    H extends Ctor = Ctor,
    I extends Ctor = Ctor,
    J extends Ctor = Ctor,
    K extends Ctor = Ctor
> = MultipleClass<A, B, C, D, E, F, G, H, I, J, K> & A & B & C & D & E & F & G & H & I & J & K;
type UseReturnType<
    T1 extends typeof Trait,
    T2 extends typeof Trait = typeof Trait,
    T3 extends typeof Trait = typeof Trait,
    T4 extends typeof Trait = typeof Trait,
    T5 extends typeof Trait = typeof Trait,
    T6 extends typeof Trait = typeof Trait,
    T7 extends typeof Trait = typeof Trait,
    T8 extends typeof Trait = typeof Trait,
    T9 extends typeof Trait = typeof Trait,
    T10 extends typeof Trait = typeof Trait
> = <C extends Ctor>(clazz: C) => CombinedClass<C, T1, T2, T3, T4, T5, T6, T7, T8, T9, T10>;
//#endregion

/**
 * Should be used with {{Use}}
 */
export class Trait {
    private static __TRAITED;
}

export type TraitPropSelector = string;

export function traitSelector<
    T extends typeof Trait,
    NAME extends STATIC extends true ? keyof Omit<T, 'prototype'> : keyof InstanceType<T>,
    STATIC extends boolean = false
>(trait: T, name: NAME, staticProp?: STATIC): TraitPropSelector {
    const traitName = trait.name;
    if (staticProp) {
        if (((name as unknown) as string) in trait) return `${traitName}::${name}`;
        throw new Error(
            `Error on TraitSelector. Static member "${name}" was not found in trait ${traitName} or is not public.`,
        );
    }

    if (((name as unknown) as string) in trait.prototype) return `${traitName}.${name}`;
    throw new Error(`Error on TraitSelector. Member "${name}" was not found in trait ${traitName} or is not public.`);
}

interface As<T extends typeof Trait, STATIC extends boolean = false> {
    [NAME: string]: {
        encapsulation?: 'public' | 'private' | 'protected';
        name: STATIC extends true ? keyof Omit<T, 'prototype'> : STATIC extends false ? keyof InstanceType<T> : never;
        newName: string;
    };
}

interface InsteadOf {
    [NAME: string]: TraitPropSelector;
}

export interface TraitConfig<T extends typeof Trait = any, STATIC extends boolean = false> {
    insteadOf?: InsteadOf;
    as?: As<T, STATIC>;
}

//#region Variant signatures
/**
 * Implements the "use" keyword from PHP with one `Trait` but without config.
 *
 * @param traits The Trait implementation to use.
 * @returns The class "traited"
 *
 * @annotation
 */
export function Use<T extends typeof Trait>(traits: T): UseReturnType<T>;
/**
 * Implements the "use" keyword from PHP with one `Trait` and with an optionnal config.
 *
 * @param traits A list of traits followed by a trait config at the last element.
 * @returns The class "traited"
 *
 * @annotation
 */
export function Use<C extends TraitConfig<any, STATIC>, T1 extends typeof Trait, STATIC extends boolean = false>(
    traits: [T1, C?],
): UseReturnType<T1>;
/**
 * Implements the "use" keyword from PHP with two `Trait` and with an optionnal config.
 *
 * @param traits A list of traits followed by a trait config at the last element.
 * @returns The class "traited"
 *
 * @annotation
 */
export function Use<
    C extends TraitConfig<any, STATIC>,
    T1 extends typeof Trait,
    T2 extends typeof Trait,
    STATIC extends boolean = false
>(traits: [T1, T2, C?]): UseReturnType<T1, T2>;
/**
 * Implements the "use" keyword from PHP with three `Trait` and with an optionnal config.
 *
 * @param traits A list of traits followed by a trait config at the last element.
 * @returns The class "traited"
 *
 * @annotation
 */
export function Use<
    C extends TraitConfig<any, STATIC>,
    T1 extends typeof Trait,
    T2 extends typeof Trait,
    T3 extends typeof Trait,
    STATIC extends boolean = false
>(traits: [T1, T2, T3, C?]): UseReturnType<T1, T2, T3>;
/**
 * Implements the "use" keyword from PHP with four `Trait` and with an optionnal config.
 *
 * @param traits A list of traits followed by a trait config at the last element.
 * @returns The class "traited"
 *
 * @annotation
 */
export function Use<
    C extends TraitConfig<any, STATIC>,
    T1 extends typeof Trait,
    T2 extends typeof Trait,
    T3 extends typeof Trait,
    T4 extends typeof Trait,
    STATIC extends boolean = false
>(traits: [T1, T2, T3, T4, C?]): UseReturnType<T1, T2, T3, T4>;
/**
 * Implements the "use" keyword from PHP with five `Trait` and with an optionnal config.
 *
 * @param traits A list of traits followed by a trait config at the last element.
 * @returns The class "traited"
 *
 * @annotation
 */
export function Use<
    C extends TraitConfig<any, STATIC>,
    T1 extends typeof Trait,
    T2 extends typeof Trait,
    T3 extends typeof Trait,
    T4 extends typeof Trait,
    T5 extends typeof Trait,
    STATIC extends boolean = false
>(traits: [T1, T2, T3, T4, T5, C?]): UseReturnType<T1, T2, T3, T4, T5>;
/**
 * Implements the "use" keyword from PHP with six `Trait` and with an optionnal config.
 *
 * @param traits A list of traits followed by a trait config at the last element.
 * @returns The class "traited"
 *
 * @annotation
 */
export function Use<
    C extends TraitConfig<any, STATIC>,
    T1 extends typeof Trait,
    T2 extends typeof Trait,
    T3 extends typeof Trait,
    T4 extends typeof Trait,
    T5 extends typeof Trait,
    T6 extends typeof Trait,
    STATIC extends boolean = false
>(traits: [T1, T2, T3, T4, T5, T6, C?]): UseReturnType<T1, T2, T3, T4, T5, T6>;
/**
 * Implements the "use" keyword from PHP with seven `Trait` and with an optionnal config.
 *
 * @param traits A list of traits followed by a trait config at the last element.
 * @returns The class "traited"
 *
 * @annotation
 */
export function Use<
    C extends TraitConfig<any, STATIC>,
    T1 extends typeof Trait,
    T2 extends typeof Trait,
    T3 extends typeof Trait,
    T4 extends typeof Trait,
    T5 extends typeof Trait,
    T6 extends typeof Trait,
    T7 extends typeof Trait,
    STATIC extends boolean = false
>(traits: [T1, T2, T3, T4, T5, T6, T7, C?]): UseReturnType<T1, T2, T3, T4, T5, T6, T7>;
/**
 * Implements the "use" keyword from PHP with eight `Trait` and with an optionnal config.
 *
 * @param traits A list of traits followed by a trait config at the last element.
 * @returns The class "traited"
 *
 * @annotation
 */
export function Use<
    C extends TraitConfig<any, STATIC>,
    T1 extends typeof Trait,
    T2 extends typeof Trait,
    T3 extends typeof Trait,
    T4 extends typeof Trait,
    T5 extends typeof Trait,
    T6 extends typeof Trait,
    T7 extends typeof Trait,
    T8 extends typeof Trait,
    STATIC extends boolean = false
>(traits: [T1, T2, T3, T4, T5, T6, T7, T8, C?]): UseReturnType<T1, T2, T3, T4, T5, T6, T7, T8>;
/**
 * Implements the "use" keyword from PHP with nine `Trait` and with an optionnal config.
 *
 * @param traits A list of traits followed by a trait config at the last element.
 * @returns The class "traited"
 *
 * @annotation
 */
export function Use<
    C extends TraitConfig<any, STATIC>,
    T1 extends typeof Trait,
    T2 extends typeof Trait,
    T3 extends typeof Trait,
    T4 extends typeof Trait,
    T5 extends typeof Trait,
    T6 extends typeof Trait,
    T7 extends typeof Trait,
    T8 extends typeof Trait,
    T9 extends typeof Trait,
    STATIC extends boolean = false
>(traits: [T1, T2, T3, T4, T5, T6, T7, T8, T9, C?]): UseReturnType<T1, T2, T3, T4, T5, T6, T7, T8, T9>;
/**
 * Implements the "use" keyword from PHP with ten `Trait` and with an optionnal config.
 *
 * @param traits A list of traits followed by a trait config at the last element.
 * @returns The class "traited"
 *
 * @annotation
 */
export function Use<
    C extends TraitConfig<any, STATIC>,
    T1 extends typeof Trait,
    T2 extends typeof Trait,
    T3 extends typeof Trait,
    T4 extends typeof Trait,
    T5 extends typeof Trait,
    T6 extends typeof Trait,
    T7 extends typeof Trait,
    T8 extends typeof Trait,
    T9 extends typeof Trait,
    T10 extends typeof Trait,
    STATIC extends boolean = false
>(traits: [T1, T2, T3, T4, T5, T6, T7, T8, T9, T10, C?]): UseReturnType<T1, T2, T3, T4, T5, T6, T7, T8, T9, T10>;
//#endregion
/**
 * Implements the "use" keyword from PHP with a `Trait`.
 *
 * @param traits The trait implementation to use or an array of trais followed by a trait config at the last element.
 * @returns The class "traited"
 *
 * @annotation
 */
export function Use<C extends TraitConfig<any, STATIC>, T extends typeof Trait, STATIC extends boolean = false>(
    traits: T | Array<T | C>,
) {
    return <Class extends Ctor>(clazz: Class) => {
        if (!Array.isArray(traits)) {
            const defaultConf: any = {};
            traits = [traits, defaultConf];
        }
        const config = traits.pop() as C;

        for (const trait of traits as T[]) {
            copyProperties(clazz, trait);
            copyProperties(clazz.prototype, trait.prototype);
        }

        return clazz as CombinedClass<Class, T>;
    };
}

/**
 * Copy param from a `source` into the `target`.
 *
 * @param {T1} target
 * @param {T2} source
 */
export function copyProperties<T1, T2>(target: T1, source: T2) {
    const ownPropertyNames = Object.getOwnPropertyNames(source);

    ownPropertyNames
        .filter(key => !/(prototype|name|constructor)/.test(key))
        .forEach(key => {
            const desc = Object.getOwnPropertyDescriptor(source, key);

            try {
                Object.defineProperty(target, key, desc);
            } catch {
                /* catch for IE11 - no op */
            }
        });
}
