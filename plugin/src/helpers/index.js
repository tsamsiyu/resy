import _ from 'lodash';

export function checkedMap(ary, cb, checkCb) {
    const newAry = [];
    _.forEach(ary, (item, key) => {
        const newItem = cb.call(null, item, key);
        if (checkCb.call(null, newItem, key)) {
            newAry.push(newItem);
        }
    });
    return newAry;
}

export function definedMap(ary, cb) {
    return checkedMap(ary, cb, (item) => {
        return item !== undefined;
    });
}

export function hashedMap(ary, cb) {
    const hashMap = {};
    _.forEach(ary, (item, key) => {
        const newItem = cb.call(null, item, key);
        if (newItem instanceof Array && newItem[0] !== undefined && newItem[1] !== undefined) {
            hashMap[newItem[0]] = newItem[1];
        }
    });
    return hashMap;
}

export function isScalar(value) {
    const valueType = typeof value;
    return valueType === 'string' || valueType === 'number';
}

export function forMap(ary, cb) {
    const map = [];
    _.forEach(ary, (item, key) => {
        cb.call(null, item, key, map);
    });
    return map;
}

export function forHashMap(ary, cb) {
    const map = {};
    _.forEach(ary, (item, key) => {
        cb.call(null, item, key, map);
    });
    return map;
}