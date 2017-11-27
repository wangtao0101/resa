export const COMBINED_RESA_MODEL = '@@__COMBINED_RESA_MODEL__@@';

export default function combineModel(name, models = [], state = {}) {
    return {
        name,
        models,
        state,
        [COMBINED_RESA_MODEL]: true,
    };
}
