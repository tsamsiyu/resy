import _ from 'lodash';

export default function JAOPicker(spec, mock) {
    this.spec = spec;
    this.mock = mock;
}

JAOPicker.prototype.getType = function () {
    return this.spec.type;
};

JAOPicker.prototype.getRelationshipType = function (relName) {
    if (typeof this.spec.relationshipsSpecs === 'object') {
        if (this.spec.relationshipsSpecs[relName]) {
            const typeValue = this.spec.relationshipsSpecs[relName];
            if (typeof typeValue === 'object') {
                return typeValue.type; // expects serializer
            } else {
                return typeValue;
            }
        }
    }
};

JAOPicker.prototype.getRelationshipSpec = function (relName) {
    const relType = this.getRelationshipType(relName);
    return this.spec.manager.getSpec(relType);
};

JAOPicker.prototype.getRelationshipPicker = function (relName, mock) {
    return this.spec.getPicker(mock);
};

JAOPicker.prototype.getId = function () {
    return _.get(this.mock, this.spec.id, null);
};

JAOPicker.prototype.getAttributes = function () {
    if (this.spec.attributes) {
        return _.pick(this.mock, this.spec.attributes, []);
    } else {
        return _.pickBy(this.mock, (value, key) => {
            const valueType = typeof value;
            const isScalar = valueType === 'string' || valueType === 'number';
            return isScalar && key !== this.spec.id;
        });
    }
};

JAOPicker.prototype.getRelationships = function () {
    const relNames = this.spec.relatinoships;
    if (_.isArray(relNames) && !_.isEmpty(relNames)) {
        const rels = {};
        relNames.forEach((relName) => {
            const rel = _.get(this.mock, relName);
            if (_.isArray(rel)) {
                rels[relName] = {data: []};
                rel.map((relItem) => {
                    const relPicker = this.getRelationshipPicker(relName, relItem);
                    rels[relName].data.push({
                        type: relPicker.getType(),
                        id: relPicker.getId()
                    });
                });
            } else if (_.isObjectLike(rel)) {
                const relPicker = this.getRelationshipPicker(relName, rel);
                rels[relName] = {data: {
                    type: relPicker.getType(),
                    id: relPicker.getId(),
                }};
            }
        });
        return rels;
    }
};