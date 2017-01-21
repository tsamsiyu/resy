import _ from 'lodash';
import JAOSpec from 'jao/jao-spec';
import ResourceManager from 'resource-manager';
import {definedMap, hashedMap, isScalar, forHashMap} from 'helpers';

/**
 * @param {Object} mock Data to pick from
 * @param {JAOSpec} spec Instructions to pick data
 * @param {ResourceManager|null} manager
 * @param {Object|null} options
 * @constructor
 */
export default function JAOPicker(mock, spec, manager = null, options = null) {
    this.mock = mock;
    this.manager = manager;
    this.spec = spec;
    this.options = options;
}

JAOPicker.create = function (mock, type, specHash = null, manager = null, options) {
    const spec = new JAOSpec(type, specHash);
    return new this(mock, spec, manager, options);
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
            if (managerStoreOnly === undefined) {
                throw new Error(`Spec '${relType}' was not found for '${relName}' relationship`);
            } else if (managerStoreOnly === false) {
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
    if (relSpec) {
        return relSpec.createPicker(element, this.manager);
    }
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
        if (relPicker && relPicker.isValid()) {
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

JAOPicker.prototype.getIncludedForObject = function (relName, relObject) {
    const relPicker = this.getElementPicker(relName, relObject);
    if (relPicker && relPicker.isValid()) {
        const includedElement = {
            id: relPicker.getId(),
            type: relPicker.getType(),
            attributes: relPicker.getAttributes(),
        };
        const rels = relPicker.getRelationshipsIndexes();
        if (_.size(rels)) {
            includedElement.relationships = rels;
            const inclds = relPicker.getIncluded();
            if (_.size(inclds)) {
                includedElement.included = inclds;
            }
        }
        return includedElement;
    }
};

JAOPicker.prototype.getIncludedForElement = function (relName, rel) {
    if (_.isArray(rel)) {
        const includedRelItems = definedMap(rel, (relItem) => {
            return this.getIncludedForObject(relName, relItem);
        });
        if (includedRelItems.length === _.size(rel)) {
            return includedRelItems;
        }
    } else if (_.isObject(rel)) {
        return this.getIncludedForObject(relName, rel);
    }
};

JAOPicker.prototype.getIncludedForRelationship = function (name) {
    const value = _.get(this.mock, name);
    return this.getIncludedForElement(name, value);
};

JAOPicker.prototype.flattenIncludedTree = function (includedElement, cb) {
    const flattenedIncludeds = {};
    if (_.isArray(includedElement)) {
        _.forEach(includedElement, (includedObject) => {
            _.forEach(includedObject.included, (childIncludedItem, childIncludedName) => {
                let flattenchild = flattenedIncludeds[childIncludedName];
                if (flattenchild) {
                    if (!_.isArray(flattenchild)) {
                        flattenchild = [flattenchild];
                    }
                    if (_.isArray(childIncludedItem)) {
                        flattenchild = flattenchild.concat(childIncludedItem);
                    } else {
                        flattenchild.push(childIncludedItem);
                    }
                } else {
                    flattenchild = childIncludedItem;
                }
                flattenedIncludeds[childIncludedName] = flattenchild;
            });
            delete includedObject.included;
        });
        return flattenedIncludeds;
    } else {
        _.assign(flattenedIncludeds, includedElement.included);
        delete includedElement.included;
    }
    return flattenedIncludeds;
};

JAOPicker.prototype.getIncluded = function () {
    if (_.isArray(this.spec.included)) {
        const includeds = this.spec.getIncluded();
        if (includeds.length) {
            return forHashMap(includeds, (name, i, hash) => {
                const included = this.getIncludedForRelationship(name);
                if (included) {
                    const flattenedChilds = this.flattenIncludedTree(included);
                    _.forEach(flattenedChilds, (flattenedChildItem, flattenedChildName) => {
                        const childRelName = `${name}.${flattenedChildName}`;
                        hash[childRelName] = flattenedChildItem;
                    });
                    hash[name] = included;
                }
            });
        }
    } else {
        return forHashMap(this.mock, (value, name, hash) => {
            if (!this.spec.isIgnored(name) && !this.spec.isId(name)) {
                const included = this.getIncludedForElement(name, value);
                if (included) {
                    const flattenedChilds = this.flattenIncludedTree(included);
                    _.forEach(flattenedChilds, (flattenedChildItem, flattenedChildName) => {
                        const childRelName = `${name}.${flattenedChildName}`;
                        hash[childRelName] = flattenedChildItem;
                    });
                    hash[name] = included;
                }
            }
        });
    }
};