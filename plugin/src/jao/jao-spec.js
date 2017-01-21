import get from 'lodash/get';
import difference from 'lodash/difference';
import JAOPicker from 'jao/jao-picker';

const getArray = function (obj, key, def = null) {
    let res = get(obj, key, def);
    if (typeof res === 'string') {
        res = [res];
    }
    return res;
};

/**
 *
 * @param type
 * @param specHash
 * @constructor
 * @property {String} id
 * @property {String} type
 * @property {Array} attributes
 * @property {Array} relationships
 * @property {Array} included
 * @property {Array} ignored
 * @property {Object} insideSpecs
 */
export default function JAOSpec(type, specHash = null) {
    if (typeof type !== 'string') {
        throw new Error('Type of jao spec must be a string');
    }
    this.type = type;
    this.originalSpec = specHash;
    this.id = get(specHash, 'id', 'id');
    this.attributes = getArray(specHash, 'attributes', null); // null allows all the attributes
    this.relationships = getArray(specHash, 'relationships', null); // null allows all the relationships
    this.included = getArray(specHash, 'included', null); // null allows all the included
    this.ignored = getArray(specHash, 'ignored', []);
    this.insideSpecs = get(specHash, 'insideSpecs', null);
}

/**
 * @param spec
 * @returns {JAOSpec}
 */
JAOSpec.create = function (spec) {
    const type = spec.type;
    delete spec.type;
    return new this(type, spec);
};

/**
 * Bind particular picker to spec
 * @returns {JAOPicker}
 */
JAOSpec.createPicker = function (mock, spec, manager = null, options) {
    return new JAOPicker(mock, spec, manager, options);
};

JAOSpec.inspect = function (specHash, key) {
    if (specHash instanceof JAOSpec) {
        return specHash;
    } else if (typeof specHash === 'object') {
        if (specHash.type) {
            return this.create(specHash);
        } else {
            return new this(key, specHash);
        }
    } else if (typeof specHash === 'string') {
        return specHash;
    } else {
        throw Error('Unexpected spec was passed');
    }
};

JAOSpec.prototype.createPicker = function (mock, manager = null, options) {
    return this.constructor.createPicker(mock, this, manager, options)
};

JAOSpec.prototype.isEmpty = function () {
    const origin = this.originalSpec;
    return typeof origin !== 'object' ||
            !(origin.id ||
            origin.attributes ||
            origin.relationships ||
            origin.insideSpecs ||
            origin.included ||
            origin.ignored);
};

JAOSpec.prototype.getAttributes = function () {
    if (this.attributes) {
        return difference(this.attributes, this.ignored);
    }
    return null;
};

JAOSpec.prototype.getRelationships = function () {
    if (this.relationships) {
        return difference(this.relationships, this.ignored);
    }
    return null;
};

JAOSpec.prototype.getIncluded = function () {
    if (this.included) {
        return difference(this.included, this.ignored);
    }
    return null;
};

JAOSpec.prototype.isIgnored = function (key) {
    return this.ignored.includes(key);
};

JAOSpec.prototype.isId = function (key) {
    return String(key) === String(this.id);
};