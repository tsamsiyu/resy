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

const generateProfile = () => {
    return {
        id: faker.random.uuid(),
        name: faker.name.firstName(),
        surname: faker.name.lastName()
    }
};

const generateUser = () => {
    return {
        id: faker.random.uuid(),
        email: faker.internet.email(),
        passwordHash: faker.random.uuid(),
    };
};

describe("Serialization", () => {
    describe('without predefined specification', () => {
        it('must serialize plain proper object', () => {
            const user = generateUser();
            user.profile = generateProfile();
            user.posts = [generatePost(), generatePost()];
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
                            data: user.posts.map((post) => {
                                return {id: post.id, type: 'posts'}
                            })
                        }
                    }
                }
            });
        });

        it("should not serialize embed object if that one don't have an id key", () => {
            const user = generateUser();
            user.profile = generateProfile();
            delete user.profile.id;
            const serializedUser = (new JAOSpec('users')).serialize(user);
            expect(serializedUser).to.deep.equal({
                data: {
                    id: user.id,
                    type: 'users',
                    attributes: {
                        email: user.email,
                        passwordHash: user.passwordHash
                    }
                }
            });
        });

        it("should not serialize embed collection if at least one of them is invalid", () => {
            const user = generateUser();
            user.posts = [generatePost(), generatePost(), 7];
            const serializedUser = (new JAOSpec('users')).serialize(user);
            expect(serializedUser).to.deep.equal({
                data: {
                    id: user.id,
                    type: 'users',
                    attributes: {
                        email: user.email,
                        passwordHash: user.passwordHash
                    }
                }
            });
        });

        it("should take specified [attributes, relationships, included, id] into account", () => {
            const user = generateUser();
            user.profile = generateProfile();
            user.posts = [generatePost()];
            const serializedUser = (new JAOSpec('users'))
                .attributesOnly(['email'])
                .relationshipsOnly(['profile'])
                .serialize(user);

            expect(serializedUser).to.deep.equal({
                data: {
                    id: user.id,
                    type: 'users',
                    attributes: {
                        email: user.email,
                    },
                    relationships: {
                        profile: {
                            data: {
                                id: user.profile.id,
                                type: 'profile'
                            }
                        }
                    }
                }
            });
        });
    });
});