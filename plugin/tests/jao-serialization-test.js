import chai from 'chai';
import _ from 'lodash';
import {generateUser, generateProfile, generatePost} from './factories';

import JAOResource from 'jao/jao-resource';
import JAOSpec from 'jao/jao-spec';

const expect = chai.expect;

describe("JAOResource", () => {
    describe('serialize data without predefined specification', () => {
        it('must serialize plain proper object', () => {
            const user = generateUser();
            user.profile = generateProfile();
            user.posts = [generatePost(), generatePost()];
            const serializedUser = JAOResource.create('users')
                .include([])
                .serialize(user);
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
            const serializedUser = JAOResource.create('users').serialize(user);
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
            const serializedUser = JAOResource.create('users')
                .include([])
                .serialize(user);
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

        it("`attributes, relationships, id` functions of jao-resource should work", () => {
            const user = generateUser();
            user.profile = generateProfile();
            user.posts = [generatePost()];
            const serializedUser = JAOResource.create('users')
                .include([])
                .attributes(['email'])
                .relationships(['profile'])
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

        it("`ignore` function of jao-resource should work", () => {
            const user = generateUser();
            user.profile = generateProfile();
            user.posts = [generatePost()];
            const serializedUser = JAOResource.create('users')
                .include([])
                .ignore(['authKey', 'passwordHash', 'posts'])
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

        it("`included` function of jao-resource should work", () => {
            const user = generateUser();
            user.profile = generateProfile();
            user.posts = [generatePost()];
            const serializedUser = JAOResource.create('users').serialize(user);

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
                                return {
                                    id: post.id,
                                    type: 'posts'
                                }
                            })
                        }
                    }
                },
                included: _.concat([
                    {
                        type: 'profile',
                        id: user.profile.id,
                        attributes: {
                            name: user.profile.name,
                            surname: user.profile.surname
                        }
                    }
                ], _.map(user.posts, (post) => {
                    return {
                        id: post.id,
                        type: 'posts',
                        attributes: {
                            title: post.title,
                        }
                    };
                }))
            });
        });

        it("hash in `insideSpecs` function should be used as relationship spec", () => {
            const user = generateUser();
            user.profile = generateProfile();
            const serializedUser = JAOResource.create('users')
                .insideSpecs({profile: {
                    attributes: ['name']
                }})
                .serialize(user);

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
                    },
                },
                included: [
                    {
                        type: 'profile',
                        id: user.profile.id,
                        attributes: {
                            name: user.profile.name
                        }
                    }
                ]
            });
        });

        it("string in `insideSpecs` function should be used as type if resource-manager is not specified", () => {
            const user = generateUser();
            user.profile = generateProfile();
            const serializedUser = JAOResource.create('users')
                .insideSpecs({profile: 'userinfo'})
                .serialize(user);

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
                                type: 'userinfo'
                            }
                        },
                    },
                },
                included: [
                    {
                        type: 'userinfo',
                        id: user.profile.id,
                        attributes: {
                            name: user.profile.name,
                            surname: user.profile.surname
                        }
                    }
                ]
            });
        });
    });
});