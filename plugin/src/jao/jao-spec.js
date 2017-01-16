import get from 'lodash/get';
import difference from 'lodash/difference';
import JAOPicker from 'jao/jao-picker';

export default function JAOSpec(type, specHash = null) {
    if (typeof type !== 'string') {
        throw new Error('Type of jao spec must be a string');
    }
    this.type = type;
    this.originalSpec = specHash;
    this.id = get(specHash, 'id', 'id');
    this.attributes = get(specHash, 'attributes', null); // null allows all the attributes
    this.relationships = get(specHash, 'relationships', null); // null allows all the relationships
    this.included = get(specHash, 'included', null); // null allows all the included
    this.insideSpecs = get(specHash, 'insideSpecs', null);
    this.ignored = get(specHash, 'ignored', []);
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
JAOSpec.createPicker = function (mock, spec, manager = null) {
    return new JAOPicker(mock, spec, manager);
};

JAOSpec.prototype.createPicker = function (mock, manager = null) {
    return this.constructor.createPicker(mock, this, manager)
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