import express from 'express';
import { ParseServer } from 'parse-server';
import path from 'path';
import http from 'http';
import cors from 'cors';
import Parse from 'parse/node.js';
import multer from 'multer';

const __dirname = path.resolve();

export const config = {
  databaseURI:
    process.env.DATABASE_URI || process.env.MONGODB_URI || 'mongodb://localhost:27017/dev3',
  cloud: process.env.CLOUD_CODE_MAIN || path.join(__dirname, '/cloud/main.js'),
  appId: process.env.APP_ID || 'myAppId',
  masterKey: process.env.MASTER_KEY || 'masterKey', //Add your master key here. Keep it secret!
  serverURL: process.env.SERVER_URL || 'https://parse-dev.evalley.io/parse', // Don't forget to change to https if needed
  allowClientClassCreation: true,
  // fileUpload: {
  //   enableForPublic: true,
  //   enableForAuthenticated: true,
  //   enableForAnonymous: true
  // },
  liveQuery: {
    classNames: ['Room', 'Message']
  },
  auth: {
    // Add this section for custom authentication
    mimi: {
      module: 'parse-server/lib/Adapters/Auth/CustomAuth.js',
      options: {
        // Implement token validation logic here
        validateAuthData: async (authData) => {
          // This is where you should validate the token from mimi-dev.evalley.io
          // For example:
          try {
            const response = await fetch('https://mimi-dev.evalley.io/api/v1/auth/validate', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${authData.access_token}`
              }
            });
            const data = await response.json();
            return data.status === 200;
          } catch (error) {
            console.error('Token validation error:', error);
            return false;
          }
        },
        validateAppId: () => {
          return Promise.resolve();
        }
      }
    }
  }
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

app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// // Serve the Parse API on the /parse URL prefix
// let server;
// if (!process.env.TESTING) {
//   server = new ParseServer(config);
// }

// Parse Server plays nicely with the rest of your web routes
// Set up multer for file uploads
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'uploads/'); // Specify the destination directory for uploaded files
  },
  filename: function (req, file, cb) {
    cb(null, Date.now() + path.extname(file.originalname)); // Generate a unique filename with timestamp
  }
});
const upload = multer({ storage: storage });

// File upload and create message API route
app.post('/api/createMessage', upload.single('file'), async (req, res) => {
  try {
    let fileUrl = null;

    if (req.file) {
      // Construct the public URL of the uploaded file
      fileUrl = `${req.protocol}://${req.get('host')}/uploads/${req.file.filename}`;
    }

    // Check for the authorization header
    const authHeader = req.headers.authorization;
    if (!authHeader) {
      return res.status(400).json({ message: 'Authorization header missing' });
    }

    const accessToken = authHeader.split(' ')[1];
    if (!accessToken) {
      return res.status(400).json({ message: 'Invalid authorization header format' });
    }

    // Parameters for the createMessage function
    const roomId = req.body.roomId;
    const text = req.body.text || "";
    console.log()

    // Call the Parse Cloud function to create the message
    const chatMessage = await Parse.Cloud.run('createMessages', {
      roomId: roomId,
      text: text,
      fileUrl: fileUrl,
      imageUrl: fileUrl,
      page: 1,
      limit:20,
      access_token: accessToken
    });

    res.status(200).json({ message: 'Message created successfully', file: req.file, fileUrl: fileUrl, chatMessage: chatMessage });
  } catch (error) {
    console.error(error);  // Log the error for debugging
    res.status(500).json({ message: 'Message creation failed', error: error.message });
  }
});

app.get('/', function (req, res) {
  res.status(200).send('I dream of being a website.  Please star the parse-server repo on GitHub!');
});

app.get('/chat', function (req, res) {
  res.sendFile(path.join(__dirname, '/public/chat.html'));
});

const startServer = async () => {
  if (!process.env.TESTING) {
    const server = new ParseServer(config);
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
    ParseServer.createLiveQueryServer(httpServer, {
      appId: config.appId,
      masterKey: config.masterKey,
      serverURL: config.serverURL,
    });
  }
};

startServer().catch(error => {
  console.error('Failed to start server', error);
});
