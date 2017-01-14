import _ from 'lodash';
import JAO from 'jao/jao';
import JAOPicker from 'jao/jao-picker';

export default function JAOSpec(type, manager = null, specification = null) {
    this.manager = manager;
    this.type = type;
    this.id = _.get(specification, 'id', 'id');
    this.attributes = _.get(specification, 'attributes', null); // null allows all the attributes
    this.relationships = _.get(specification, 'relationships', null); // null allows all the relationships
    this.relationshipsSpecs = _.get(specification, 'relationshipsSpecs', null);
    this.included = _.get(specification, 'included', null);
}

JAOSpec.pickerClass = JAOPicker;

JAOSpec.prototype.getPicker = function (mock) {
    const pickerClass = this.constructor.pickerClass;
    return new pickerClass(this, mock);
};

JAOSpec.prototype.attributesOnly = function (list) {
    this.attributes = list;
    return this;
};

JAOSpec.prototype.attributesExclude = function (list) {
    this.attributes = _.difference(this.attributes, list);
    return this;
};

JAOSpec.prototype.relationshipsOnly = function (list) {
    this.relationships = list;
    return this;
};

JAOSpec.prototype.relationshipsExclude = function (list) {
    this.relationships = _.difference(this.relationships, list);
    return this;
};

JAOSpec.prototype.includedOnly = function (list) {
    this.included = list;
    return this;
};

JAOSpec.prototype.serialize = function (mock) {
    if (mock instanceof Array) {
        return this.serializeCollection(mock);
    } else {
        return this.serializeSingle(mock);
    }
};

JAOSpec.prototype.serializeSingle = function (mock) {
    const picker = this.getPicker(mock);
    const plainObject = {data: {}, included: []};
    plainObject.data.id = picker.getId();
    plainObject.data.type = picker.getType();
    plainObject.data.attributes = picker.getAttributes();
    const relationships = picker.getRelationships();
    if (_.isObjectLike(relationships) && !_.isEmpty(relationships)) {
        plainObject.data.relationships = relationships;
    }
    if (_.isArray(this.included)) {
        this.included.forEach((relName) => {
            const relMock = _.get(mock, relName);
            if (relMock) {
                const relType = picker.getRelationshipType(relName);
                const relSpec = this.manager.getSpec(relType);
                const relPlainObject = relSpec.serialize(relMock);
                plainObject.included.push(relPlainObject);
            }
        });
    }
    return new JAO(plainObject);
};

JAOSpec.prototype.serializeCollection = function (mocks) {
};

