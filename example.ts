// tslint:disable:no-shadowed-variable
import { Trait, TraitConfig, traitSelector, Use } from './trait';

class GetImageTrait extends Trait {
    public static INSTANCE = new Image();
    public getImage(p1?: string, p2 = true): Blob {
        // i.e. make a request to retrieve an image
        return null;
    }
}

class ComputeTrait extends Trait {
    public compute() {
        // i.e. compute anything
    }
}

@Use(GetImageTrait)
class Controller {
    public that = (this as unknown) as Controller & GetImageTrait;
    public foo() {
        this.that.getImage();
    }
}

const controller = new Controller();
controller.foo();

const config = {
    as: {
        [traitSelector(GetImageTrait, 'INSTANCE', true)]: {
            name: 'getImage',
            newName: 'III',
        },
    },
} as const;
const Controller2 = Use([GetImageTrait, ComputeTrait, config])(
    class Controller2 {
        public foo(this: Controller2 & GetImageTrait) {
            this.getImage();
        }
    },
);

const controller2 = new Controller2();
controller2.foo();

type OldName<T> = T extends { as: { [P: string]: { name: infer U } } } ? (U extends string ? U : never) : never;
type NewName<T> = T extends { as: { [P: string]: { newName: infer U } } } ? (U extends string ? U : never) : never;

type Change<T, CONF> = Omit<T, OldName<CONF>> & { [K in NewName<CONF>]: T[OldName<CONF>] };
type C = typeof config;
type T = Change<GetImageTrait, typeof config>;


const val: OldName<C> = 'getImage';

const az: T = {

};
