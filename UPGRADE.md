## from `@bios/tstrait` to `@lsagetlethias/tstrait`
- `Use` decorator accept now a list of argument instead of an array when using multiple traits or config
```ts
const conf: TraitConfig = {}

// then
@Use(Trait1)
@Use(Trait2, conf)
@Use([Trait1, Trait2, conf])

// now
@Use(Trait1)
@Use(Trait2, conf)
@Use(Trait1, Trait2, conf)
```

- TypeScript >=4.1 is strongly recommended
- `TraitConfig` is now strongly typed depending on used trait
- `TraitsRegister` is available to be augmented for Trait to be reconized in config autocomplete (optional)