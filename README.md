# resy
Resource management with json-api implementation

**Keywords**
- jao - json api object, in code dictionary it's class that reflect a tree of json:api data representation
- spec - list of instructions for serialization
- picker - helper class to pick data for serialization from particular object

**Conception**

2 ways to serialize data:

- without spec
```js
(new JAOSpec).serialize(user);
```
- with spec
```js
const user = {
    _id: 1,
    email: 'ts.likhovoi.dim@gmail.com',
    login: 'tsamsiyu',
    role: 'admin',
    authKey: 'jfq9340934FJ039jJ0',
    profile: {
        _id: 17,
        name: 'David',
        surname: 'Fellaini'
    }
};

const spec = new JAOSpec('users', {
    id: '_id',
    attributes: ['email', 'login', 'role'],
    relationships: ['profile'] // at now profile serializer expects id named "id", read below to see how to fix it
});

spec.serialize();
```