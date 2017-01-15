import chai from 'chai';
import {generateUser, generateProfile, generatePost} from './factories';

import JAOPicker from 'jao/jao-picker';

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
    });
});