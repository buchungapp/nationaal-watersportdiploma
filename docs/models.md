# Models

Models are the data structures that we use to transfer data in the application. There are four kinds of models:

- database models
- business models
- view models
- api models

The first two are global to the nawadi system. The last two are local to the web application and the api.

## Mapping

Models of one kind can be transformed into another kind. This is called mapping. This is an example of mapping:

```ts
const dbParentModel = db.getParentModel(key)
const dbChildModels = db.getChildModels(key)

const businessModel = {
  id: model.id,
  name: model.name ?? undefined,
  children: dbChildModels.map((model) => ({
    id: model.id,
    name: model.name ?? undefined,
  })),
}
```

## Flow

Models usually originate in the database. They can be retrieved or stored as databasemodels. The database models that are read or written to the database are mapped to and from business objects. These business objects are used in the web and api application.

In the api application the business objects are mapped to and from api objects before they can be used. The same is true for the web application, here the business objects are translated to ui objects before they can be used.

The UI layer uses both the API and core (business) layer. This is because we want to "eat our own dogfood". The UI will use the API layer mostly, and in some rare cases the core.

Diagram:

```
-> = read

                          _______
                          |     |
______      ________   -> | API |-
|    |      |      |  /   |_____| \
| DB | ---> | core | /            |  
|____|      |______| \            \   ______
                      \            -> |    |
                       -------------> | UI |
                                      |____|
```

## Validation

Models need to be validated! For instance an email address needs to be in a specific format. Or a reference to a user needs to be valid. Validation can happen in any layer, but it is best to validate as close to the end user as we can get.

This is best because it will make for a snappy user experience and misuse of the system is not propagetes through the entire system, but caught in a top layer. Those layers are easy to scale and therefore less vulnerable to misuse.

Validation errors should bubble up to the end user through the layers. This means that every layer should have it's own errors, that can also encapsulate errors from the layer above.

## Caching

In every layer caching may occur. This could improve performance of the system. Usually caching happens in the database or business layer. Remember to properly invalidate cache! This is incredibly important and hard to debug if it fails!

## CQRS

Command-Query-Responsibility-Segregation is a principle that seperates read and write concerns. This principle uses the term query for a read and command for a write. A command may alter state, a query may fetch state.

One good example where CQRS shines is when updating a password. If we want to do that we might send some token and the new password. This is a command. If we query the users credentials we only retrieve the user's username and never the password.

If we would implenent this flow respecting a strict REST principle, this was impossible.

This might mean that we have separate read or write models! Or maybe even a separate create and update model! This should nog be a problem.

I highly recommend to adopt this pattern in all layers, except the database layer.

## Types

Here we explain the typical characteristics of the various model types

### Database

Database models are the only models that are really persisted. They are stored in the database. They are the rows in the tables of the database.

These models are optimized for storage, this could mean that they are compact or fast to read or write. These models represent a single source of truth. And possible a single point of failure.

The database model should not change often. And if it does change this should be carefully done via a migration. It is hard and often even impossible to revert this migration without any data loss, so it is very important that every version after a migration is backwards compatible with the previous version to prevent downtime and dataloss. Also this will help developers sleep at night.

Validation in the database is usually simple and implicit. Validation will occur for data types in columns, but there may also be some explicit validation via check constraints or triggers. Most interesting is the validation of data integrity by foreign keys and unique indexes. This is the best place for this kind of validation.

### Business

These are models that we can "work with". They are always derived from the database models, or transformed into database models when writing.

Database models are optimized for storage, and usually not that easy to work with. This is one reason for business objects to exist. They provide an easy way to work with the underlying data layer.

Also these objects may provide an advanced layer of validation. Validation that cannot be achieved in the data layer should go here. Do note that validation errors in the data layer should also be translated into validation errors in the business layer.

The business models can be seen as the main entrypoint to the data in our application so documentation is a bit more important here.

### API

These models are specific the the API and should be optimized for data transfer and usage of the API. One very important aspect of these models is that they must always be backwords compatible, forever! Ok, or at leastg until they are not used anymore. This should be measured and is very important for the success of the API. If an API suddenly stops working, this could be disastrous for it's reputation and will make the clients using the API very unhappy.

Some duplication is allowed, but for the sake of data transfer size, it might not be a good idea.

Another interesting aspect of these models is that tey are exposed to the public! So they need proper documentation and they need to be accessible only to people that should have access.

### UI

The UI, or web interface uses view models to build a user interface. These models are derived from the API and core. Their sole purpose is to render in a view. Duplication is ok if this makes rendering easier.

These models should not be accessible publicly, but, because the web UI is publicly available, the models might also be. This needs to be considered when using them.

## Implementation

This is how we implement or want to implement the models.

### Database

For the database models we use an ORM, drizzle. The models are implemented as implicit interfaces. This could be a problem because we cannot refer to them from the business layer. One way to solve this could be to create a type for each model that is the deferred interface. Example:

```ts
export const location = pgTable('location', {
  id: uuid('id').primaryKey().notNull(),
  handle: text('handle').notNull(),
})

export type LocationRead = typeof location1.$inferSelect
export type LocationWrite = typeof location1.$inferInsert
```

It would be wise to first figure out if this is really useful, drizzle allows for flexible queries and that flexibility might be very useful in the business layer. The types are flexible then as well.

### Core (business)

For the business models we use zod for validation. We might want to infer types from zod like we might do in the database layer. But then again it might be better to generate interfaces and use them as a contract.

There might be some custom validation as well in this layer.

### API

The api models are all defined in JSON Schema, simple validation is in place and will be automatically done when the api is called.

### View models

View models are often implicit and this is no problem. Validation should be done via the models as well.
