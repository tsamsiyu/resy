/**
 * Represents the json-api structured object
 *
 * @param jaoPlainObject
 * @constructor
 */
export default function JAO(jaoPlainObject) {
    this.data = jaoPlainObject.data;
    if (jaoPlainObject.included) {
        this.included = jaoPlainObject.included;
    }
}

export function JAOData() {

}

export function JAONode() {

}

export function JAONodes() {

}

export function JAONodeRelationships() {
    
}