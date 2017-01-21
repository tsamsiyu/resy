import chai from 'chai';
import {generateUser, generateProfile, generatePost} from './factories';

import JAOPicker from 'jao/jao-picker';
import JAOResource from 'jao/jao-resource';
import JAOSpec from 'jao/jao-spec';
import ResMan from 'resource-manager';

const {expect} = chai;

describe("JAOPicker", () => {
    describe('pick data without predefined spec', () => {
        it('should pick id,type,attributes', () => {
            const user = generateUser();
            const picker = JAOPicker.create(user, 'users');

            expect(picker.getId()).to.equal(user.id);
            expect(picker.getType()).to.equal('users');
            expect(picker.getAttributes()).to.deep.equal({
                email: user.email,
                passwordHash: user.passwordHash
            });
        });

        it('should pick relationships', () => {
            const user = generateUser();
            user.profile = generateProfile();
            user.posts = [generateUser(), generatePost()];
            const picker = JAOPicker.create(user, 'users');

            expect(picker.getRelationshipsIndexes()).to.deep.equal({
                profile: {
                    id: user.profile.id,
                    type: 'profile'
                },
                posts: user.posts.map((post) => {
                    return {
                        type: 'posts',
                        id: post.id
                    }
                })
            });
        });

        it("should use specs from resource-manager if that is specified", () => {
            const resMan = new ResMan(JAOResource, JAOSpec);
            resMan.registerSpec('users', {
                id: '_id',
                attributes: 'email',
                relationships: 'profile'
            });
            const user = generateUser();
            user._id = user.id;
            delete user.id;
            const serializedUser = resMan.getResource('users').serialize(user);

            expect(serializedUser).to.deep.eql({
                data: {
                    id: user._id,
                    type: 'users',
                    attributes: {
                        email: user.email
                    }
                }
            });
        });

        it("option 'managerStoreOnly' equal to `false` will include subobjects if they was not specified in spec", () => {
            const resMan = new ResMan(JAOResource, JAOSpec);
            resMan.registerSpec('users', {
                id: '_id',
                attributes: 'email',
                relationships: 'profile',
                included: [],
                ignored: 'posts'
            });
            const user = generateUser();
            user._id = user.id;
            delete user.id;
            user.profile = generateProfile();
            user.posts = [generatePost(), generatePost()];
            const serializedUser = resMan.getResource('users').serialize(user, {
                managerStoreOnly: false
            });

            expect(serializedUser).to.deep.eql({
                data: {
                    id: user._id,
                    type: 'users',
                    attributes: {
                        email: user.email
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

        it("option 'managerStoreOnly' equal to `true` will ignore subobjects if they was not specified in spec", () => {
            const resMan = new ResMan(JAOResource, JAOSpec);
            resMan.registerSpec('users', {
                id: '_id',
                attributes: 'email',
                relationships: 'profile',
            });
            const user = generateUser();
            user._id = user.id;
            delete user.id;
            user.profile = generateProfile();
            user.posts = [generatePost(), generatePost()];
            const serializedUser = resMan.getResource('users').serialize(user, {
                managerStoreOnly: true
            });

            expect(serializedUser).to.deep.eql({
                data: {
                    id: user._id,
                    type: 'users',
                    attributes: {
                        email: user.email
                    }
                }
            });
        });
    });
});