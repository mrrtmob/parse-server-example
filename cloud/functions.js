import axios from 'axios'
import { v4 as uuidv4 } from 'uuid';
async function checkCurrentUser(accessToken) {
  // Validate the access token
  if (!accessToken) {
    throw new Error("Access token is required");
  }

  try {
    const response = await axios.get('https://mimi-dev.evalley.io/api/v1/auth/profile', {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });

    // Return the user profile data
    return response.data.data.item;

  } catch (error) {
    console.error("Error fetching user profile:", error.message);
    throw new Error("An error occurred while fetching the user profile");
  }
}

async function getUserInfoById(userId) {
  if (!userId) {
    throw new Error("User ID is required");
  }

  try {
    const response = await axios.get(`https://mimi-dev.evalley.io/api/v1/auth/user-profile/${userId}`, {
      headers: {
        Expect: "cbfcc213cc2efece05f8c35889f5ddfa359140fe384ec90098a9956710638acb18f500147615127b425121be2951b8eab0643583867fcd77f2003b0c881a838f0c7dda5837ccafde873649be636e090ecafdc932a427abb94ae22e4dc7e44dd1a87de592ef96d5a90a3f6ab264a8b818",
      },
    });

    // Return the user profile data
    return response.data.data.item;

  } catch (error) {
    console.error("Error fetching user profile by ID:", error.message);
    throw new Error("An error occurred while fetching the user profile by ID");
  }
}

// Define Parse Classes
const Room = Parse.Object.extend("Room");
const Message = Parse.Object.extend("Message");

// Cloud functions
Parse.Cloud.define("createPublicRoom", async (request) => {
  const { name, createdBy } = request.params;

  // Check if a room with the same name already exists
  const query = new Parse.Query(Room);
  query.equalTo("name", name);
  query.equalTo("isPrivate", false);
  const existingRoom = await query.first({ useMasterKey: true });

  if (existingRoom) {
    throw new Parse.Error(Parse.Error.DUPLICATE_VALUE, "A room with this name already exists");
  }

  const room = new Room();
  room.set("name", name);
  room.set("createdBy", createdBy);
  room.set("isPrivate", false);
  await room.save(null, { useMasterKey: true });
  return room;
});

Parse.Cloud.define("listRooms", async (request) => {
  const { page = 1, limit = 10 } = request.params;
  const skip = (page - 1) * limit;

  const query = new Parse.Query(Room);
  query.equalTo("isPrivate", false);
  query.limit(limit);
  query.skip(skip);
  query.ascending("createdAt");

  const results = await query.find({ useMasterKey: true });
  const total = await query.count({ useMasterKey: true });

  return {
    results: results.map(room => ({
      id: room.id,
      name: room.get("name"),
      createdBy: room.get("createdBy"),
      createdAt: room.createdAt
    })),
    page: page,
    totalPages: Math.ceil(total / limit),
    total: total
  };
});

Parse.Cloud.define("fetchChatMessages", async (request) => {
  const { roomId, page = 1, limit = 50 } = request.params;
  const skip = (page - 1) * limit;

  const query = new Parse.Query(Message);
  query.equalTo("roomId", roomId);
  query.limit(limit);
  query.skip(skip);
  query.ascending("createdAt");

  const results = await query.find({ useMasterKey: true });
  const total = await query.count({ useMasterKey: true });

  const defaultImageUrl = "https://i.sstatic.net/l60Hf.png";

  // Fetch users for all messages
  const userIds = [...new Set(results.map(message => message.get("userId")))];
  const userQuery = new Parse.Query(Parse.User);
  userQuery.containedIn("objectId", userIds);
  const users = await userQuery.find({ useMasterKey: true });
  console.log(results)
  const userMap = Object.fromEntries(users.map(user => [user.id, user]));

  return {
    results: results.map(message => {
      const userId = message.get("userId");
      const user = userMap[userId];
      return {
        id: message.id,
        userId: userId,
        username: message.get("username") || (user && user.get("username")) || "Unknown User",
        text: message.get("text") || "",
        createdAt: message.createdAt,
        profileImageUrl: (user && user.get("profileImageUrl")) || defaultImageUrl,
        imageUrl: message.get("imageUrl") || null,
        audioUrl: message.get("audioUrl") || null
      };
    }),
    page: page,
    totalPages: Math.ceil(total / limit),
    total: total
  };
});

Parse.Cloud.define("createMessage", async (request) => {
  const { roomId, text, imageUrl, username } = request.params;
  const access_token = request.headers.authorization.split(' ')[1]

  const user = await checkCurrentUser(access_token)

  const Message = Parse.Object.extend("Message");
  const message = new Message();

  message.set("roomId", roomId);
  message.set("text", text || "");
  message.set("userId", user.id.toString()); // Ensure userId is stored as a string
  message.set("username", username);
  message.set("imageUrl", imageUrl || null);

  await message.save(null, { useMasterKey: true });

  return {
    id: message.id,
    roomId: message.get("roomId"),
    text: message.get("text"),
    userId: message.get("userId"),
    username: message.get("username"),
    createdAt: message.createdAt,
    imageUrl: message.get("imageUrl")
  };
});

Parse.Cloud.define("createPrivateRoom", async (request) => {
  const { otherUserId, roomName = "Room name" } = request.params;

  const access_token = request.headers.authorization.split(' ')[1]

  const user = await checkCurrentUser(access_token)

  // const currentUsername = user.name

  const otherUser = await getUserInfoById(otherUserId)

  // const otherUsername = otherUser.name

  // Create a unique room identifier
  const roomIdentifier = uuidv4();

  // Check if a private room between these users already exists
  const query = new Parse.Query(Room);
  query.equalTo("roomIdentifier", roomIdentifier);
  query.equalTo("isPrivate", true);
  const existingRoom = await query.first({ useMasterKey: true });

  if (existingRoom) {
    return {
      id: existingRoom.id,
      name: existingRoom.get("name"),
      users: existingRoom.get("users"),
      roomIdentifier: existingRoom.get("roomIdentifier")
    };
  }

  const room = new Room();
  room.set("name", roomName);
  room.set("isPrivate", true);
  room.set("users", [user, otherUser]);
  room.set("roomIdentifier", roomIdentifier);

  // Set ACL
  const acl = new Parse.ACL();
  acl.setPublicReadAccess(false);
  acl.setPublicWriteAccess(false);
  acl.setReadAccess(user.id.toString(), true);
  acl.setWriteAccess(user.id.toString(), true);
  acl.setReadAccess(otherUser.id.toString(), true);
  acl.setWriteAccess(otherUser.id.toString(), true);
  room.setACL(acl);

  await room.save(null, { useMasterKey: true });

  return {
    id: room.id,
    name: room.get("name"),
    users: room.get("users"),
    roomIdentifier: room.get("roomIdentifier")
  };
});

Parse.Cloud.define("listPrivateRooms", async (request) => {
  const access_token = request.headers.authorization.split(' ')[1];
  const user = await checkCurrentUser(access_token);

  const currentUserId = user.id;

  const query = new Parse.Query(Room);
  query.equalTo("isPrivate", true);
  query.equalTo("users", user);
  const rooms = await query.find({ useMasterKey: true });

  return Promise.all(rooms.map(async room => {
    const users = room.get("users");

    // Find the other user object
    const otherUser = users.find(u => u.id !== currentUserId);

    // Fetch the other user's details
    let otherUserDetails = { id: "Unknown", name: "Unknown User" };
    if (otherUser) {
      try {
        const fetchedUser = await getUserInfoById(otherUser.id);
        otherUserDetails = {
          id: fetchedUser.id,
          name: fetchedUser.name
        };
      } catch (error) {
        console.error(`Error fetching user details for ID ${otherUser.id}:`, error);
      }
    }

    return {
      id: room.id,
      name: otherUserDetails.name, // Set room name to other user's name
      otherUser: otherUserDetails,
      roomIdentifier: room.get("roomIdentifier"),
      lastMessage: "last message",
      unSeenCount: 10
    }
  }));
});

Parse.Cloud.define("addUserToRoom", async (request) => {
  const { roomId, userId } = request.params;
  const room = await new Parse.Query(Room).get(roomId, { useMasterKey: true });
  const users = room.get("users") || [];
  if (!users.includes(userId)) {
    users.push(userId);
    room.set("users", users);
    await room.save(null, { useMasterKey: true });
  }
  return room;
});

// Error handling middleware
Parse.Cloud.beforeSave("Message", (request) => {
  const message = request.object;
  if (!message.get("text") && !message.get("imageUrl") && !message.get("audioUrl")) {
    throw new Parse.Error(Parse.Error.INVALID_JSON, "Message must contain text, image, or audio");
  }
});

Parse.Cloud.beforeSave("Room", (request) => {
  const room = request.object;
  if (!room.get("name")) {
    throw new Parse.Error(Parse.Error.INVALID_JSON, "Room must have a name");
  }
});

// Function to delete a room
Parse.Cloud.define("deleteRoom", async (request) => {
  const { roomId } = request.params;
  const access_token = request.headers.authorization.split(' ')[1];

  if (!roomId) {
    throw new Parse.Error(Parse.Error.INVALID_PARAMETER, "Room ID is required");
  }

  // Get the current user
  const currentUser = await checkCurrentUser(access_token);
  if (!currentUser) {
    throw new Parse.Error(Parse.Error.INVALID_SESSION_TOKEN, "Invalid user session");
  }

  const roomQuery = new Parse.Query("Room");
  const room = await roomQuery.get(roomId, { useMasterKey: true });

  if (!room) {
    throw new Parse.Error(Parse.Error.OBJECT_NOT_FOUND, "Room not found");
  }

  // Check if the current user is a member of the room
  const roomUsers = room.get("users");
  const isUserInRoom = roomUsers.some(user => user.id === currentUser.id);

  if (!isUserInRoom) {
    throw new Parse.Error(Parse.Error.OPERATION_FORBIDDEN, "You do not have permission to delete this room");
  }

  // Delete all messages in the room
  const messageQuery = new Parse.Query("Message");
  messageQuery.equalTo("roomId", roomId);
  const messages = await messageQuery.find({ useMasterKey: true });
  await Parse.Object.destroyAll(messages, { useMasterKey: true });

  // Delete the room
  await room.destroy({ useMasterKey: true });

  return { message: "Room and associated messages deleted successfully" };
});
// // Global error handler
// Parse.Cloud.onError((error) => {
//   console.error("Cloud function error:", error);
// });
