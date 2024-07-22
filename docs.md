# Parse Server API Documentation

## Overview

This document outlines the cloud functions available in the Parse Server application for managing rooms and messages.

## Cloud Functions

### 1. `createRoom`

* **Description** : Creates a new room.
* **Parameters** :
* `name` (String): The name of the room.
* `createdBy` (String): The user ID of the creator.
* `users` (Array): An array of user IDs included in the room.
* **Returns** : The newly created room object.

 **Example Call** :

javascript

Copy Code

```javascript
Parse.Cloud.run('createRoom', { name: 'Room 1', createdBy: 'userId1', users: ['userId1'] });
```

---

### 2. `addUserToRoom`

* **Description** : Adds a user to an existing room.
* **Parameters** :
* `roomId` (String): The ID of the room.
* `userId` (String): The ID of the user to be added.
* **Returns** : The updated room object.

 **Example Call** :

javascript

Copy Code

```javascript
Parse.Cloud.run('addUserToRoom', { roomId: 'roomId1', userId: 'userId2' });
```

---

### 3. `fetchChatMessages`

* **Description** : Fetches chat messages from a specific room with pagination.
* **Parameters** :
* `roomId` (String): The ID of the room.
* `page` (Number, optional): The page number to fetch (default is 1).
* `limit` (Number, optional): The number of messages to retrieve per page (default is 50).
* **Returns** : An object containing chat messages, pagination details, and total messages.

 **Example Call** :

javascript

Copy Code

```javascript
Parse.Cloud.run('fetchChatMessages', { roomId: 'roomId1', page: 1, limit: 10 });
```

---

### 4. `createPrivateRoom`

* **Description** : Creates a private room between two users.
* **Parameters** :
* `otherUsername` (String): The username of the other user in the private room.
* `roomName` (String): The name of the private room.
* **Returns** : The newly created private room object.

 **Note** : Requires user authentication.

 **Example Call** :

javascript

Copy Code

```javascript
Parse.Cloud.run('createPrivateRoom', { otherUsername: 'otherUser', roomName: 'Private Room' });
```

---

### 5. `listPrivateRooms`

* **Description** : Lists all private rooms the specified user is part of.
* **Parameters** :
* `userId` (String): The ID of the user whose private rooms are to be listed.
* **Returns** : An array of private room objects.

 **Example Call** :

javascript

Copy Code

```javascript
Parse.Cloud.run('listPrivateRooms', { userId: 'userId1' });
```

---

### 6. `createPublicRoom`

* **Description** : Creates a public room.
* **Parameters** :
* `name` (String): The name of the room.
* `createdBy` (String): The user ID of the creator.
* **Returns** : The newly created public room object.

 **Example Call** :

javascript

Copy Code

```javascript
Parse.Cloud.run('createPublicRoom', { name: 'Public Room 1', createdBy: 'userId1' });
```

---

### 7. `listRooms`

* **Description** : Lists all public rooms with pagination.
* **Parameters** :
* `page` (Number, optional): The page number to fetch (default is 1).
* `limit` (Number, optional): The number of rooms to retrieve per page (default is 10).
* **Returns** : An object containing public rooms, pagination details, and total rooms.

 **Example Call** :

javascript

Copy Code

```javascript
Parse.Cloud.run('listRooms', { page: 1, limit: 10 });
```
