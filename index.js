// Example express application adding the parse-server module to expose Parse
// compatible API routes.

import express from 'express';
import { ParseServer } from 'parse-server';
import path from 'path';
import http from 'http';
import cors from 'cors';
import Parse from 'parse/node.js';

const __dirname = path.resolve();

export const config = {
  databaseURI:
    process.env.DATABASE_URI || process.env.MONGODB_URI || 'mongodb://localhost:27017/dev',
  cloud: process.env.CLOUD_CODE_MAIN || path.join(__dirname, '/cloud/main.js'),
  appId: process.env.APP_ID || 'myAppId',
  masterKey: process.env.MASTER_KEY || '', //Add your master key here. Keep it secret!
  serverURL: process.env.SERVER_URL || 'http://localhost:1337/parse', // Don't forget to change to https if needed
  allowClientClassCreation: true,
  liveQuery: {
    classNames: ['Message', 'Room']
  },
};

export const app = express();

app.set('trust proxy', true);
const corsOptions = {
  origin: '*', // Be more specific in production
  methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
  preflightContinue: false,
  optionsSuccessStatus: 204
};

app.use(cors(corsOptions));
app.use(express.json());

// Initialize Parse
Parse.initialize(config.appId, "YOUR_JAVASCRIPT_KEY", config.masterKey);
Parse.serverURL = config.serverURL;

// Serve static assets from the /public folder
app.use('/public', express.static(path.join(__dirname, '/public')));

// Serve the Parse API on the /parse URL prefix
let server;
if (!process.env.TESTING) {
  server = new ParseServer(config);
}

// Parse Server plays nicely with the rest of your web routes
app.get('/', function (req, res) {
  res.status(200).send('I dream of being a website.  Please star the parse-server repo on GitHub!');
});

app.get('/chat', function (req, res) {
  res.sendFile(path.join(__dirname, '/public/chat.html'));
});

// RESTful API endpoints
app.post('/api/rooms', async (req, res) => {
  try {
    const { name, isPrivate, userIds } = req.body;
    const Room = Parse.Object.extend("Room");
    const room = new Room();

    room.set("name", name);
    room.set("isPrivate", isPrivate);
    if (userIds && userIds.length > 0) {
      room.set("users", userIds);
    }

    const result = await room.save(null, { useMasterKey: true });
    res.status(201).json({
      id: result.id,
      name: result.get("name"),
      isPrivate: result.get("isPrivate")
    });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

app.get('/api/rooms', async (req, res) => {
  try {
    const { page = 1, limit = 10, userId } = req.query;
    const skip = (page - 1) * limit;

    const query = new Parse.Query("Room");
    if (userId) {
      query.equalTo("users", userId);
    }
    query.limit(parseInt(limit));
    query.skip(skip);
    query.ascending("createdAt");

    const results = await query.find({ useMasterKey: true });
    const total = await query.count({ useMasterKey: true });

    res.json({
      results: results.map(room => ({
        id: room.id,
        name: room.get("name"),
        isPrivate: room.get("isPrivate"),
        createdAt: room.createdAt
      })),
      page: parseInt(page),
      totalPages: Math.ceil(total / limit),
      total: total
    });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

app.post('/api/messages', async (req, res) => {
  try {
    const { text, userId, roomId } = req.body;
    const Message = Parse.Object.extend("Message");
    const message = new Message();

    message.set("text", text);
    message.set("userId", userId);
    message.set("roomId", roomId);

    const result = await message.save(null, { useMasterKey: true });
    res.status(201).json({
      id: result.id,
      text: result.get("text"),
      userId: result.get("userId"),
      roomId: result.get("roomId"),
      createdAt: result.createdAt
    });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

app.get('/api/messages/:roomId', async (req, res) => {
  try {
    const { roomId } = req.params;
    const { page = 1, limit = 50 } = req.query;
    const skip = (page - 1) * limit;

    const query = new Parse.Query("Message");
    query.equalTo("roomId", roomId);
    query.limit(parseInt(limit));
    query.skip(skip);
    query.descending("createdAt");

    const results = await query.find({ useMasterKey: true });
    const total = await query.count({ useMasterKey: true });

    res.json({
      results: results.map(message => ({
        id: message.id,
        text: message.get("text"),
        userId: message.get("userId"),
        roomId: message.get("roomId"),
        createdAt: message.createdAt
      })),
      page: parseInt(page),
      totalPages: Math.ceil(total / limit),
      total: total
    });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

const startServer = async () => {
  if (!process.env.TESTING) {
    await server.start();
    const mountPath = process.env.PARSE_MOUNT || '/parse';
    app.use(mountPath, server.app);

    const port = process.env.PORT || 1337;
    const httpServer = http.createServer(app);

    await new Promise((resolve) => {
      httpServer.listen(port, () => {
        console.log(`parse-server-example running on port ${port}.`);
        resolve();
      });
    });

    // This will enable the Live Query real-time server
    ParseServer.createLiveQueryServer(httpServer);
  }
};

startServer().catch(error => {
  console.error('Failed to start server', error);
});
