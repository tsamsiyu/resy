export default function ResourceManager (resourceClass) {
    this.resourceClass = resourceClass;
    this.specs = {};
}

ResourceManager.prototype.registerSpec = function (type, spec) {
    this.specs[type] = spec;
    return this;
};

ResourceManager.prototype.getResource = function (type) {
    const resourceClass = this.resourceClass;
    return new resourceClass(type, this.specs[type], this);
};

ResourceManager.prototype.getSpec = function (type) {
    return this.specs[type];
};

ResourceManager.prototype.hasSpec = function (type) {
    return Boolean(this.specs[type]);
};

ResourceManager.prototype.create = function (type, spec) {
    const specClass = this.resourceClass;
    return new specClass(type, this, spec);
};