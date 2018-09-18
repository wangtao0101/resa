/**
 * Copyright (c) 2014-present, Facebook, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

/**
 * copy code from https://github.com/facebook/immutable-js, so we do not need to install immutable package
 */
const IS_ITERABLE_SENTINEL = '@@__IMMUTABLE_ITERABLE__@@';
const IS_RECORD_SENTINEL = '@@__IMMUTABLE_RECORD__@@';

function isRecord(maybeRecord) {
    return !!(maybeRecord && maybeRecord[IS_RECORD_SENTINEL]);
}


function isCollection(maybeCollection) {
    return !!(maybeCollection && maybeCollection[IS_ITERABLE_SENTINEL]);
}

export default function isImmutable(maybeImmutable) {
    return isCollection(maybeImmutable) || isRecord(maybeImmutable);
}
