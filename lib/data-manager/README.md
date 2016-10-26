### Relationships
If we create a record that has a collection of relationships:
    * if contained entities have an id, it will not create them
    * if contained entities do NOT have an id, it will create them

This will create User and Pet:
```js
{
    id: 1,
    name: 'Pepe',
    pets: [
        name: 'Michu',
        type: 'Cat',
        owner: 1
    ]
}
```

This will only create User and no Pet:
```js
{
    id: 1,
    name: 'Pepe',
    pets: [
        id: 1
        name: 'Michu',
        type: 'Cat',
        owner: 1
    ]
}
```

In this simple scenario, we can get around by creating all users first, and then create all pets referencing to their _owner_ by id.


```js
app.dataManager.importFileAsModels('user','/seed/users.json').then(console.log);
```

```js
app.dataManager.importFileAsModels('credential', '/seed/pets.json').then(console.log);
```
