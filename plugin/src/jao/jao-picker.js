import _ from 'lodash';
import JAOSpec from 'jao/jao-spec';

/**
 * TODO: we should have possibility to use this class independent on Spec and Manager
 *
 * @param spec Instructions to pick data
 * @param mock Data to pick from
 * @param manager
 * @constructor
 */
export default function JAOPicker(spec, mock, manager = null) {
    this.spec = spec;
    this.mock = mock;
    this.manager = manager;
}

JAOPicker.prototype.getType = function () {
    return this.spec.type;
};

JAOPicker.prototype.getRelationshipType = function (relName) {
    const relSpec = this.getRelationshipSpec(relName);
    if (relSpec) {
        if (typeof relSpec === 'object') {
            return relSpec.type; // expects serializer
        } else {
            return relSpec;
        }
    }
    return relName;
};

JAOPicker.prototype.getRelationshipSpec = function (relName) {
    if (_.isObjectLike(this.spec.relationshipsSpecs)) {
        if (this.spec.relationshipsSpecs[relName]) {
            return this.spec.relationshipsSpecs[relName];
        }
    }
};

// TODO: need to review, probably it's an architecture problem [IMPORTANT]
JAOPicker.prototype.getRelationshipSpecInstance = function (relName) {
    const relSpec = this.getRelationshipSpec(relName);
    if (typeof relSpec === 'object') {
        return relSpec;
    } else if (typeof relSpec === 'string' && this.manager) {
        return this.manager.getInstance(relSpec);
    } else if (this.manager) {
        if (this.manager.has(relName)) {
            return this.manager.getInstance(relName);
        } else {
            return this.manager.create(relName);
        }
    } else {
        return new JAOSpec(relName, null, null);
    }
};

JAOPicker.prototype.getRelationshipPicker = function (relName, mock) {
    const relSpec = this.getRelationshipSpecInstance(relName);
    return relSpec.getPicker(mock);
};

JAOPicker.prototype.getId = function () {
    return _.get(this.mock, this.spec.id, null);
};

JAOPicker.prototype.getAttributes = function () {
    if (_.isArray(this.spec.attributes)) {
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
// TODO: maybe returned data should not be in json-api view?
JAOPicker.prototype.getRelationships = function () {
    const relNames = this.spec.relationships;
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