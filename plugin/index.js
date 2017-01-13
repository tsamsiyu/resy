import JAOSpec from 'jao/jao-spec';
import ResMan from 'res-man';

const resMan = new ResMan(JAOSpec);

resMan.register('user', {
    attributes: ['email', 'username']
});

const user = {
    id: 11,
    email: 'flarency@gmail.com',
    username: 'mastpi',
    authKey: 'jf9430a[90q34o,rd2-kj43td.9j5',
    passwordHash: 'ifjIJE;kjf[SD-fik3940f0'
};

// TODO: make it `serialize('users', user);`
const serializedUser = (new JAOSpec('users')).serialize(user);
console.log(serializedUser.data);