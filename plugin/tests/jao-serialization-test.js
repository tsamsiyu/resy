import chai from 'chai';
import _ from 'lodash';
import {generateUser, generateProfile, generatePost} from './factories';
import {generateArray} from './helpers';

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
            user._id = user.id;
            delete user.id;
            user.profile = generateProfile();
            user.posts = [generatePost(), generatePost()];
            const serializedUser = JAOResource.create('users')
                .id('_id')
                .include([])
                .attributes(['email'])
                .relationships(['profile'])
                .serialize(user);

            expect(serializedUser).to.deep.equal({
                data: {
                    id: user._id,
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
            user.posts = [generatePost(), generatePost(), generatePost()];
            const serializedUser = JAOResource.create('users')
                .insideSpecs({
                    profile: {
                        attributes: ['name']
                    },
                    posts: {
                        type: 'post',
                        attributes: ['title'],
                    }
                })
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
                                return {
                                    id: post.id,
                                    type: 'post'
                                }
                            })
                        }
                    },
                },
                included: _.concat([
                    {
                        type: 'profile',
                        id: user.profile.id,
                        attributes: {
                            name: user.profile.name
                        }
                    }], _.map(user.posts, (post) => {
                        return {
                            type: 'post',
                            id: post.id,
                            attributes: {
                                title: post.title
                            }
                        }
                }))
            })
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

        it("specifying embed relationships like `a.b.c` should work", () => {
            const user = generateUser();
            user.friends = generateArray(1, 1, () => {
                const friend = generateUser();
                friend.profile = generateProfile();
                friend.posts = generateArray(1, 1, () => generatePost());
                return friend;
            });
            user.posts = generateArray(1, 1, () => generatePost());
            const serializedUser = JAOResource.create('users')
                .insideSpecs({friends: 'users'})
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
                        friends: {
                            data: _.map(user.friends, (friend) => {
                                return {
                                    id: friend.id,
                                    type: 'users'
                                }
                            })
                        },
                        posts: {
                            data: _.map(user.posts, (post) => {
                                return {
                                    id: post.id,
                                    type: 'posts'
                                }
                            })
                        }
                    },
                },
                included: _.flatten(_.concat(
                    _.map(user.friends, (friend) => { // include ember `user.friends.profile` relationship
                        return {
                            id: friend.profile.id,
                            type: 'profile',
                            attributes: {
                                name: friend.profile.name,
                                surname: friend.profile.surname
                            }
                        };
                    }),
                    _.map(user.friends, (friend) => { // include ember `user.friends.posts` relationship
                        return _.map(friend.posts, (post) => {
                            return {
                                id: post.id,
                                type: 'posts',
                                attributes: {
                                    title: post.title
                                }
                            }
                        })
                    }),
                    _.map(user.friends, (friend) => {
                        return {
                            id: friend.id,
                            type: 'users',
                            attributes: {
                                email: friend.email,
                                passwordHash: friend.passwordHash
                            },
                            relationships: {
                                profile: {
                                    data: {
                                        id: friend.profile.id,
                                        type: 'profile'
                                    }
                                },
                                posts: {
                                    data: _.map(friend.posts, (post) => {
                                        return {
                                            id: post.id,
                                            type: 'posts'
                                        }
                                    })
                                }
                            }
                        }
                    }),
                    _.map(user.posts, (post) => {
                        return {
                            id: post.id,
                            type: 'posts',
                            attributes: {
                                title: post.title
                            }
                        }
                    }),
                ))
            });


        });
    });
});