import _ from 'lodash';
import {hashedMap} from 'helpers';
import JAO from 'jao/jao';
import JAOSpec from 'jao/jao-spec';

/**
 * TODO: the purpose and name of this class should be revised
 *
 * @param {JAOSpec} spec The list of instructions to serialize object
 * @param {ResourceManager|null} manager Resource manager that have information about other resources
 * @constructor
 */
export default function JAOResource(spec, manager = null) {
    this.manager = manager;
    this.spec = spec;
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

JAOResource.prototype.getPicker = function (mock) {
    const specHash = this.buildSpecHash();
    return JAOSpec.create(specHash).createPicker(mock, this.manager);
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
    return specHash;
};

JAOResource.prototype.attributes = function (list, cb) {
    if (typeof cb !== 'function' || cb.call()) {
        this._attributes = list;
    }
    return this;
};

JAOResource.prototype.relationships = function (list, cb) {
    if (typeof cb !== 'function' || cb.call()) {
        this._relationships = list;
    }
    return this;
};

JAOResource.prototype.include = function (list, cb) {
    if (typeof cb !== 'function' || cb.call()) {
        this._included = list;
    }
    return this;
};

JAOResource.prototype.ignore = function (list, cb) {
    if (typeof cb !== 'function' || cb.call()) {
        this._ignored = list;
    }
    return this;
};

JAOResource.prototype.serialize = function (mock) {
    if (_.isArray(mock)) {
        return this.serializeCollection(mock);
    } else if (_.isObjectLike(mock)) {
        return this.serializeSingle(mock);
    } else {
        throw new Error('Passed unsupported type for serialization');
    }
};

JAOResource.prototype.formatRelationships = function (relationshipsIndexes) {
    return hashedMap(relationshipsIndexes, (item, key) => {
        return [key, {data: item}]
    });
};

JAOResource.prototype.serializeSingle = function (mock) {
    const picker = this.getPicker(mock);
    const plainJao = {data: {}, included: []};
    plainJao.data.id = picker.getId();
    plainJao.data.type = picker.getType();
    plainJao.data.attributes = picker.getAttributes();
    const relationships = picker.getRelationshipsIndexes();
    if (_.isObjectLike(relationships) && !_.isEmpty(relationships)) {
        plainJao.data.relationships = this.formatRelationships(relationships);
    }
    // if (_.isArray(this.included)) { // TODO: need to move it into JAOPicker
    //     this.included.forEach((relName) => {
    //         const relMock = _.get(mock, relName);
    //         if (relMock) {
    //             const relType = picker.getRelationshipType(relName);
    //             const relSpec = this.manager.getSpec(relType);
    //             const relPlainObject = relSpec.serialize(relMock);
    //             plainJao.included.push(relPlainObject);
    //         }
    //     });
    // }
    return new JAO(plainJao);
};

JAOResource.prototype.serializeCollection = function (mocks) {
};
