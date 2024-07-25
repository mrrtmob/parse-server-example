// Define Parse Classes
const Room = Parse.Object.extend("Room");
const Message = Parse.Object.extend("Message");

// Cloud functions
Parse.Cloud.define("createPublicRoom", async (request) => {
  const { name, createdBy } = request.params;
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
  const { roomId, text, imageUrl, userId, username } = request.params;

  const Message = Parse.Object.extend("Message");
  const message = new Message();

  message.set("roomId", roomId);
  message.set("text", text || "");
  message.set("userId", String(userId)); // Ensure userId is stored as a string
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
  const { otherUsername, roomName, currentUser } = request.params;

  const userQuery = new Parse.Query(Parse.User);
  userQuery.equalTo("username", otherUsername);
  const otherUser = await userQuery.first({ useMasterKey: true });

  if (!otherUser) {
    throw new Parse.Error(Parse.Error.OBJECT_NOT_FOUND, 'Other user not found.');
  }

  const room = new Room();
  room.set("name", roomName);
  room.set("isPrivate", true);
  room.set("users", [currentUser.id, otherUser.id]);

  const acl = new Parse.ACL();
  acl.setReadAccess(currentUser.id, true);
  acl.setWriteAccess(currentUser.id, true);
  acl.setReadAccess(otherUser.id, true);
  acl.setWriteAccess(otherUser.id, true);
  room.setACL(acl);

  await room.save(null, { useMasterKey: true });

  return {
    id: room.id,
    name: room.get("name")
  };
});

Parse.Cloud.define("listPrivateRooms", async (request) => {
  const { userId } = request.params;
  const query = new Parse.Query(Room);
  query.equalTo("isPrivate", true);
  query.equalTo("users", userId);
  const rooms = await query.find({ useMasterKey: true });
  return rooms.map(room => ({
    id: room.id,
    name: room.get("name")
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

// // Global error handler
// Parse.Cloud.onError((error) => {
//   console.error("Cloud function error:", error);
// });
