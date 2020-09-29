// #region Helper types
export type Ctor<T = Trait> = new (...args: any[]) => T;
type UnionToIntersection<U> = 
  (U extends any ? (k: U)=>void : never) extends ((k: infer I)=>void) ? I : never;

type InstanceTypeIntersection<I extends Ctor[]> = UnionToIntersection<InstanceType<I[number]>>;
type TupleToIntersection<T extends any[]> = UnionToIntersection<T[number]>;

/**
 * Fuse multiple class instance with the first one. The final constructor will always be from the first type.
 */
type MultipleClassInstance<T extends Ctor[]> = new (...args: any[]) => InstanceTypeIntersection<T>;

/**
 * Combine multiple trait to a class. (with instance properties and static properties)
 */
type CombinedClass<Class extends Ctor, T extends Array<typeof Trait>> = MultipleClassInstance<[Class, ...T]> & Class & TupleToIntersection<T>;

/**
 * The annotion return decorator function.
 */
type UseReturnType<T extends Array<typeof Trait>> = <C extends Ctor>(clazz: C) => CombinedClass<C, T>;

type _GetTraitName<T extends typeof Trait> = { [Name in keyof TraitsRegister]: TraitsRegister[Name] extends T ? T extends TraitsRegister[Name] ? Name : never : never}[keyof TraitsRegister];
type GetTraitName<T extends typeof Trait> = _GetTraitName<T> extends never ? string : _GetTraitName<T>;

/**
 * Scopes are WIP
 */
export type Scope = 'public' | 'protected' | 'private';
export type StringKeys<T> = { [K in keyof T]: K extends string ? K extends "prototype" ? never : K : never}[keyof T];
type StaticName<T extends typeof Trait, N extends GetTraitName<T> = GetTraitName<T>> = `${N}::${StringKeys<T>}`; // eslint-disable-line prettier/prettier
type InstanceName<T extends typeof Trait, N extends GetTraitName<T> = GetTraitName<T>> = `${N}.${StringKeys<InstanceType<T>>}`;
type Identifier<Traits extends Array<typeof Trait>> = Traits extends Array<infer T> ? T extends typeof Trait ? StaticName<T> | InstanceName<T> : never : never;

type As<Traits extends Array<typeof Trait>, V extends string = string> =
    Partial<Record<Identifier<Traits>, `${Scope} ${V}`>> // autocomplete "<class.prop>" and "<class.staticProp>" as key
    | Partial<Record<string, `${Scope} ${V}`>> // accept any other string as key as well
    | Partial<Record<string, `${Scope} `>>; // start autocomplete for optional scope

type InsteadOf<Traits extends Array<typeof Trait>, Ids extends Identifier<Traits> = Identifier<Traits>> = {
    [K in Ids]?: K extends `${infer N}${'::'|'.'}${infer _}` ? N extends keyof TraitsRegister ? Array<Exclude<Traits[number], TraitsRegister[N]>> : never : never // in string key, if a trait name is found, exclude corresponding Trait from "insteadof" possibilities to avoid redundancy
} | Partial<Record<string, Array<Traits[number]>>>; // accept any other string a key (case when Trait is not registered)

// #endregion

/**
 * Should be used with {{Use}}
 */
export class Trait {
    private static __TRAITED: never;
}
/**
 * Register to augment to have proper autocomplete for Traits.
 * 
 * Usage:
 * ```typescript
 * class MyTrait extends Trait {}
 * 
 * declare module "@bios21/tstrait" {
 *  interface TraitsRegister {
 *    "MyTrait": typeof MyTrait,
 *  }
 * }
 * // "MyTrait" is now available for autocomplete in any TraitConfig
 * ```
 */
// eslint-disable-next-line @typescript-eslint/no-empty-interface
export interface TraitsRegister {}
export interface TraitConfig<Traits extends Array<typeof Trait>> {
    insteadOf?: InsteadOf<Traits>;
    as?: As<Traits>;
}

export function isTraitConfig<Traits extends Array<typeof Trait>>(obj: unknown): obj is TraitConfig<Traits> {
    return typeof obj === "object" && obj !== null && (
        ("insteadOf" in obj && 
            typeof (obj as TraitConfig<Traits>).insteadOf === "object")
        || ("as" in obj && 
            typeof (obj as TraitConfig<Traits>).as === "object")
    );
}

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
    STATIC extends boolean = false,
    N extends GetTraitName<T> = GetTraitName<T>,
>(trait: T, name: NAME, staticMember?: STATIC): `${N}${STATIC extends true ? "::" : "."}${NAME & string}` {
    const traitName = trait.name;
    if (staticMember) {
        if (((name as unknown) as string) in trait) return `${traitName}::${name}` as any;
        throw new Error(
            `Error on TraitSelector. Static member "${name}" was not found in trait "${traitName}", or is not instanciated, or is not public.`,
        );
    }

    if (((name as unknown) as string) in trait.prototype) return `${traitName}.${name}` as any;
    throw new Error(`Error on TraitSelector. Member "${name}" was not found in trait "${traitName}" or is not public.`);
}

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
function traitConfigParser<Traits extends Array<typeof Trait>, TC extends TraitConfig<Traits>>(config: TC, traits: Traits, target: Ctor) {
    const ret: TraitRules = [];

    function selectorParser(selector: string): [string, string, boolean] {
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

    function changeAsParser(changeAs: string): [scope: Scope, name: string | null] {
        const parts = changeAs.split(' ');
        let scope: Scope = null!;
        const part = parts[0];
        let name: string | null = parts[1];
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
    for (const [selector, ioTraits] of Object.entries(config.insteadOf ?? {}) as Array<[string, Traits]>) {
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
    for (const [selector, changeAs] of Object.entries(config.as ?? {}) as Array<[string, string]>) {
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

/**
 * Implements the "use" keyword from PHP with a `Trait`.
 *
 * @param traits The trait implementation to use or an array of trais followed by a trait config at the last element.
 * @returns The class "traited"
 *
 * @annotation
 */
export function Use<T extends Array<typeof Trait>>(...traits: [...trait: T]): UseReturnType<T>;
// eslint-disable-next-line no-redeclare
export function Use<T extends Array<typeof Trait>>(...traits: [...trait: T, traitConfig?: TraitConfig<T>]): UseReturnType<T>;
// eslint-disable-next-line no-redeclare
export function Use<T extends Array<typeof Trait>>(...traits: [...trait: T] | [...trait: T, traitConfig?: TraitConfig<T>]): UseReturnType<T> {
    return <Class extends Ctor>(clazz: Class) => {
        let traitConfig = traits.pop() as TraitConfig<T>;
        const restTraits = (traits as unknown as T);
        if (!isTraitConfig<T>(traitConfig)) {
            restTraits.push(traitConfig)
            traitConfig = {}
        }
        const traitRules = traitConfigParser(traitConfig, restTraits, clazz);

        const doNotUse: { [className: string]: Array<[string, boolean]> } = {}; // className [ [prop, isStatic] ]
        const aliases: { [className: string]: Array<[string, string, boolean]> } = {}; // className [ [prop, alias, isStatic] ]

        for (const rule of traitRules) {
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
        for (const trait of restTraits) {
            const filters = [copyProperties.DEFAULT_FILTER];
            const filtersStatic = [copyProperties.DEFAULT_FILTER];
            const dnu = doNotUse[trait.name] ?? [];

            for (const [name, isStatic] of dnu) {
                (isStatic ? filtersStatic : filters).push(new RegExp(name));
            }

            const traitClone = {};
            const traitProtoClone = {};
            copyProperties(traitClone, trait);
            copyProperties(traitProtoClone, trait.prototype);

            const al = aliases[trait.name] ?? [];
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
                Object.defineProperty(target, key, desc!);
            } catch {
                /* catch for IE11 - no op */
            }
        });
}
copyProperties.DEFAULT_FILTER = /(prototype|name|constructor)/;
