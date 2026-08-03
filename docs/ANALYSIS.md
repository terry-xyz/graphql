# GraphQl

* learn graphql: https://graphql.org/learn/

* graphql endpoint: https://((DOMAIN))/api/graphql-engine/v1/graphql

## Objectives

* query your own data to populate your profile page

* create a login page

* profile must display three pieces of information:

    * Basic user identification
    * XP amount
    * grades
    * audits
    * skills

## Instructions

* it must have a statistic section where you can generate graphs to see more about your journey and achievements

* This graph must be done using SVG

* at least two different statistic graphs for the data given

* (NOTE) Using SVG you can create several types of graphs including interactive graphs and animated graph

* possible combinations for the creation of the graphs:

    * XP earned in a time period (progress over time)
    * XP earned by project
    * Audit ratio
    * Projects PASS and FAIL ratio
    * Piscine (JS/Go) stats
        * PASS and FAIL ratio
        * Attempts for each exercise

* Any other information you desire to display is welcome and will be noted

## Login Page

* need a JWT to access the GraphQL API. A JWT can be obtained from the signin endpoint (https://((DOMAIN))/api/auth/signin)

* You may make a POST request to the signin endpoint, and supply your credentials using Basic authentication, with base64 encoding.

* Your login page must function with both:

    * username:password
    * email:password

* must provide a method to log out.

* When making GraphQL queries, you'll supply the JWT using `Bearer` authentication. It will only allow access to the data belonging to the authenticated user.

    You may inspect the JWT to discover the ID of the authenticated user.

## Hosting

* for example: github-pages, netlify and so on. You are free to choose the hosting place

### Here are a selection of interesting tables and columns which are exposed via GraphQL:

- **user** table:

  This table will have information about the user.

  | id  |   login |
  | --- | ------: |
  | 1   | person1 |

- **transaction** table:

  This table will give you access to `XP` and through `user` table you can get to the `audits ratio` as well.

  | id  | type | amount | objectId | userId |                        createdAt |                   path |
  | --- | :--: | -----: | -------: | -----: | -------------------------------: | ---------------------: |
  | 1   |  xp  |    234 |       42 |      1 | 2021-07-26T13:04:02.301092+00:00 | /madere/div-01/graphql |
  | 2   |  xp  |   1700 |        2 |      1 | 2021-07-26T13:04:02.301092+00:00 | /madere/div-01/graphql |
  | 3   |  xp  |    175 |       64 |      1 | 2021-07-26T13:04:02.301092+00:00 | /madere/div-01/graphql |

- **progress** table:

  | id  | userId | objectId | grade |                        createdAt |                        updatedAt |                        path |
  | --- | :----: | -------: | ----: | -------------------------------: | -------------------------------: | --------------------------: |
  | 1   |   1    |     3001 |     1 | 2021-07-26T13:04:02.301092+00:00 | 2021-07-26T13:04:02.301092+00:00 | /madere/piscine-go/quest-01 |
  | 2   |   1    |      198 |     0 | 2021-07-26T13:04:02.301092+00:00 | 2021-07-26T13:04:02.301092+00:00 | /madere/piscine-go/quest-01 |
  | 3   |   1    |      177 |     1 | 2021-07-26T13:04:02.301092+00:00 | 2021-07-26T13:04:02.301092+00:00 | /madere/piscine-go/quest-01 |

- **result** table:

  Both `progress` and `result` table will give you the student progression.

  | id  | objectId | userId | grade | type |                        createdAt |                        updatedAt |                   path |
  | --- | -------: | -----: | ----: | ---: | -------------------------------: | -------------------------------: | ---------------------: |
  | 1   |        3 |      1 |     0 |      | 2021-07-26T13:04:02.301092+00:00 | 2021-07-26T13:04:02.301092+00:00 | /madere/div-01/graphql |
  | 2   |       23 |      1 |     0 |      | 2021-07-26T13:04:02.301092+00:00 | 2021-07-26T13:04:02.301092+00:00 | /madere/div-01/graphql |
  | 3   |       41 |      1 |     1 |      | 2021-07-26T13:04:02.301092+00:00 | 2021-07-26T13:04:02.301092+00:00 | /madere/div-01/graphql |

- **object** table:

  This table will give you information about all objects (exercises/projects).

  | id  | name |     type | attrs |
  | --- | ---: | -------: | ----: |
  | 1   |    0 | exercise |  `{}` |
  | 2   |    0 |  project |  `{}` |
  | 3   |    1 | exercise |  `{}` |

For more information about the tables and their columns you check out the [database-structure](http://public.01-edu.org/docs/db/database-structure) and [database-relations](http://public.01-edu.org/docs/db/db-relations).

**You must use all the types of querying present** (_normal_, _nested_ and using _arguments_), do not forget that you can use the types together or separately.

## Examples

Lets take for instance the table `user` and try to query it:

```js
{
  user {
    id
  }
}
```

This simple query will return an array with the `id` of the authenticated user. If you wanted the `login`,
you could just add the attribute to the query like so:

```js
{
  user {
    id
    login
  }
}
```

Here is another example of a query using the table `user`:

```js
{
  object(where: { id: { _eq: 3323 }}) {
    name
    type
  }
}
```

> Note: that for this query the introduction of variables (arguments) is **required**, so it will return just one object with the `id` equal to `3323`.

In GraphQL, the usage of arguments are specified in the schema. You can see the available query parameters by introspecting the API.

> If you're logged in to the platform, you may access [GraphiQL](<https://((DOMAIN))/graphiql/>) to more easily explore the schema.

Example of nesting using the `result` and `user` table:

```js
{
  result {
    id
    user {
      id
      login
    }
  }
}
```

For this example we ask for the results `id` and `user` that is associated to the `result`, requesting the user `login` and his `id`.