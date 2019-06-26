//#region Helper types
type Ctor<T = Trait> = new (...args: any[]) => T;

/**
 * Fuse multiple class instance with the first one. The final constructor will always be from the first type.
 */
type MultipleClassInstance<
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

/**
 * Combine multiple trait to a class. (with instance properties and static properties)
 */
type CombinedClass<
    Class extends Ctor,
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
> = MultipleClassInstance<Class, T1, T2, T3, T4, T5, T6, T7, T8, T9, T10> &
    Class &
    T1 &
    T2 &
    T3 &
    T4 &
    T5 &
    T6 &
    T7 &
    T8 &
    T9 &
    T10;

/**
 * The annotion return decorator function.
 */
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

// WIP
// "OldName" fetch the name to change as string literal for each "As" configured
// "NewName" fetch the name to use as string literal for each "As" configured
// "Change" build a new type object with a prop/method name replacement
// tslint:disable-next-line:class-name
interface As__WIP<T extends typeof Trait, STATIC extends boolean = false> {
    [NAME: string]: {
        encapsulation?: 'public' | 'private' | 'protected';
        name: STATIC extends true ? keyof Omit<T, 'prototype'> : STATIC extends false ? keyof InstanceType<T> : never;
        newName: string;
    };
}
type OldName<T> = T extends { as: { [P: string]: { name: infer U } } } ? (U extends string ? U : never) : never;
type NewName<T> = T extends { as: { [P: string]: { newName: infer U } } } ? (U extends string ? U : never) : never;
type Change<T, CONF> = Omit<T, OldName<CONF>> & { [K in NewName<CONF>]: T[OldName<CONF>] };

interface As {
    [NAME: string]: string;
}

interface InsteadOf {
    [NAME: string]: Array<typeof Trait>;
}

export interface TraitConfig {
    insteadOf?: InsteadOf;
    as?: As;
}

//#endregion

/**
 * Should be used with {{Use}}
 */
export class Trait {
    private static __TRAITED;
}

export type TraitMemberSelector = string;

/**
 * Produce a token depending of the property/method selected.
 * e.g.
 * ```ts
 *  class Trait {
 *      public static STATIC_METHOD; // Will produce this token: `Trait::STATIC_METHOD`
 *      public instanceProp; // Will produce this token: `Trait.instanceProp`
 *  }
 * ```
 *
 * @param trait The trait in which the member name will be selected
 * @param name  The member name itself. Intellisense will provide you a correct list to avoid mistakes
 * @param staticMember If the member to select is static.
 */
export function traitSelector<
    T extends typeof Trait,
    NAME extends STATIC extends true ? keyof Omit<T, 'prototype'> : keyof InstanceType<T>,
    STATIC extends boolean = false
>(trait: T, name: NAME, staticMember?: STATIC): TraitMemberSelector {
    const traitName = trait.name;
    if (staticMember) {
        if (((name as unknown) as string) in trait) return `${traitName}::${name}`;
        throw new Error(
            `Error on TraitSelector. Static member "${name}" was not found in trait "${traitName}", or is not instanciated, or is not public.`,
        );
    }

    if (((name as unknown) as string) in trait.prototype) return `${traitName}.${name}`;
    throw new Error(`Error on TraitSelector. Member "${name}" was not found in trait "${traitName}" or is not public.`);
}

type Scope = 'public' | 'protected' | 'private';

interface AsRule {
    rule: 'as';
    klass: string;
    oldName: string;
    newName: string;
    isStatic: boolean;
    scope: Scope;
}

interface InsteadOfRule {
    rule: 'insteadof';
    klassFrom: string;
    klassTo: string[];
    name: string;
    isStatic: boolean;
}
type TraitRules = Array<AsRule | InsteadOfRule>;

const SCOPES = ['public', 'protected', 'private'];
const NAME_REGEX = /^([a-zA-Z_]\w*)*$/i;
function isScope(scope: string): scope is Scope {
    return SCOPES.includes(scope);
}

/**
 * Validate and parse the TraitConfig.
 *
 * @internal
 */
function traitConfigParser(config: TraitConfig, traits: Array<typeof Trait>, target: Ctor) {
    const ret: TraitRules = [];

    function selectorParser(selector: TraitMemberSelector): [string, string, boolean] {
        const isStatic = selector.includes('::');
        const parts = selector.split(isStatic ? '::' : '.');

        if (parts.length !== 2) {
            throw new Error(
                `The selector "${selector}" is malformed and should be either "<class>.<propOrMethod>" or "<class>::<staticPropOrMethod>".`,
            );
        }

        const [klass, name] = parts;
        const t = traits.filter(trait => trait.name === klass)[0];
        if (isStatic && !t[name]) {
            throw new Error(
                `In selector "${selector}", the static property or method "${name}" was not found on the trait "${klass}".`,
            );
        } else if (!isStatic && !t.prototype[name]) {
            throw new Error(
                `In selector "${selector}", the property or method "${name}" was not found on the trait "${klass}" prototype.`,
            );
        }

        return [klass, name, isStatic];
    }

    function changeAsParser(changeAs: string): [Scope, string] {
        const parts = changeAs.split(' ');
        let scope: Scope = null;
        const part = parts[0];
        let name = parts[1];
        if (parts.length === 1) {
            // if only one part is found, can be a scope or a name
            if (isScope(part)) {
                scope = part;
                name = null;
            } else {
                name = part;
            }
        } else if (parts.length === 2) {
            // if two parts are found, will be `<scope> <name>`
            if (!isScope(part)) {
                throw new Error(
                    `In the "as"-part "${changeAs}", the scope have to be one of these: ${SCOPES.join(', ')}`,
                );
            }
            scope = part;
        } else {
            throw new Error(
                `The "as"-part "${changeAs}" is not valid and should be like "<scope> <name>", or "<scope>", or "<name>" instead. (e.g. "public myProp")`,
            );
        }

        if (name !== null && !NAME_REGEX.test(name)) {
            throw new Error(
                `In the "as"-part "${changeAs}", the name "${name}" is not a valid property not method name. It should respect the following regex: "${NAME_REGEX}"`,
            );
        }

        return [scope, name];
    }

    // handle 'InsteadOf'
    const insteadOf = config.insteadOf || {};
    for (const [selector, ioTraits] of Object.entries(insteadOf)) {
        const [klassFrom, name, isStatic] = selectorParser(selector);

        ret.push({
            isStatic,
            klassFrom,
            name,
            klassTo: ioTraits.map(t => t.name),
            rule: 'insteadof',
        });
    }

    // handle 'As'
    const as = config.as || {};
    for (const [selector, changeAs] of Object.entries(as)) {
        const [klass, oldName, isStatic] = selectorParser(selector);
        const [scope, newName] = changeAsParser(changeAs);

        if (newName === null) continue; // WIP Handle scope

        const traitForName = traits.filter(t => t.name === klass)[0];
        if (isStatic) {
            if (typeof traitForName[newName] !== 'undefined') {
                throw new Error(
                    `Collision on "as" trait rule. "${klass}.${newName}" (static) already exists and can't be overlap.`,
                );
            } else if (typeof target[newName] !== 'undefined') {
                throw new Error(
                    `Collision on "as" trait rule. "${
                        target.name
                    }.${newName}" (static) already exists and can't be overlap.`,
                );
            }
        } else {
            if (typeof traitForName.prototype[newName] !== 'undefined') {
                throw new Error(
                    `Collision on "as" trait rule. "${klass}.${newName}" already exists and can't be overlap.`,
                );
            } else if (typeof target.prototype[newName] !== 'undefined') {
                throw new Error(
                    `Collision on "as" trait rule. "${target.name}.${newName}" already exists and can't be overlap.`,
                );
            }
        }

        ret.push({
            isStatic,
            klass,
            newName,
            oldName,
            scope,
            rule: 'as',
        });
    }

    return ret;
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
export function Use<T1 extends typeof Trait>(traits: [T1, TraitConfig?]): UseReturnType<T1>;
/**
 * Implements the "use" keyword from PHP with two `Trait` and with an optionnal config.
 *
 * @param traits A list of traits followed by a trait config at the last element.
 * @returns The class "traited"
 *
 * @annotation
 */
export function Use<T1 extends typeof Trait, T2 extends typeof Trait>(
    traits: [T1, T2, TraitConfig?],
): UseReturnType<T1, T2>;
/**
 * Implements the "use" keyword from PHP with three `Trait` and with an optionnal config.
 *
 * @param traits A list of traits followed by a trait config at the last element.
 * @returns The class "traited"
 *
 * @annotation
 */
export function Use<T1 extends typeof Trait, T2 extends typeof Trait, T3 extends typeof Trait>(
    traits: [T1, T2, T3, TraitConfig?],
): UseReturnType<T1, T2, T3>;
/**
 * Implements the "use" keyword from PHP with four `Trait` and with an optionnal config.
 *
 * @param traits A list of traits followed by a trait config at the last element.
 * @returns The class "traited"
 *
 * @annotation
 */
export function Use<T1 extends typeof Trait, T2 extends typeof Trait, T3 extends typeof Trait, T4 extends typeof Trait>(
    traits: [T1, T2, T3, T4, TraitConfig?],
): UseReturnType<T1, T2, T3, T4>;
/**
 * Implements the "use" keyword from PHP with five `Trait` and with an optionnal config.
 *
 * @param traits A list of traits followed by a trait config at the last element.
 * @returns The class "traited"
 *
 * @annotation
 */
export function Use<
    T1 extends typeof Trait,
    T2 extends typeof Trait,
    T3 extends typeof Trait,
    T4 extends typeof Trait,
    T5 extends typeof Trait
>(traits: [T1, T2, T3, T4, T5, TraitConfig?]): UseReturnType<T1, T2, T3, T4, T5>;
/**
 * Implements the "use" keyword from PHP with six `Trait` and with an optionnal config.
 *
 * @param traits A list of traits followed by a trait config at the last element.
 * @returns The class "traited"
 *
 * @annotation
 */
export function Use<
    T1 extends typeof Trait,
    T2 extends typeof Trait,
    T3 extends typeof Trait,
    T4 extends typeof Trait,
    T5 extends typeof Trait,
    T6 extends typeof Trait
>(traits: [T1, T2, T3, T4, T5, T6, TraitConfig?]): UseReturnType<T1, T2, T3, T4, T5, T6>;
/**
 * Implements the "use" keyword from PHP with seven `Trait` and with an optionnal config.
 *
 * @param traits A list of traits followed by a trait config at the last element.
 * @returns The class "traited"
 *
 * @annotation
 */
export function Use<
    T1 extends typeof Trait,
    T2 extends typeof Trait,
    T3 extends typeof Trait,
    T4 extends typeof Trait,
    T5 extends typeof Trait,
    T6 extends typeof Trait,
    T7 extends typeof Trait
>(traits: [T1, T2, T3, T4, T5, T6, T7, TraitConfig?]): UseReturnType<T1, T2, T3, T4, T5, T6, T7>;
/**
 * Implements the "use" keyword from PHP with eight `Trait` and with an optionnal config.
 *
 * @param traits A list of traits followed by a trait config at the last element.
 * @returns The class "traited"
 *
 * @annotation
 */
export function Use<
    T1 extends typeof Trait,
    T2 extends typeof Trait,
    T3 extends typeof Trait,
    T4 extends typeof Trait,
    T5 extends typeof Trait,
    T6 extends typeof Trait,
    T7 extends typeof Trait,
    T8 extends typeof Trait
>(traits: [T1, T2, T3, T4, T5, T6, T7, T8, TraitConfig?]): UseReturnType<T1, T2, T3, T4, T5, T6, T7, T8>;
/**
 * Implements the "use" keyword from PHP with nine `Trait` and with an optionnal config.
 *
 * @param traits A list of traits followed by a trait config at the last element.
 * @returns The class "traited"
 *
 * @annotation
 */
export function Use<
    T1 extends typeof Trait,
    T2 extends typeof Trait,
    T3 extends typeof Trait,
    T4 extends typeof Trait,
    T5 extends typeof Trait,
    T6 extends typeof Trait,
    T7 extends typeof Trait,
    T8 extends typeof Trait,
    T9 extends typeof Trait
>(traits: [T1, T2, T3, T4, T5, T6, T7, T8, T9, TraitConfig?]): UseReturnType<T1, T2, T3, T4, T5, T6, T7, T8, T9>;
/**
 * Implements the "use" keyword from PHP with ten `Trait` and with an optionnal config.
 *
 * @param traits A list of traits followed by a trait config at the last element.
 * @returns The class "traited"
 *
 * @annotation
 */
export function Use<
    T1 extends typeof Trait,
    T2 extends typeof Trait,
    T3 extends typeof Trait,
    T4 extends typeof Trait,
    T5 extends typeof Trait,
    T6 extends typeof Trait,
    T7 extends typeof Trait,
    T8 extends typeof Trait,
    T9 extends typeof Trait,
    T10 extends typeof Trait
>(
    traits: [T1, T2, T3, T4, T5, T6, T7, T8, T9, T10, TraitConfig?],
): UseReturnType<T1, T2, T3, T4, T5, T6, T7, T8, T9, T10>;
//#endregion
/**
 * Implements the "use" keyword from PHP with a `Trait`.
 *
 * @param traits The trait implementation to use or an array of trais followed by a trait config at the last element.
 * @returns The class "traited"
 *
 * @annotation
 */
export function Use<T extends typeof Trait>(traits: T | Array<T | TraitConfig>) {
    return <Class extends Ctor>(clazz: Class) => {
        if (!Array.isArray(traits)) {
            const defaultConf: TraitConfig = {};
            traits = [traits, defaultConf];
        }
        const config = traitConfigParser(traits.pop() as TraitConfig, traits as T[], clazz);

        const doNotUse: { [className: string]: Array<[string, boolean]> } = {}; // className [ [prop, isStatic] ]
        const aliases: { [className: string]: Array<[string, string, boolean]> } = {}; // className [ [prop, alias, isStatic] ]

        for (const rule of config) {
            if (rule.rule === 'insteadof') {
                for (const to of rule.klassTo) {
                    if (!doNotUse[to]) {
                        doNotUse[to] = [];
                    }
                    doNotUse[to].push([rule.name, rule.isStatic]);
                }
            } else {
                // TODO: handle scope
                if (!aliases[rule.klass]) {
                    aliases[rule.klass] = [];
                }
                aliases[rule.klass].push([rule.oldName, rule.newName, rule.isStatic]);
            }
        }
        for (const trait of traits as T[]) {
            const filters: RegExp[] = [copyProperties.DEFAULT_FILTER];
            const filtersStatic: RegExp[] = [copyProperties.DEFAULT_FILTER];
            const dnu = doNotUse[trait.name] || [];

            for (const [name, isStatic] of dnu) {
                (isStatic ? filtersStatic : filters).push(new RegExp(name));
            }

            const traitClone = {};
            const traitProtoClone = {};
            copyProperties(traitClone, trait);
            copyProperties(traitProtoClone, trait.prototype);

            const al = aliases[trait.name] || [];
            for (const [member, alias, isStatic] of al) {
                if (isStatic) {
                    traitClone[alias] = traitClone[member];
                    delete traitClone[member];
                } else {
                    traitProtoClone[alias] = traitProtoClone[member];
                    delete traitProtoClone[member];
                }
            }

            copyProperties(clazz, al.length ? traitClone : trait, filtersStatic);
            copyProperties(clazz.prototype, al.length ? traitProtoClone : trait.prototype, filters);
        }

        return clazz as CombinedClass<Class, T>;
    };
}

/**
 * Copy param from a `source` into the `target`.
 *
 * Used to properly mix class with prototypes and statics members.
 *
 * @param filters An array of regexp to omit some members to be copied. (/(prototype|name|constructor)/ by default).
 */
export function copyProperties<T1, T2>(target: T1, source: T2, filters = [copyProperties.DEFAULT_FILTER]) {
    const ownPropertyNames = Object.getOwnPropertyNames(source);

    ownPropertyNames
        .filter(key => filters.every(f => !f.test(key)) && typeof target[key] === 'undefined')
        .forEach(key => {
            const desc = Object.getOwnPropertyDescriptor(source, key);

            try {
                Object.defineProperty(target, key, desc);
            } catch {
                /* catch for IE11 - no op */
            }
        });
}
copyProperties.DEFAULT_FILTER = /(prototype|name|constructor)/;
