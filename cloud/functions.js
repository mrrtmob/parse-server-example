import axios from 'axios'
import { v4 as uuidv4 } from 'uuid';

async function checkCurrentUser(accessToken) {
  if (!accessToken) {
    throw new Error("Access token is required");
  }

  try {
    const response = await axios.get('https://mimi-dev.evalley.io/api/v1/auth/profile', {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });

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

    return response.data.data.item;

  } catch (error) {
    console.error("Error fetching user profile by ID:", error.message);
    throw new Error("An error occurred while fetching the user profile by ID");
  }
}

async function getLastMessageAndUnseenCount(roomId, currentUserId) {
  const messageQuery = new Parse.Query(Message);
  messageQuery.equalTo("roomId", roomId);
  messageQuery.descending("createdAt");
  messageQuery.limit(1);

  const lastMessage = await messageQuery.first({ useMasterKey: true });

  const unseenQuery = new Parse.Query(Message);
  unseenQuery.equalTo("roomId", roomId);
  unseenQuery.notEqualTo("userId", currentUserId); // Exclude messages sent by the current user
  unseenQuery.notEqualTo("seenBy", currentUserId); // Check if the current user hasn't seen the message
  const unseenCount = await unseenQuery.count({ useMasterKey: true });

  return {
    lastMessage: lastMessage ? {
      text: lastMessage.get("text"),
      createdAt: lastMessage.createdAt
    } : null,
    unseenCount
  };
}

// Define Parse Classes
const Room = Parse.Object.extend("Room");
const Message = Parse.Object.extend("Message");

// Cloud functions
Parse.Cloud.define("createPublicRoom", async (request) => {
  const { name, createdBy } = request.params;

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

Parse.Cloud.define("listPrivateRooms", async (request) => {
  const access_token = request.headers.authorization.split(' ')[1];
  const user = await checkCurrentUser(access_token);
  const currentUserId = user.id.toString();

  const query = new Parse.Query(Room);
  query.equalTo("isPrivate", true);
  query.equalTo("userIds", currentUserId);
  const rooms = await query.find({ useMasterKey: true });

  return Promise.all(rooms.map(async room => {
    const userIds = room.get("userIds") || [];
    const otherUserId = userIds.find(id => id !== currentUserId);

    let otherUserDetails = { id: "Unknown", name: "Unknown User" };
    if (otherUserId) {
      try {
        const fetchedUser = await getUserInfoById(otherUserId);
        otherUserDetails = {
          id: fetchedUser.id,
          name: fetchedUser.name
        };
      } catch (error) {
        console.error(`Error fetching user details for ID ${otherUserId}:`, error);
      }
    }

    // Fetch the last message
    const lastMessageQuery = new Parse.Query(Message);
    lastMessageQuery.equalTo("roomId", room.id);
    lastMessageQuery.descending("createdAt");
    lastMessageQuery.limit(1);
    const lastMessage = await lastMessageQuery.first({ useMasterKey: true });

    let lastMessageText = "No messages yet";
    let lastMessageTime = null;
    let unseenCount = 0;

    if (lastMessage) {
      lastMessageText = lastMessage.get("text") || "Image or audio message";
      lastMessageTime = lastMessage.createdAt;

      // Check if the current user has seen the last message
      const seenBy = lastMessage.get("seenBy") || [];
      if (!seenBy.includes(currentUserId)) {
        // If the last message is not seen by the current user, count unseen messages
        const unseenQuery = new Parse.Query(Message);
        unseenQuery.equalTo("roomId", room.id);
        unseenQuery.notEqualTo("seenBy", currentUserId);
        unseenCount = await unseenQuery.count({ useMasterKey: true });
      }
    }

    console.log(`Room ${room.id}: Last message seen by ${lastMessage ? lastMessage.get("seenBy") : []}, current user ${currentUserId}, unseen count ${unseenCount}`);

    return {
      id: room.id,
      name: otherUserDetails.name,
      otherUser: otherUserDetails,
      roomIdentifier: room.get("roomIdentifier"),
      lastMessage: lastMessageText,
      lastMessageTime: lastMessageTime,
      unSeenCount: unseenCount
    }
  }));
});

Parse.Cloud.define("fetchChatMessages", async (request) => {
  const { roomId, page = 1, limit = 50 } = request.params;
  const skip = (page - 1) * limit;
  const access_token = request.headers.authorization.split(' ')[1];
  const currentUser = await checkCurrentUser(access_token);

  const query = new Parse.Query(Message);
  query.equalTo("roomId", roomId);
  query.limit(limit);
  query.skip(skip);
  query.ascending("createdAt");

  const results = await query.find({ useMasterKey: true });
  const total = await query.count({ useMasterKey: true });

  const defaultImageUrl = "https://i.sstatic.net/l60Hf.png";

  const userIds = [...new Set(results.map(message => message.get("userId")))];
  const userQuery = new Parse.Query(Parse.User);
  userQuery.containedIn("objectId", userIds);
  const users = await userQuery.find({ useMasterKey: true });
  const userMap = Object.fromEntries(users.map(user => [user.id, user]));

  // Mark messages as seen
  const unseenMessages = results.filter(message =>
    message.get("userId") !== currentUser.id &&
    !(message.get("seenBy") || []).includes(currentUser.id)
  );

  await Promise.all(unseenMessages.map(async (message) => {
    const seenBy = message.get("seenBy") || [];
    seenBy.push(currentUser.id);
    message.set("seenBy", seenBy);
    await message.save(null, { useMasterKey: true });
  }));

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
        audioUrl: message.get("audioUrl") || null,
        seenBy: message.get("seenBy") || []
      };
    }),
    page: page,
    totalPages: Math.ceil(total / limit),
    total: total,
    unseenCount: 0 // Since we've marked all messages as seen
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
  message.set("userId", user.id.toString());
  message.set("username", username);
  message.set("imageUrl", imageUrl || null);
  message.set("seenBy", [user.id.toString()]); // Initialize with the sender's ID

  await message.save(null, { useMasterKey: true });

  return {
    id: message.id,
    roomId: message.get("roomId"),
    text: message.get("text"),
    userId: message.get("userId"),
    username: message.get("username"),
    createdAt: message.createdAt,
    imageUrl: message.get("imageUrl"),
    seenBy: message.get("seenBy")
  };
});

Parse.Cloud.define("createPrivateRoom", async (request) => {
  const { otherUserId, roomName = "Room name" } = request.params;

  const access_token = request.headers.authorization.split(' ')[1];

  const user = await checkCurrentUser(access_token);
  const otherUser = await getUserInfoById(otherUserId);

  // Ensure we're using string IDs
  const currentUserId = user.id.toString();
  const otherUserIdString = otherUser.id.toString();

  // Query for existing private rooms that contain both users
  const query = new Parse.Query(Room);
  query.equalTo("isPrivate", true);
  query.containedIn("userIds", [currentUserId, otherUserIdString]);

  const rooms = await query.find({ useMasterKey: true });

  // Check if a room already exists with exactly these two users
  const existingRoom = rooms.find(room => {
    const userIds = room.get("userIds") || [];
    return userIds.length === 2 &&
      userIds.includes(currentUserId) &&
      userIds.includes(otherUserIdString);
  });

  if (existingRoom) {
    console.log(`Existing room found: ${existingRoom.id}`);
    return {
      id: existingRoom.id,
      name: existingRoom.get("name"),
      userIds: existingRoom.get("userIds"),
      roomIdentifier: existingRoom.get("roomIdentifier")
    };
  }

  // If no existing room, create a new one
  const roomIdentifier = uuidv4();

  const room = new Room();
  room.set("name", roomName);
  room.set("isPrivate", true);
  room.set("userIds", [currentUserId, otherUserIdString]);  // Store user IDs as strings
  room.set("roomIdentifier", roomIdentifier);

  const acl = new Parse.ACL();
  acl.setPublicReadAccess(false);
  acl.setPublicWriteAccess(false);
  acl.setReadAccess(currentUserId, true);
  acl.setWriteAccess(currentUserId, true);
  acl.setReadAccess(otherUserIdString, true);
  acl.setWriteAccess(otherUserIdString, true);
  room.setACL(acl);

  await room.save(null, { useMasterKey: true });

  console.log(`New room created: ${room.id}`);
  return {
    id: room.id,
    name: room.get("name"),
    userIds: room.get("userIds"),
    roomIdentifier: room.get("roomIdentifier")
  };
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

Parse.Cloud.define("deleteRoom", async (request) => {
  const { roomId } = request.params;
  const access_token = request.headers.authorization.split(' ')[1];

  if (!roomId) {
    throw new Parse.Error(Parse.Error.INVALID_PARAMETER, "Room ID is required");
  }

  const currentUser = await checkCurrentUser(access_token);
  if (!currentUser) {
    throw new Parse.Error(Parse.Error.INVALID_SESSION_TOKEN, "Invalid user session");
  }

  console.log(`Attempting to delete room ${roomId} for user ${currentUser.id}`);

  const roomQuery = new Parse.Query("Room");
  let room;
  try {
    room = await roomQuery.get(roomId, { useMasterKey: true });
  } catch (error) {
    console.error(`Error fetching room ${roomId}:`, error);
    throw new Parse.Error(Parse.Error.OBJECT_NOT_FOUND, "Room not found");
  }

  if (!room) {
    throw new Parse.Error(Parse.Error.OBJECT_NOT_FOUND, "Room not found");
  }

  console.log(`Room ${roomId} found. Checking user permissions.`);

  // Get the userIds from the room
  const userIds = room.get("userIds") || [];
  console.log(`Room userIds:`, JSON.stringify(userIds, null, 2));

  // Check if the current user's ID is in the userIds array
  const currentUserId = currentUser.id.toString();
  const isUserAuthorized = userIds.some(userId => userId.toString() === currentUserId);

  console.log(`Is user authorized: ${isUserAuthorized}`);

  if (!isUserAuthorized) {
    console.error(`User ${currentUserId} attempted to delete room ${roomId} without permission`);
    throw new Parse.Error(Parse.Error.OPERATION_FORBIDDEN, "You do not have permission to delete this room");
  }

  console.log(`User ${currentUserId} has permission. Proceeding with room deletion.`);

  // Delete associated messages
  const messageQuery = new Parse.Query("Message");
  messageQuery.equalTo("roomId", roomId);
  const messages = await messageQuery.find({ useMasterKey: true });
  await Parse.Object.destroyAll(messages, { useMasterKey: true });

  // Delete the room
  await room.destroy({ useMasterKey: true });

  console.log(`Room ${roomId} and associated messages deleted successfully`);
  return { message: "Room and associated messages deleted successfully" };
});

Parse.Cloud.define("markMessagesAsSeen", async (request) => {
  const { roomId } = request.params;
  const access_token = request.headers.authorization.split(' ')[1];
  const user = await checkCurrentUser(access_token);

  const query = new Parse.Query(Message);
  query.equalTo("roomId", roomId);
  query.notEqualTo("userId", user.id.toString()); // Only mark messages from other users as seen
  query.notEqualTo("seenBy", user.id.toString());

  const messages = await query.find({ useMasterKey: true });

  await Promise.all(messages.map(async (message) => {
    const seenBy = message.get("seenBy") || [];
    if (!seenBy.includes(user.id.toString())) {
      seenBy.push(user.id.toString());
      message.set("seenBy", seenBy);
      await message.save(null, { useMasterKey: true });
    }
  }));

  // After marking messages as seen, get the updated unseen count
  const { unseenCount } = await getLastMessageAndUnseenCount(roomId, user.id.toString());

  return {
    message: "Messages marked as seen",
    unseenCount: unseenCount // This should be 0 after marking messages as seen
  };
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
