import _ from 'lodash';
import JAOSpec from 'jao/jao-spec';
import ResourceManager from 'resource-manager';
import {definedMap, hashedMap, isScalar, forHashMap} from 'helpers';

/**
 * @param {Object} mock Data to pick from
 * @param {JAOSpec} spec Instructions to pick data
 * @param {ResourceManager|null} manager
 * @param options
 * @constructor
 */
export default function JAOPicker(mock, spec, manager = null, options = null) {
    this.mock = mock;
    this.manager = manager;
    this.spec = spec;
    this.options = options;
}

JAOPicker.create = function (mock, type, specHash = null, manager = null) {
    const spec = new JAOSpec(type, specHash);
    return new this(mock, spec, manager);
};

JAOPicker.prototype.isValid = function () {
    return _.has(this.mock, this.spec.id);
};

/**
 * case 1
 *      - relationship spec
 *      + manager
 *      manager have spec for `relName`
 *      CONCLUSION: use spec from manager
 * case 2
 *      - relationship spec
 *      + manager
 *      manager don't have spec by relName
 *      CONCLUSION: if option `managerStoreOnly` is true or undefined then throw error, otherwise - create empty resource
 * case 3
 *      - relationship spec
 *      - manager
 *      CONCLUSION: create empty resource
 * case 4
 *      + relationship spec
 *      relationship spec is object
 *      CONCLUSION: use relationship spec
 * case 5
 *      + relationship spec
 *      + manager
 *      relationship spec is string
 *      manager have spec for that type
 *      CONCLUSION: have use spec from manager
 * case 6
 *      + relationship spec
 *      + manager
 *      relationship spec is string
 *      manager don't have spec for that type
 *      CONCLUSION: if option `managerStoreOnly` is true or undefined then throw error, otherwise - create empty resource
 * case 7
 *      + relationship spec
 *      - manager
 *      CONCLUSION: create empty spec
 *
 * @param {String} relName
 * @returns {JAOSpec}
 */
JAOPicker.prototype.getRelationshipSpec = function (relName) {
    const relSpec = _.get(this.spec.insideSpecs, relName, null);
    if (relSpec === null) {
        return this.provideRelationshipSpec(relName, relName);
    } else {
        const specType = typeof relSpec;
        if (relSpec instanceof JAOSpec) {
            return relSpec;
        } else if (specType === 'string') {
            return this.provideRelationshipSpec(relName, relSpec);
        } else {
            throw new Error(`Unexpected type of relationship spec '${relName}' : '${relSpec}'`);
        }
    }
};

JAOPicker.prototype.provideRelationshipSpec = function (relName, relType) {
    if (this.manager instanceof ResourceManager) {
        if (this.manager.hasSpec(relType)) {
            return this.manager.getSpec(relType);
        } else {
            const managerStoreOnly = _.get(this.options, 'managerStoreOnly', undefined);
            if (managerStoreOnly === true || managerStoreOnly === undefined) {
                throw new Error(`Spec '${relType}' was not found for '${relName}' relationship`);
            } else {
                return this.createEmptySpec(relType);
            }
        }
    } else {
        return this.createEmptySpec(relType);
    }
};

JAOPicker.prototype.createEmptySpec = function (type) {
    return new JAOSpec(type);
};

/**
 * @param {String} relName
 * @param {Object} element
 * @return {JAOPicker}
 */
JAOPicker.prototype.getElementPicker = function (relName, element) {
    const relSpec = this.getRelationshipSpec(relName);
    return relSpec.createPicker(element, this.manager);
};

JAOPicker.prototype.getType = function () {
    return this.spec.type;
};

JAOPicker.prototype.getId = function () {
    return _.get(this.mock, this.spec.id, null);
};

JAOPicker.prototype.getAttributes = function () {
    if (_.isArray(this.spec.attributes)) {
        return _.pick(this.mock, this.spec.getAttributes(), []);
    } else {
        return _.pickBy(this.mock, (value, key) => {
            return isScalar(value) &&
                !this.spec.isId(key) &&
                !this.spec.isIgnored(key);
        });
    }
};

JAOPicker.prototype.getElementObjectIndex = function (name, value) {
    if (_.isObjectLike(value)) {
        const relPicker = this.getElementPicker(name, value);
        if (relPicker.isValid()) {
            return {
                type: relPicker.getType(),
                id: relPicker.getId()
            }
        }
    }
};

JAOPicker.prototype.getElementIndex = function (relName, relValue) {
    if (_.isArray(relValue)) {
        const rels = definedMap(relValue, (relItem) => {
            return this.getElementObjectIndex(relName, relItem);
        });
        if (_.size(rels) === _.size(relValue)) {
            return rels;
        }
    } else {
        return this.getElementObjectIndex(relName, relValue);
    }
};

JAOPicker.prototype.getRelationshipIndex = function (relName) {
    const relValue = this.mock[relName];
    return this.getElementIndex(relName, relValue);
};

JAOPicker.prototype.getRelationshipsIndexes = function () {
    if (_.isArray(this.spec.relationships)) {
        const relationships = this.spec.getRelationships();
        if (relationships.length) {
            return hashedMap(relationships, (relName) => {
                const relValue = this.getRelationshipIndex(relName);
                if (relValue) {
                    return [relName, relValue];
                }
            });
        }
    } else {
        return hashedMap(this.mock, (value, name) => {
            if (!this.spec.isIgnored(name)) {
                const relValue = this.getElementIndex(name, value);
                if (relValue) {
                    return [name, relValue];
                }
            }
        });
    }
};

JAOPicker.prototype.getIncludedElement = function (relName, relObject) {
    const relPicker = this.getElementPicker(relName, relObject);
    if (relPicker.isValid()) {
        return {
            id: relPicker.getId(),
            type: relPicker.getType(),
            attributes: relPicker.getAttributes(),
            relationships: relPicker.getRelationshipsIndexes(),
            included: relPicker.getIncluded()
        };
    }
};

JAOPicker.prototype.getIncludedItem = function (relName, rel) {
    if (_.isArray(rel)) {
        const includedRelItems = definedMap(rel, (relItem) => {
            return this.getIncludedElement(relName, relItem);
        });
        if (includedRelItems.length === _.size(rel)) {
            return includedRelItems;
        }
    } else if (_.isObject(rel)) {
        return this.getIncludedElement(relName, rel);
    }
};

JAOPicker.prototype.getIncluded = function () {
    if (_.isArray(this.spec.included)) {
        const includeds = this.spec.getIncluded();
        if (includeds.length) {
            return hashedMap(includeds, (relName) => {
                const rel = _.get(this.mock, relName); // TODO: it is impossible to get pluralized relationship like 'friends.posts`
                const included = this.getIncludedItem(relName, rel);
                if (included) {
                    return [relName, included];
                }
            });
        }
    } else {
        return forHashMap(this.mock, (value, name, hash) => {
            if (!this.spec.isIgnored(name) && !this.spec.isId(name)) {
                const included = this.getIncludedItem(name, value);
                if (included) {
                    // TODO: need refactoring
                    if (!_.isArray(included)) {
                        if (included.included) {
                            _.forEach(included.included, (includedItem, includedName) => {
                                hash[`${name}.${includedName}`] = includedItem;
                            });
                        }
                        delete included.included;
                    } else {
                        _.forEach(included, (includedObject, k) => {
                            if (includedObject.included) {
                                _.forEach(includedObject.included, (includedItem, includedName) => {
                                    hash[`${name}.${includedName}`] = includedItem;
                                });
                                delete includedObject.included;
                            }
                        })
                    }
                    hash[name] = included;
                }
            }
        });
    }
};