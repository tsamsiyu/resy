import faker from 'faker';

export const generatePost = () => {
    return {
        id: faker.random.uuid(),
        title: faker.name.title()
    }
};

export const generateProfile = () => {
    return {
        id: faker.random.uuid(),
        name: faker.name.firstName(),
        surname: faker.name.lastName()
    }
};

export const generateUser = () => {
    return {
        id: faker.random.uuid(),
        email: faker.internet.email(),
        passwordHash: faker.random.uuid(),
    };
};