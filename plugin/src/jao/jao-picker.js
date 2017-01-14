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

// TODO: need refactoring, recognize and reuse some repeating places
JAOPicker.prototype.getRelationships = function () {
    const relNames = this.spec.relatinoships;
    const rels = {};
    if (_.isArray(relNames) && !_.isEmpty(relNames)) {
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
    } else {
        _.forEach(this.mock, (value, key) => {
            if (_.isArray(value) && !_.isEmpty(value)) {
                const valueRels = [];
                _.forEach(value, (item) => {
                    if (_.isObjectLike(item) && item.id) {
                        valueRels.push({
                            id: item.id,
                            type: key
                        });
                    }
                });
                if (_.size(valueRels) === _.size(value)) {
                    rels[key] = {data: valueRels};
                }
            } else if (_.isObjectLike(value) && value.id) {
                rels[key] = {
                    data: {
                        id: value.id,
                        type: key
                    }
                };
            }
        });
    }
    return rels;
};