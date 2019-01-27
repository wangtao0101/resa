import * as React from 'react';
import * as Redux from 'redux';
import * as ReactRedux from 'react-redux';
import * as Saga from "redux-saga";

declare module 'resa' {

    export class Model<S = any> {
        protected models: any
        state: S;
        fulfilled(payload?: S | Partial<S>): S;
    }

    export function effect(name?: string , mn?: number) : MethodDecorator;

    export function reducer(pure?: boolean) : MethodDecorator;

    export function init<S = any>({ name, namespace, state }
        : { name?: string, namespace?: string, state: S}) : ClassDecorator;

    export function wapper(cb: IterableIterator<any>): Promise<any>;

    export interface Options {
        reducers?: Redux.ReducersMapObject;
        reduxDevToolOptions?: Object;
        errorHandle?: (error: Error) => void;
        middlewares?: Array<Redux.Middleware>;
    }

    export default function createResa(options?: Options): Resa<any>;

    export interface ModelMap<T extends Model>{
        [key: string]: T;
    }

    interface MapStateToProps<TStateProps, TOwnProps> {
        (models: ModelMap<any>, state: any, ownProps: TOwnProps): TStateProps;
    }

    interface MapStateToPropsFactory<TStateProps, TOwnProps> {
        (models: ModelMap<any>, initialState: any, ownProps: TOwnProps): MapStateToProps<TStateProps, TOwnProps>;
    }

    type MapStateToPropsParam<TStateProps, TOwnProps> = MapStateToPropsFactory<TStateProps, TOwnProps> | MapStateToProps<TStateProps, TOwnProps> | null | undefined;

    interface MapDispatchToPropsFunction<TDispatchProps, TOwnProps> {
        (models: ModelMap<any>, dispatch: ReactRedux.Dispatch<any>, ownProps: TOwnProps): TDispatchProps;
    }

    type MapDispatchToProps<TDispatchProps, TOwnProps> =
        MapDispatchToPropsFunction<TDispatchProps, TOwnProps> | TDispatchProps;

    interface MapDispatchToPropsFactory<TDispatchProps, TOwnProps> {
        (models: ModelMap<any>, dispatch: ReactRedux.Dispatch<any>, ownProps: TOwnProps): MapDispatchToProps<TDispatchProps, TOwnProps>;
    }

    type MapDispatchToPropsParam<TDispatchProps, TOwnProps> = MapDispatchToPropsFactory<TDispatchProps, TOwnProps> | MapDispatchToProps<TDispatchProps, TOwnProps>;

    type GetInstanceType<T> = T extends new (...args: any[]) => infer R ? R : any;

    type GetInstanceConditional<T> = T extends Model ? T : GetInstanceType<T>;

    type SubscribeType<T> = { [P in keyof T]: GetInstanceConditional<T[P]> };

    interface ModelType {
        new(...args: any[]): Model;
    }

    type Omit<T, K extends keyof T> = Pick<T, Exclude<keyof T, K>>

    interface InferableComponentEnhancerWithProps<TInjectedProps, TNeedsProps> {
        <P extends TInjectedProps>(
            component: React.ComponentType<P>
        ): React.ComponentClass<Omit<P, keyof TInjectedProps> & TNeedsProps> & {WrappedComponent: React.ComponentType<P>}
    }

    interface SubscribeModel {
        [key: string]: Model<any> | ModelType;
    }

    interface Subscribe {
        <T>(
            mapContainerToProps: T,
            dependences?: string[],
        ): InferableComponentEnhancerWithProps<SubscribeType<T>, {}>;
    }

    export const subscribe: Subscribe;

    /**
     * copy some code from react-redux
     * Connects a React component to a Redux store.
     *
     * - Without arguments, just wraps the component, without changing the behavior / props
     *
     * - If 2 params are passed (3rd param, mergeProps, is skipped), default behavior
     * is to override ownProps (as stated in the docs), so what remains is everything that's
     * not a state or dispatch prop
     *
     * - When 3rd param is passed, we don't know if ownProps propagate and whether they
     * should be valid component props, because it depends on mergeProps implementation.
     * As such, it is the user's responsibility to extend ownProps interface from state or
     * dispatch props or both when applicable
     *
     * @param mapStateToProps
     * @param mapDispatchToProps
     * @param mergeProps
     * @param options
     * @deprecated since version 4.0
     */
    export interface Connect {
        (): ReactRedux.InferableComponentEnhancer<ReactRedux.DispatchProp<any>>;

        /**
         * support mapDispatchToProps type of Array<string>
         */
        <TInjectedProps = {}, TDispatchProps = {}, TOwnProps = {}>(
            mapStateToProps: null | undefined,
            mapDispatchToProps: Array<string>,
        ): ReactRedux.InferableComponentEnhancerWithProps<TInjectedProps, {}>;

        <TInjectedProps = {}, TStateProps = {}, TDispatchProps = {}, TOwnProps = {}, State = {}>(
            mapStateToProps: MapStateToPropsParam<TStateProps, TOwnProps>,
            mapDispatchToProps: Array<string>,
        ): ReactRedux.InferableComponentEnhancerWithProps<TInjectedProps, {}>;

        <TInjectedProps = {}, no_state = {}, TDispatchProps = {}, TOwnProps = {}, TMergedProps = {}>(
            mapStateToProps: null | undefined,
            mapDispatchToProps: Array<string>,
            mergeProps: ReactRedux.MergeProps<undefined, TDispatchProps, TOwnProps, TMergedProps>,
        ): ReactRedux.InferableComponentEnhancerWithProps<TInjectedProps, {}>;

        <TInjectedProps = {}, TStateProps = {}, TDispatchProps = {}, TOwnProps = {}, TMergedProps = {}, State = {}>(
            mapStateToProps: MapStateToPropsParam<TStateProps, TOwnProps>,
            mapDispatchToProps: Array<string>,
            mergeProps: ReactRedux.MergeProps<TStateProps, TDispatchProps, TOwnProps, TMergedProps>,
        ): ReactRedux.InferableComponentEnhancerWithProps<TInjectedProps, {}>;

        <TInjectedProps = {}, no_state = {}, TDispatchProps = {}, TOwnProps = {}>(
            mapStateToProps: null | undefined,
            mapDispatchToProps: Array<string>,
            mergeProps: null | undefined,
            options: ReactRedux.Options<no_state, TOwnProps>
        ): ReactRedux.InferableComponentEnhancerWithProps<TInjectedProps, {}>;

        <TInjectedProps = {}, TStateProps = {}, TDispatchProps = {}, TOwnProps = {}, State = {}>(
            mapStateToProps: MapStateToPropsParam<TStateProps, TOwnProps>,
            mapDispatchToProps: Array<string>,
            mergeProps: null | undefined,
            options: ReactRedux.Options<TStateProps, TOwnProps>
        ): ReactRedux.InferableComponentEnhancerWithProps<TInjectedProps, {}>;

        <TInjectedProps = {}, TStateProps = {}, TDispatchProps = {}, TOwnProps = {}, TMergedProps = {}, State = {}>(
            mapStateToProps: MapStateToPropsParam<TStateProps, TOwnProps>,
            mapDispatchToProps: Array<string>,
            mergeProps: ReactRedux.MergeProps<TStateProps, TDispatchProps, TOwnProps, TMergedProps>,
            options: ReactRedux.Options<TStateProps, TOwnProps, TMergedProps>
        ): ReactRedux.InferableComponentEnhancerWithProps<TInjectedProps, {}>;


        <TStateProps = {}, no_dispatch = {}, TOwnProps = {}, State = {}>(
            mapStateToProps: MapStateToPropsParam<TStateProps, TOwnProps>
        ): ReactRedux.InferableComponentEnhancerWithProps<TStateProps & ReactRedux.DispatchProp<any>, TOwnProps>;

        <no_state = {}, TDispatchProps = {}, TOwnProps = {}>(
            mapStateToProps: null | undefined,
            mapDispatchToProps: MapDispatchToPropsParam<TDispatchProps, TOwnProps>
        ): ReactRedux.InferableComponentEnhancerWithProps<TDispatchProps, TOwnProps>;

        <TStateProps = {}, TDispatchProps = {}, TOwnProps = {}, State = {}>(
            mapStateToProps: MapStateToPropsParam<TStateProps, TOwnProps>,
            mapDispatchToProps: MapDispatchToPropsParam<TDispatchProps, TOwnProps>
        ): ReactRedux.InferableComponentEnhancerWithProps<TStateProps & TDispatchProps, TOwnProps>;

        <TStateProps = {}, no_dispatch = {}, TOwnProps = {}, TMergedProps = {}, State = {}>(
            mapStateToProps: MapStateToPropsParam<TStateProps, TOwnProps>,
            mapDispatchToProps: null | undefined,
            mergeProps: ReactRedux.MergeProps<TStateProps, undefined, TOwnProps, TMergedProps>,
        ): ReactRedux.InferableComponentEnhancerWithProps<TMergedProps, TOwnProps>;

        <no_state = {}, TDispatchProps = {}, TOwnProps = {}, TMergedProps = {}>(
            mapStateToProps: null | undefined,
            mapDispatchToProps: MapDispatchToPropsParam<TDispatchProps, TOwnProps>,
            mergeProps: ReactRedux.MergeProps<undefined, TDispatchProps, TOwnProps, TMergedProps>,
        ): ReactRedux.InferableComponentEnhancerWithProps<TMergedProps, TOwnProps>;

        <no_state = {}, no_dispatch = {}, TOwnProps = {}, TMergedProps = {}>(
            mapStateToProps: null | undefined,
            mapDispatchToProps: null | undefined,
            mergeProps: ReactRedux.MergeProps<undefined, undefined, TOwnProps, TMergedProps>,
        ): ReactRedux.InferableComponentEnhancerWithProps<TMergedProps, TOwnProps>;

        <TStateProps = {}, TDispatchProps = {}, TOwnProps = {}, TMergedProps = {}, State = {}>(
            mapStateToProps: MapStateToPropsParam<TStateProps, TOwnProps>,
            mapDispatchToProps: MapDispatchToPropsParam<TDispatchProps, TOwnProps>,
            mergeProps: ReactRedux.MergeProps<TStateProps, TDispatchProps, TOwnProps, TMergedProps>,
        ): ReactRedux.InferableComponentEnhancerWithProps<TMergedProps, TOwnProps>;

        <TStateProps = {}, no_dispatch = {}, TOwnProps = {}, State = {}>(
            mapStateToProps: MapStateToPropsParam<TStateProps, TOwnProps>,
            mapDispatchToProps: null | undefined,
            mergeProps: null | undefined,
            options: ReactRedux.Options<TStateProps, TOwnProps>
        ): ReactRedux.InferableComponentEnhancerWithProps<ReactRedux.DispatchProp<any> & TStateProps, TOwnProps>;

        <no_state = {}, TDispatchProps = {}, TOwnProps = {}>(
            mapStateToProps: null | undefined,
            mapDispatchToProps: MapDispatchToPropsParam<TDispatchProps, TOwnProps>,
            mergeProps: null | undefined,
            options: ReactRedux.Options<no_state, TOwnProps>
        ): ReactRedux.InferableComponentEnhancerWithProps<TDispatchProps, TOwnProps>;

        <TStateProps = {}, TDispatchProps = {}, TOwnProps = {}, State = {}>(
            mapStateToProps: MapStateToPropsParam<TStateProps, TOwnProps>,
            mapDispatchToProps: MapDispatchToPropsParam<TDispatchProps, TOwnProps>,
            mergeProps: null | undefined,
            options: ReactRedux.Options<TStateProps, TOwnProps>
        ): ReactRedux.InferableComponentEnhancerWithProps<TStateProps & TDispatchProps, TOwnProps>;

        <TStateProps = {}, TDispatchProps = {}, TOwnProps = {}, TMergedProps = {}, State = {}>(
            mapStateToProps: MapStateToPropsParam<TStateProps, TOwnProps>,
            mapDispatchToProps: MapDispatchToPropsParam<TDispatchProps, TOwnProps>,
            mergeProps: ReactRedux.MergeProps<TStateProps, TDispatchProps, TOwnProps, TMergedProps>,
            options: ReactRedux.Options<TStateProps, TOwnProps, TMergedProps>
        ): ReactRedux.InferableComponentEnhancerWithProps<TMergedProps, TOwnProps>;
    }

    /**
     * @deprecated since version 4.0
     */
    export const connect: Connect;

    export interface Resa<T> {
        store: Redux.Store<T>;
        runSaga<A, S>(iterator: Iterator<any>): Saga.Task;
        models: any;
        register(model: any): void;
        /**
         * @deprecated since version 4.0
         */
        registerModel(model: any): void;
        /**
         * @deprecated since version 4.0
         */
        unRegisterModel(model: any): void;
    }

    export interface ProviderProps {
        resa?: Resa<any>;
        children?: React.ReactNode;
    }

    export class Provider extends React.Component<ProviderProps, {}> { }

    interface CombinedModel extends Model {}

    /**
     * @deprecated since version 4.0
     */
    export function combineModel(name: string, models: Array<Model>, state?: any): CombinedModel;
}
