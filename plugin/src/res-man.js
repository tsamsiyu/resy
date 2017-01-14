export default function ResourceManager (specClass) {
    this.specClass = specClass;
    this.specs = {};
}

ResourceManager.prototype.register = function (type, spec) {
    this.specs[type] = spec;
    return this;
};

ResourceManager.prototype.getInstance = function (type) {
    const specClass = this.specClass;
    return new specClass(type, this, this.specs[type]);
};

ResourceManager.prototype.get = function (type) {
    return this.specs[type];
};

ResourceManager.prototype.has = function (type) {
    return Boolean(this.specs[type]);
};

ResourceManager.prototype.create = function (type, spec) {
    const specClass = this.specClass;
    return new specClass(type, this, spec);
};