import chai from 'chai';
import _ from 'lodash';
import {generateUser, generateProfile, generatePost, generateRole, generateComment} from './factories';
import {generateArray} from './helpers';

import JAOResource from 'jao/jao-resource';
import JAOSpec from 'jao/jao-spec';

// require('fs').writeFile('./test.json', JSON.stringify(serializedUser.included, null, 4));

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

        it("serializer should resolve the whole relationship tree", () => {
            const user = generateUser();
            user.friends = generateArray(2, 4, () => {
                const friend = generateUser();
                friend.profile = generateProfile();
                friend.posts = generateArray(2, 4, () => generatePost());
                return friend;
            });
            user.posts = generateArray(2, 4, () => generatePost());
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

        it("`ignored` and `included` should work for embed specs", () => {
            const user = generateUser();
            user.friends = generateArray(2, 4, () => {
                const friend = generateUser();
                friend.profile = generateProfile();
                friend.role = generateRole();
                friend.posts = generateArray(2, 4, () => generatePost());
                return friend;
            });

            const serializedUser = JAOResource
                .create('users')
                .insideSpecs({friends: {type: 'users', ignored: 'posts', included: ['profile']}})
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
                    },
                },
                included: _.flatten(_.concat(
                    _.map(user.friends, (friend) => {
                        return {
                            id: friend.profile.id,
                            type: 'profile',
                            attributes: {
                                name: friend.profile.name,
                                surname: friend.profile.surname
                            }
                        };
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
                                role: {
                                    data: {
                                        id: friend.role.id,
                                        type: 'role'
                                    }
                                }
                            }
                        }
                    })
                ))
            });
        });

        it("passing the instance of JAOSpec to inside specs should work", () => {
            const profileSpec = new JAOSpec('userProfile', {id: '_id', attributes: 'name'});
            const user = generateUser();
            user.profile = generateProfile();
            user.profile._id = user.profile.id;
            delete user.profile.id;
            const serializedUser = JAOResource
                .create('users')
                .insideSpecs({profile: profileSpec})
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
                                id: user.profile._id,
                                type: 'userProfile'
                            }
                        },
                    },
                },
                included: [
                    {
                        type: 'userProfile',
                        id: user.profile._id,
                        attributes: {
                            name: user.profile.name
                        }
                    }
                ]
            });
        });

        it("serialization of collection should work", () => {
            const users = generateArray(2, 4, () => {
                const user = generateUser();
                user.profile = generateProfile();
                return user;
            });
            const serializedUsers = JAOResource
                .create('users')
                .attributes('email')
                .insideSpecs({
                    profile: {attributes: 'surname'}
                })
                .serialize(users);

            expect(serializedUsers).to.deep.equal({
                data: _.map(users, (user) => {
                    return {
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
                }),
                included: _.map(users, (user) => {
                    return {
                        id: user.profile.id,
                        type: 'profile',
                        attributes: {
                            surname: user.profile.surname
                        }
                    }
                })
            });
        });

        it("check serialization with big tree", () => {
            const user = generateUser(); // user
            user.friends = generateArray(2, 4, () => { // user.friends
                const friend = generateUser();
                friend.posts = generateArray(2, 4, () => { // user.friends.posts
                    const post = generatePost();
                    post.comments = generateArray(2, 4, () => generateComment()); // user.friends.posts.comments
                    return post;
                });
                return friend;
            });
            user.posts = generateArray(1, 1, () => {  // user.posts
                const post = generatePost();
                post.comments = generateArray(1, 1, () => generateComment()); // user.comments
                return post;
            });

            const serializedUser = JAOResource
                .create('users')
                .insideSpecs({
                    posts: {
                        insideSpecs: {
                            comments: 'userComments'
                        }
                    }
                })
                .serialize(user);

            const expectedResult = {
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
                                    type: 'friends'
                                };
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
                    }
                },
                included: _.concat(
                    _.flatten(_.map(user.friends, (friend) => {
                        return _.flatten(_.map(friend.posts, (post) => {
                            return _.map(post.comments, (comment) => {
                                return {
                                    id: comment.id,
                                    type: 'comments',
                                    attributes: {
                                        title: comment.title,
                                        body: comment.body,
                                        rate: comment.rate
                                    }
                                };
                            });
                        }))
                    })),
                    _.flatten(_.map(user.friends, (friend) => {
                        return _.map(friend.posts, (post) => {
                            return {
                                id: post.id,
                                type: 'posts',
                                attributes: {
                                    title: post.title
                                },
                                relationships: {
                                    comments: {
                                        data: _.map(post.comments, (comment) => {
                                            return {
                                                id: comment.id,
                                                type: 'comments'
                                            }
                                        })
                                    }
                                }
                            };
                        })
                    })),
                    _.map(user.friends, (friend) => {
                        return {
                            id: friend.id,
                            type: 'friends',
                            attributes: {
                                email: friend.email,
                                passwordHash: friend.passwordHash
                            },
                            relationships: {
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
                    _.flatten(_.map(user.posts, (post) => {
                        return _.map(post.comments, (comment) => {
                            return {
                                id: comment.id,
                                type: 'userComments',
                                attributes: {
                                    title: comment.title,
                                    body: comment.body,
                                    rate: comment.rate
                                }
                            }
                        })
                    })),
                    _.map(user.posts, (post) => {
                        return {
                            id: post.id,
                            type: 'posts',
                            attributes: {
                                title: post.title
                            },
                            relationships: {
                                comments: {
                                    data: _.map(post.comments, (comment) => {
                                        return {
                                            id: comment.id,
                                            type: 'userComments'
                                        }
                                    })
                                }
                            }
                        }
                    }),
                )
            };
            expect(serializedUser).to.deep.eql(expectedResult);
        });
    });
});