# Filler

Saves a bunch of messages to the `rocketchat_message` collection directly. Supports only text messages.

# TODO
- Allow changing the Mongo Connection string via env
- Support attachments
- Fake rich messages (markdown)

# To run
```
USER_NAME=<username you want the messages to be attached to> USER_ID=<same> ROOM_ID=<Where the messages will land> REF_DATE=<Since when messages will be sent. A random date between REF_DATE and today will be used as `ts`> node index.js
```
