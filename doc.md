# Parse Server Cloud Functions Documentation

## Classes

* **Room** : Represents a chat room.
* **Message** : Represents a message within a chat room.

## Cloud Functions

### 1. createPublicRoom

Creates a new public room.

**Parameters:**

* `name`: String - The name of the room
* `createdBy`: String - The identifier of the user creating the room

**Returns:** The newly created Room object

**Errors:**

* Throws a DUPLICATE_VALUE error if a room with the same name already exists

**Example:**

javascript

Copy Code

```javascript
const newRoom = await Parse.Cloud.run('createPublicRoom', {
  name: 'General Discussion',
  createdBy: 'user123'
});
console.log('New room created:', newRoom);
```

### 2. listRooms

Lists all public rooms with pagination.

**Parameters:**

* `page`: Number (optional, default: 1) - The page number
* `limit`: Number (optional, default: 10) - Number of rooms per page

**Returns:**

* `results`: Array of room objects
* `page`: Current page number
* `totalPages`: Total number of pages
* `total`: Total number of rooms

**Example:**

javascript

Copy Code

```javascript
const rooms = await Parse.Cloud.run('listRooms', {
  page: 1,
  limit: 20
});
console.log('Rooms:', rooms.results);
console.log('Total pages:', rooms.totalPages);
```

### 3. fetchChatMessages

Fetches messages for a specific room with pagination.

**Parameters:**

* `roomId`: String - The ID of the room
* `page`: Number (optional, default: 1) - The page number
* `limit`: Number (optional, default: 50) - Number of messages per page

**Returns:**

* `results`: Array of message objects with user details
* `page`: Current page number
* `totalPages`: Total number of pages
* `total`: Total number of messages

**Example:**

javascript

Copy Code

```javascript
const messages = await Parse.Cloud.run('fetchChatMessages', {
  roomId: 'room123',
  page: 1,
  limit: 50
});
console.log('Messages:', messages.results);
```

### 4. createMessage

Creates a new message in a room.

**Parameters:**

* `roomId`: String - The ID of the room
* `text`: String - The message text
* `imageUrl`: String (optional) - URL of an attached image
* `userId`: String - The ID of the user sending the message
* `username`: String - The username of the user sending the message

**Returns:** The newly created message object

**Example:**

javascript

Copy Code

```javascript
const newMessage = await Parse.Cloud.run('createMessage', {
  roomId: 'room123',
  text: 'Hello, world!',
  imageUrl: 'https://example.com/image.jpg',
  userId: 'user123',
  username: 'johndoe'
});
console.log('New message:', newMessage);
```

### 5. createPrivateRoom

Creates a new private room between two users or returns an existing one.

**Parameters:**

* `otherUsername`: String - The username of the other user
* `roomName`: String - The name of the private room
* `currentUsername`: String - The username of the current user

**Returns:** The private room object

**Example:**

javascript

Copy Code

```javascript
const privateRoom = await Parse.Cloud.run('createPrivateRoom', {
  otherUsername: 'janedoe',
  roomName: 'Private Chat: John & Jane',
  currentUsername: 'johndoe'
});
console.log('Private room:', privateRoom);
```

### 6. listPrivateRooms

Lists all private rooms for a specific user.

**Parameters:**

* `username`: String - The username of the user

**Returns:** Array of private room objects

**Example:**

javascript

Copy Code

```javascript
const privateRooms = await Parse.Cloud.run('listPrivateRooms', {
  username: 'johndoe'
});
console.log('Private rooms:', privateRooms);
```

### 7. addUserToRoom

Adds a user to a room.

**Parameters:**

* `roomId`: String - The ID of the room
* `userId`: String - The ID of the user to add

**Returns:** The updated Room object

**Example:**

javascript

Copy Code

```javascript
const updatedRoom = await Parse.Cloud.run('addUserToRoom', {
  roomId: 'room123',
  userId: 'user456'
});
console.log('Updated room:', updatedRoom);
```

### 8. deleteRoom

Deletes a room and all its associated messages.

**Parameters:**

* `roomId`: String - The ID of the room to delete

**Returns:** A success message

**Errors:**

* Throws an INVALID_PARAMETER error if roomId is not provided
* Throws an OBJECT_NOT_FOUND error if the room doesn't exist

**Example:**

javascript

Copy Code

```javascript
const result = await Parse.Cloud.run('deleteRoom', {
  roomId: 'room123'
});
console.log('Delete result:', result);
```

## Usage Notes

1. All functions use the `useMasterKey: true` option, ensuring they have full access rights.
2. The `createPrivateRoom` function creates a unique room identifier and sets up ACL for privacy.
3. Error handling is implemented in most functions to provide clear feedback on issues.
4. The `fetchChatMessages` function includes user details with each message, using a default image URL if a user's profile image is not available.
5. Pagination is implemented in `listRooms` and `fetchChatMessages` for efficient data loading.Ï
