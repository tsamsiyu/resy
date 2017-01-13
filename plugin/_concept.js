const postResourceSpec = registerResourceSpecification('posts', {});

const commentResourceSpec = parentCommendResourceSpec.extend((spec) => {
    spec.excludeAttribute('readable');
});

const userResourceSpec = registerResourceSpecification('users', {
    id: 'id',
    attributes: ['firstName', 'lastName', 'email', 'authKey', 'salt'],
    hasMany: ['posts', 'posts.comments'], // to include nested relationships list them here, relationships of relationships will not be included
    hasOne: ['profile'],
    included: ['profile'],
    serializers: { // you can override default serializers
        'posts': postResourceSpec,
        'posts.comments': commentResourceSpec,
        'library': 'books' // map name of relationship to type of resource
    }
});

const userResource = userResourceSpec.create(mock);
userResource
    .include(['profile', 'posts'])
    .includeAttributeIf('email', () => {})
    .excludeAttributes(['a', 'b'])
    .excludeAttributesIf('a', () => {})
    .serialize();

/**
 * Expected formats: filters[username]=valter&order[username]=desc
 * TODO: think about creation of resourceSpecification for fetched data
 */
class UsersProvider extends MongooseDataProvider {
    static model() { // you must specify name of model for which query will be applied
        return 'users';
    }
    static resourceSpecification() { // you can specify name of default resource spec
        return 'users';
    }
    filtersRules() {
        return {
            type: {range: ['1', '2']},
            email: {email: true}
        }
    }
    allowedFilters() {
        return 'all';
        return {only: ['email', 'username', 'type', 'role', 'range']};
        return {exclude: ['email', 'username', 'type']};
    }
    allowedSorters() {
        return 'all';
        return {only: ['email', 'username']};
        return {exclude: ['topic']};
    }
    fields() {
        return ['email', 'username', 'type', 'role', 'range'];
    }
    filtersQuery() {
        return this
            .select()
            .filterById()
            .filter({memberLevel: 7})
            .filterIfPresent('email')
            .filterIfPresent('in', 'type')
            .filterIfPresent({login: 'username'})
            .defaultOrder({username: 'asc', type: 'desc'}); // this order will if sorters is not present
    }
}

const usersProvider = new UsersProvider(ctx.params.id, ctx.query);
usersProvider
    .useSpecification('users') // you can change specification for provider
    .resourcify() // this will contain links and meta as well
    .serialize();


/**
 * Resource Specification -
 *
 */