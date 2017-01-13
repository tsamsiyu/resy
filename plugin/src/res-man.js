export default function ResourceManager (specClass) {
    this.specClass = specClass;
    this.specs = {};
}

ResourceManager.prototype.register = function (type, spec) {
    this.specs[type] = spec;
    return this;
};

ResourceManager.prototype.get = function (type) {
    const specClass = this.specClass;
    return new specClass(this, type, this.specs[type]);
};