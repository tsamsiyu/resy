import _ from 'lodash';
import {hashedMap} from 'helpers';
import JAO from 'jao/jao';
import JAOSpec from 'jao/jao-spec';

/**
 * TODO: maybe should be renamed to JAOSerializer
 *
 * @param {JAOSpec} spec The list of instructions to serialize object
 * @param {ResourceManager|null} manager Resource manager that have information about other resources
 * @constructor
 */
export default function JAOResource(spec, manager = null) {
    this.manager = manager;
    this.spec = spec;
    this._insideSpecs = {};
}

/**
 * Static function to help you create resource, not having the created JAOSpec object
 *
 * @param {String} type
 * @param {Object|null} specHash The instruction to serialize data. If it's not specified then default values will be used
 * @param {ResourceManager|null} manager
 * @returns {JAOResource}
 */
JAOResource.create = function (type, specHash, manager) {
    const spec = new JAOSpec(type, specHash);
    return new this(spec, manager);
};

JAOResource.prototype.getPicker = function (mock, options) {
    const specHash = this.buildSpecHash();
    return JAOSpec.create(specHash).createPicker(mock, this.manager, options);
};

JAOResource.prototype.buildSpecHash = function () {
    const specHash = {};
    specHash.type = this._type || this.spec.type;
    specHash.id = this._id || this.spec.id;
    specHash.attributes = this._attributes || this.spec.attributes;
    specHash.attributes = this._attributes || this.spec.attributes;
    specHash.relationships = this._relationships || this.spec.relationships;
    specHash.included = this._included || this.spec.included;
    specHash.ignored = this._ignored || this.spec.ignored;
    specHash.insideSpecs = this._insideSpecs || this.spec.insideSpecs;
    return specHash;
};

JAOResource.prototype.id = function (name) {
    this._id = name;
    return this;
};

JAOResource.prototype.attributes = function (list, cb) {
    if (typeof cb !== 'function' || cb.call()) {
        this._attributes = list instanceof Array ? list : [list];
    }
    return this;
};

JAOResource.prototype.relationships = function (list, cb) {
    if (typeof cb !== 'function' || cb.call()) {
        this._relationships = list instanceof Array ? list : [list];
    }
    return this;
};

JAOResource.prototype.include = function (list, cb) {
    if (typeof cb !== 'function' || cb.call()) {
        this._included = list instanceof Array ? list : [list];
    }
    return this;
};

JAOResource.prototype.ignore = function (list, cb) {
    if (typeof cb !== 'function' || cb.call()) {
        this._ignored = list instanceof Array ? list : [list];
    }
    return this;
};

JAOResource.prototype.serialize = function (mock, options) {
    if (_.isArray(mock)) {
        return this.serializeCollection(mock, options);
    } else if (_.isObjectLike(mock)) {
        return this.serializeSingle(mock, options);
    } else {
        throw new Error('Passed unsupported type for serialization');
    }
};

JAOResource.prototype.formatRelationships = function (relationshipsIndexes) {
    return hashedMap(relationshipsIndexes, (item, name) => {
        return [name, {data: item}]
    });
};

/**
 * TODO: need rename
 * @param hash
 * @param cb
 * @returns {JAOResource}
 */
JAOResource.prototype.insideSpecs = function (hash, cb) {
    if (typeof cb !== 'function' || cb.call()) {
        _.forEach(hash, (item, key) => {
            this._insideSpecs[key] = JAOSpec.inspect(item, key);
        });
    }
    return this;
};

JAOResource.prototype.formatIncluded = function (included) {
    return _(included).values().flatten().map((item) => {
        if (_.isObject(item.relationships) && !_.isEmpty(item.relationships)) {
            item.relationships = this.formatRelationships(item.relationships);
        } else {
            delete item.relationships;
        }
        return item;
    }).value();
};

JAOResource.prototype.serializeSinglePlain = function (mock, options) {
    const picker = this.getPicker(mock, options);
    const plainJao = {data: {}, included: []};
    plainJao.data.id = picker.getId();
    plainJao.data.type = picker.getType();
    plainJao.data.attributes = picker.getAttributes();
    const relationships = picker.getRelationshipsIndexes();
    const included = picker.getIncluded();
    if (_.isObject(relationships) && !_.isEmpty(relationships)) {
        plainJao.data.relationships = this.formatRelationships(relationships);
    }
    if (_.isObject(included) && !_.isEmpty(included)) {
        plainJao.included = this.formatIncluded(included);
    } else {
        delete plainJao.included;
    }
    return plainJao;
};

JAOResource.prototype.serializeCollectionPlain = function (mocks, options) {
    const plainJaoCollection = {data: [], included: []};
    mocks.forEach((mock) => {
        const plainJao = this.serializeSinglePlain(mock, options);
        plainJaoCollection.data.push(plainJao.data);
        plainJaoCollection.included = plainJaoCollection.included.concat(plainJao.included);
    });
    if (!plainJaoCollection.included.length) {
        delete plainJaoCollection.included;
    }
    return plainJaoCollection;
};

JAOResource.prototype.serializeSingle = function (mock, options) {
    return new JAO(this.serializeSinglePlain(mock, options));
};

JAOResource.prototype.serializeCollection = function (mocks, options) {
    return new JAO(this.serializeCollectionPlain(mocks, options));
};

JAOResource.prototype.addMeta = function (key, value) {

};