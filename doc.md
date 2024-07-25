
# Documentation for Mimi Chat Application

## Overview

This documentation outlines the functionality of Mimi Chat Application, which enables users to communicate through public and private chat rooms. The application is built using Parse Server and provides cloud functions to manage various features like room creation, message sending, and user management.

## User Interface Overview

The application comprises two main sections:

1. **User Management**: This section allows users to log in or log out using their phone number and password.
2. **Chat Rooms**: Users can join public rooms or initiate private chats. The chat interface displays messages in real-time.

### Key UI Components

- **Login/Signup Form**: Input fields for phone number and password with a button to log in.
- **Rooms Section**: Displays public rooms and private chats. Users can create new rooms or initiate private chats with other participants.
- **Chat Screen**: Shows messages from the selected room. Users can send text messages, images, and audio messages.

## Cloud Functions

Cloud functions are utilized to handle various functionalities required by the application, such as room management and message handling.

### Public Room Functions

#### 1. Create a Public Room

**Function Name**: `createPublicRoom`

**Description**: Creates a new public chat room if a room with the same name does not already exist.

**Parameters**:

- `name` (String): The name of the room.
- `createdBy` (String): The user ID of the creator.

**Example Usage**:

```javascript
Parse.Cloud.run("createPublicRoom", { 
  name: "General Chat", 
  createdBy: "USER_ID_HERE" 
}).then((room) => {
  console.log("Room created successfully:", room);
}).catch((error) => {
  console.error("Error creating room:", error);
});
```

#### 2. List Rooms

**Function Name**: `listRooms`

**Description**: Retrieves a list of public chat rooms.

**Parameters**:

- `page` (Number): The page number for pagination (optional).
- `limit` (Number): The number of rooms to return (optional).

**Example Usage**:

```javascript
Parse.Cloud.run("listRooms", { page: 1, limit: 10 }).then((response) => {
  console.log("Rooms loaded:", response.results);
}).catch((error) => {
  console.error("Error loading rooms:", error);
});
```

#### 3. Fetch Chat Messages

**Function Name**: `fetchChatMessages`

**Description**: Fetches messages from a specific public room.

**Parameters**:

- `roomId` (String): The ID of the room from which to fetch messages.
- `page` (Number): The page number for pagination (optional).
- `limit` (Number): The number of messages to return (optional).

**Example Usage**:

```javascript
Parse.Cloud.run("fetchChatMessages", { 
  roomId: "ROOM_ID_HERE", 
  page: 1, 
  limit: 50 
}).then((response) => {
  console.log("Messages loaded:", response.results);
}).catch((error) => {
  console.error("Error loading messages:", error);
});
```

#### 4. Create a Message

**Function Name**: `createMessage`

**Description**: Sends a message to a specified public room.

**Parameters**:

- `roomId` (String): The ID of the room to send the message to.
- `text` (String): The message content (optional).
- `imageUrl` (String): URL of an image to attach (optional).
- `userId` (String): The user ID of the message sender.
- `username` (String): The username of the message sender.

**Example Usage**:

```javascript
Parse.Cloud.run("createMessage", { 
  roomId: "ROOM_ID_HERE", 
  text: "Hello, World!", 
  imageUrl: null, 
  userId: "USER_ID_HERE", 
  username: "USERNAME_HERE" 
}).then((message) => {
  console.log("Message sent:", message);
}).catch((error) => {
  console.error("Error sending message:", error);
});
```

#### 5. Delete a Room

**Function Name**: `deleteRoom`

**Description**: Deletes a public room and all associated messages.

**Parameters**:

- `roomId` (String): The ID of the room to delete.

**Example Usage**:

```javascript
Parse.Cloud.run("deleteRoom", { 
  roomId: "ROOM_ID_HERE" 
}).then((response) => {
  console.log("Room deleted successfully:", response.message);
}).catch((error) => {
  console.error("Error deleting room:", error);
});
```

## Private Room Functions

### Overview

Private rooms allow users to engage in one-on-one chats securely. Each private room is uniquely identified by the involved users, ensuring that only these users can access the chat.

### Functions for Private Rooms

#### 1. Create a Private Room

**Function Name**: `createPrivateRoom`

**Description**: Creates a new private chat room between two users if it doesn't already exist.

**Parameters**:

- `otherUsername` (String): The username of the other participant.
- `roomName` (String): The name of the room (e.g., "Private: User1 & User2").
- `currentUsername` (String): The username of the user creating the room.

**Example Usage**:

```javascript
Parse.Cloud.run("createPrivateRoom", { 
  otherUsername: "OtherUser", 
  roomName: "Private: User1 & OtherUser", 
  currentUsername: "User1" 
}).then((room) => {
  console.log("Private room created:", room);
}).catch((error) => {
  console.error("Error creating private room:", error);
});
```

#### 2. List Private Rooms

**Function Name**: `listPrivateRooms`

**Description**: Retrieves the list of private rooms for a specific user.

**Parameters**:

- `username` (String): The username of the user whose private rooms are to be retrieved.

**Example Usage**:

```javascript
Parse.Cloud.run("listPrivateRooms", { 
  username: "User1" 
}).then((rooms) => {
  console.log("Private rooms:", rooms);
}).catch((error) => {
  console.error("Error loading private rooms:", error);
});
```

#### 3. Join a Private Room

To join a private room selected by the user, you can utilize the `joinRoom` function as demonstrated.

**Example Usage**:

```javascript
function joinPrivateRoom(room) {
  // Assuming 'room' is an object representing the selected private room.
  joinRoom(room);
}

// Example of joining a private room
const selectedRoom = { id: "ROOM_ID_HERE", name: "Private: User1 & OtherUser", isPrivate: true };
joinPrivateRoom(selectedRoom);
```

### Additional Notes

- **Unique Room Identification**: Private rooms are created with a unique identifier based on the users involved. The system prevents the creation of duplicate rooms for the same user pairs.
- **User Permissions**: The access control list (ACL) settings ensure that only the two users can read and write in their private rooms.

## Summary of Cloud Functions

| Function Name         | Description                                        | Example Usage                                                                                                                               |
| --------------------- | -------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------- |
| `createPublicRoom`  | Creates a new public chat room.                    | `Parse.Cloud.run("createPublicRoom", { name: "General Chat", createdBy: "USER_ID_HERE" });`                                               |
| `listRooms`         | Retrieves public rooms for display.                | `Parse.Cloud.run("listRooms", { page: 1, limit: 10 });`                                                                                   |
| `fetchChatMessages` | Fetches messages from a specified room.            | `Parse.Cloud.run("fetchChatMessages", { roomId: "ROOM_ID_HERE", page: 1, limit: 50 });`                                                   |
| `createMessage`     | Sends a message to a specified room.               | `Parse.Cloud.run("createMessage", { roomId: "ROOM_ID_HERE", text: "Hello!", userId: "USER_ID_HERE", username: "USERNAME_HERE" });`        |
| `deleteRoom`        | Deletes a room with all associated messages.       | `Parse.Cloud.run("deleteRoom", { roomId: "ROOM_ID_HERE" });`                                                                              |
| `createPrivateRoom` | Creates a new private chat room between two users. | `Parse.Cloud.run("createPrivateRoom", { otherUsername: "OtherUser", roomName: "Private: User1 & OtherUser", currentUsername: "User1" });` |
| `listPrivateRooms`  | Retrieves private rooms for a specific user.       | `Parse.Cloud.run("listPrivateRooms", { username: "User1" });`                                                                             |

This documentation provides a comprehensive overview of the functionalities available in Mimi Chat Application, including user management, room management (both public and private), and messaging capabilities. The provided examples serve as a foundation for integrating and utilizing the cloud functions effectively within your application.
