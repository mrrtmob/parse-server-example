
// Define Parse Classes
const Room = Parse.Object.extend("Room");

// Cloud functions
Parse.Cloud.define("createRoom", async (request) => {
  const { name, createdBy, users } = request.params;
  const room = new Room();
  room.set("name", name);
  room.set("createdBy", createdBy);
  room.set("users", users);
  await room.save(null, { useMasterKey: true });
  return room;
});

Parse.Cloud.define("addUserToRoom", async (request) => {
  const { roomId, userId } = request.params;
  const room = await new Parse.Query(Room).get(roomId, { useMasterKey: true });
  const users = room.get("users");
  if (!users.includes(userId)) {
    users.push(userId);
    room.set("users", users);
    await room.save(null, { useMasterKey: true });
  }
  return room;
});

// // List rooms with pagination
// Parse.Cloud.define("listRooms", async (request) => {
//   const { page = 1, limit = 10 } = request.params;
//   const skip = (page - 1) * limit;

//   const query = new Parse.Query("Room");
//   query.limit(limit);
//   query.skip(skip);
//   query.ascending("createdAt");

//   const results = await query.find({ useMasterKey: true });
//   const total = await query.count({ useMasterKey: true });

//   return {
//     results: results.map(room => ({
//       id: room.id,
//       name: room.get("name"),
//       createdBy: room.get("createdBy"),
//       createdAt: room.createdAt
//     })),
//     page: page,
//     totalPages: Math.ceil(total / limit),
//     total: total
//   };
// });

// Fetch chat messages with pagination
Parse.Cloud.define("fetchChatMessages", async (request) => {
  const { roomId, page = 1, limit = 50 } = request.params;
  const skip = (page - 1) * limit;

  const query = new Parse.Query("Message");
  query.equalTo("roomId", roomId);
  query.limit(limit);
  query.skip(skip);
  query.descending("createdAt");

  const results = await query.find({ useMasterKey: true });
  const total = await query.count({ useMasterKey: true });

  return {
    results: results.map(message => ({
      id: message.id,
      user: message.get("user"),
      userId: message.get("userId"),  // Include the userId here
      text: message.get("text"),
      createdAt: message.createdAt
    })),
    page: page,
    totalPages: Math.ceil(total / limit),
    total: total
  };
});


Parse.Cloud.define("createPrivateRoom", async (request) => {
  if (!request.user) {
    throw new Parse.Error(Parse.Error.SESSION_MISSING, 'User needs to be authenticated.');
  }

  const { otherUsername, roomName } = request.params;
  const currentUser = request.user;

  // Find the other user
  const query = new Parse.Query(Parse.User);
  query.equalTo("username", otherUsername);
  const otherUser = await query.first({ useMasterKey: true });

  if (!otherUser) {
    throw new Parse.Error(Parse.Error.OBJECT_NOT_FOUND, 'Other user not found.');
  }

  // Create the room
  const room = new Parse.Object("Room");
  room.set("name", roomName);
  room.set("isPrivate", true);
  room.set("users", [currentUser.id, otherUser.id]);

  // Set up ACL
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
  const query = new Parse.Query("Room");
  query.equalTo("isPrivate", true);
  query.equalTo("users", userId);
  const rooms = await query.find({ useMasterKey: true });
  return rooms;
});

Parse.Cloud.define("createPublicRoom", async (request) => {
  const { name, createdBy } = request.params;
  const room = new Parse.Object("Room");
  room.set("name", name);
  room.set("createdBy", createdBy);
  room.set("isPrivate", false);
  await room.save(null, { useMasterKey: true });
  return room;
});

// Modify the existing listRooms function to only return public rooms
Parse.Cloud.define("listRooms", async (request) => {
  const { page = 1, limit = 10 } = request.params;
  const skip = (page - 1) * limit;

  const query = new Parse.Query("Room");
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


Parse.Cloud.define("createMessage", async (request) => {
  if (!request.user) {
    throw new Parse.Error(Parse.Error.SESSION_MISSING, 'User needs to be authenticated.');
  }

  const { roomId, text } = request.params;
  const userId = request.user.id;

  const Message = Parse.Object.extend("Message");
  const message = new Message();

  message.set("roomId", roomId);
  message.set("text", text);
  message.set("userId", userId);
  message.set("username", request.user.get("username"));

  await message.save(null, { useMasterKey: true });

  return {
    id: message.id,
    roomId: message.get("roomId"),
    text: message.get("text"),
    userId: message.get("userId"),
    username: message.get("username"),
    createdAt: message.createdAt
  };
});
