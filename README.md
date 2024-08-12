# Filler

Runs a `filler` which goal is to populate data into a defined database.
# Fillers
A filler is a JS file that exports an async function (`module.exports = async (db) => {}`). Runner tries to find a matching filler by reading the `fillers` folder. New fillers may be added with any lowercase name and then executed by the runner.

Fillers receive the DB object which they can use to query & insert documents into a database defined by the env `MONGO_URI`. It's up to the filler to receive & validate any other env variables. There's no limitation inside the returned function.

Currently, just 2 actions are supported: fill `messages` & `users` (with subscriptions). You can extend them to be more!

# To run
```
(This example uses the `Messages` filler)

USER_NAME=<username you want the messages to be attached to> USER_ID=<same> ROOM_ID=<Where the messages will land> REF_DATE=<Since when messages will be sent. A random date between REF_DATE and today will be used as `ts`> node index.js messages
```

# To run (any other filler)

```
node index.js <lowercased filler name>
```

# Examples

1. Run `filler` to publish 150K messages on #general channel starting from July 1st, 2024 using `rocketchat.internal.admin.test` as the user.
```
REF_DATE="2024-07-01T17:46:26.590Z" USER_ID="rocketchat.internal.admin.test" USER_NAME="rocketchat.internal.admin.test" ROOM_ID="GENERAL" MESSAGES=150000 MONGO_URI=mongodb://localhost:27017/rocket?directConnection=true DB=rocket node index.js messages
```
