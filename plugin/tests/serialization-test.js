import chai from 'chai';
import faker from 'faker';

import JAOSpec from 'jao/jao-spec';

const expect = chai.expect;

const generatePost = () => {
    return {
        id: faker.random.uuid(),
        title: faker.name.title()
    }
};

const generateUser = () => {
    return {
        id: faker.random.uuid(),
        email: faker.internet.email(),
        passwordHash: faker.random.uuid(),
        profile: {
            id: faker.random.uuid(),
            name: faker.name.firstName(),
            surname: faker.name.lastName()
        },
        posts: [generatePost(), generatePost()]
    };
};

describe("serialization", () => {
    it('must serialize plain object without predefined specification', () => {
        const user = generateUser();
        const serializedUser = (new JAOSpec('users')).serialize(user);
        expect(serializedUser).to.deep.equal({
            data: {
                id: user.id,
                type: 'users',
                attributes: {
                    email: user.email,
                    passwordHash: user.passwordHash
                },
                relationships: {
                    profile: {
                        data: {
                            id: user.profile.id,
                            type: 'profile'
                        }
                    },
                    posts: {
                        data: [
                            {id: user.posts[0].id, type: 'posts'},
                            {id: user.posts[1].id, type: 'posts'},
                        ]
                    }
                }
            }
        });
    });
});