// TODO: random values: fakerjs, chancejs

factory.mixin('uniquable', (filler) => {
    return {id: filler.sequence()}
});

factory.register('user', (filler) => {
    return filler.data({
        email: filler.internet.email(),
        passwordHash: filler.random.uuid(),
        profile: filler.belongsTo('profile'),
        posts: filler.hasMany('post', 2, 6),
        comments: filler.hasMany('comments', {through: 'posts'})
    }).uniquable()
});

factory.register('profile', (filler) => {
    return {
        id: filler.sequence(),
        name: filler.name.firstName(),
        surname: filler.name.lastName(),
        user: filler.belongsTo('user')
    }
});

factory.registerInstance('user', (filler) => {
    return {
        id: 1,
        email: 'landtest@gmail.com'
    };
});

factory.registerInstance('profile', (filler) => {
    return {
        id: 1,
        name: 'David',
        surname: 'Omengo',
        user: filler.instance('user', 1)
    };
});

factory.register('tag', (filler) => {
    return filler.wrap(Tag, {
        id: filler.sequence(),
        title: filler.random.arrayElement(['warning', 'danger', 'success']),
        isForced: filler.trait(filler.random.boolean()),
        isMagic: filler.trait((parent) => !parent) // reverse value
    });
});

factory.register('banks', (filler) => {
    return filler.extend('financing', {
        accounts: this.hasMany('accounts')
    })
});

factory.register('post', (filler) => {
    return {
        id: filler.sequence(),
        title: filler.name.title(),
        body: filler.lorem.text(),
        comments: filler.hasMany('comments', 0, 20)
    }
});

factory.register('comment', (filler) => {
    return {
        id: filler.sequence(),
        body: filler.lorem.text(),
        rate: filler.random.number({min: 0, max: 10}),
        postId: filler.relationKey('post'),
        belongsTo: filler.belongsTo('post')
    }
});

factory.get('user')
    .with(':all', {comments: [0, 10]})
    .without('posts')
    .pick();

factory.get('user')
    .attributes('id', 'email')
    .with('profile', (profileBuilder) => {
        profileBuilder.attributes('id', 'name')
    })
    .with('comments', 10, {ids: [1,2,3], records: [myComment1, myComment2, myComment3]})
    .with('posts', 2, 20)
    .pick();
