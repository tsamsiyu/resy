export default function ResourceManager (resourceClass, specClass) {
    this.resourceClass = resourceClass;
    this.specClass = specClass;
    this.specs = {};
}

ResourceManager.prototype.registerSpec = function (arg1, arg2) {
    const specClass = this.specClass;
    if (typeof arg1 === 'object') {
        if (!arg1 instanceof specClass) {
            arg1 = specClass.create(arg1);
        }
        this.specs[arg1.type] = arg1;
    } else if (typeof arg1 === 'string' && typeof arg2 === 'object') {
        this.specs[arg1] = new specClass(arg1, arg2);
    } else {
        throw Error('Unexpected spec format');
    }
    return this;
};

ResourceManager.prototype.getResource = function (type) {
    const resourceClass = this.resourceClass;
    return new resourceClass(this.specs[type], this);
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