export const COMBINED_RESA_MODEL = '@IS_COMBINED_RESA_MODEL@';

export default function combineModel(name, models = [], state = {}) {
    return {
        name,
        models,
        state,
        [COMBINED_RESA_MODEL]: true,
    };
}
