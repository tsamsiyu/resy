// TODO: random values: fakerjs, chancejs

factory.register('user', (filler) => {
    return {
        id: filler.sequence(),
        email: filler.internet.email(),
        passwordHash: filler.random.uuid(),
        profile: filler.belongsTo('profile'),
        posts: filler.hasMany('post', 2, 6),
        comments: filler.hasMany('comments', {through: 'posts'})
    }
});

factory.register('profile', (filler) => {
    return {
        id: filler.sequence(),
        name: filler.name.firstName(),
        surname: filler.name.lastName(),
        user: filler.belongsTo('user')
    }
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
    .with('comments', 10)
    .with('posts', 2, 20)
    .pick();
