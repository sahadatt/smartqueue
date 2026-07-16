const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
require('dotenv').config();

const app = express();

const FRONTEND_URL = process.env.FRONTEND_URL || 'https://smartqueue-blond.vercel.app';

const allowedOrigins = [
  FRONTEND_URL,
  'http://localhost:3000',
  'http://172.20.10.2:3000'
];

const corsOptions = {
  origin: function (origin, callback) {
    // Allow server-to-server tools, Postman, curl, etc.
    if (!origin) return callback(null, true);

    if (allowedOrigins.includes(origin)) {
      return callback(null, true);
    }

    return callback(new Error('CORS Not Allowed'));
  },
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  credentials: true,
};

app.use(cors(corsOptions));
app.options('*', cors(corsOptions));
app.use(express.json());

const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: allowedOrigins,
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    credentials: true,
  },
});

// 🔌 MongoDB Cloud Connection
mongoose
  .connect(process.env.MONGO_URI, { serverSelectionTimeoutMS: 5000 })
  .then(() => console.log('🚀 MongoDB Cloud se successfully connect ho gaye!'))
  .catch((err) => console.error('❌ MongoDB connection error:', err.message));

// 📊 Models & Schemas Setup
const userSchema = new mongoose.Schema({
  username: { type: String, required: true, unique: true },
  password: { type: String, required: true },
});
const User = mongoose.model('User', userSchema);

const queueSchema = new mongoose.Schema({
  name: { type: String, default: 'Main Clinic Queue' },
  currentToken: { type: Number, default: 1 },
  totalTokensDistributed: { type: Number, default: 0 },
});
const Queue = mongoose.model('Queue', queueSchema);

// ✅ Patient Schema with mobileNumber field
const patientSchema = new mongoose.Schema({
  name: { type: String, required: true },
  mobileNumber: { type: String, required: true },
  tokenNumber: { type: Number, required: true },
  createdAt: { type: Date, default: Date.now },
});
const Patient = mongoose.model('Patient', patientSchema);

async function getOrCreateQueue() {
  let queue = await Queue.findOne({ name: 'Main Clinic Queue' });
  if (!queue) {
    queue = new Queue();
    await queue.save();
  }
  return queue;
}

// Live Status Sync Broadcast
async function broadcastQueueStatus() {
  const queue = await getOrCreateQueue();
  const patients = await Patient.find().sort({ tokenNumber: 1 });

  io.emit('queue-updated', {
    currentToken: queue.currentToken,
    totalTokensDistributed: queue.totalTokensDistributed,
    patients: patients,
  });
}

// Root / Health Route
app.get('/', (req, res) => {
  res.send('SmartQueue Backend is Running 🚀');
});

// 🔐 Authentication Routes
app.post('/api/auth/signup', async (req, res) => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({ message: 'Username aur password required hai!' });
    }

    const existingUser = await User.findOne({ username });
    if (existingUser) {
      return res.status(400).json({ message: 'Username pehle se hi exist karta hai!' });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const newUser = new User({ username, password: hashedPassword });
    await newUser.save();

    res.status(201).json({ message: 'Registration successful!' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/auth/login', async (req, res) => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({ message: 'Username aur password required hai!' });
    }

    const user = await User.findOne({ username });
    if (!user) return res.status(400).json({ message: 'Invalid Credentials!' });

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(400).json({ message: 'Invalid Credentials!' });

    const token = jwt.sign(
      { id: user._id },
      process.env.JWT_SECRET || 'SECRET_KEY',
      { expiresIn: '1d' }
    );

    res.json({ token, username });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 🎫 PATIENT QUICK QR CHECK-IN ROUTE
app.post('/api/auth/patient-checkin', async (req, res) => {
  try {
    const { patientName, mobileNumber } = req.body;

    if (!patientName || !mobileNumber) {
      return res.status(400).json({ message: 'patientName aur mobileNumber required hai!' });
    }

    const queue = await getOrCreateQueue();

    queue.totalTokensDistributed++;
    const myAssignedToken =
      queue.totalTokensDistributed < queue.currentToken
        ? queue.currentToken
        : queue.totalTokensDistributed;

    queue.totalTokensDistributed = myAssignedToken;
    await queue.save();

    const newPatient = new Patient({
      name: patientName,
      mobileNumber,
      tokenNumber: myAssignedToken,
    });

    await newPatient.save();

    await broadcastQueueStatus();

    res.status(201).json({
      myToken: myAssignedToken,
      patientName,
      mobileNumber,
      patientId: newPatient._id,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 🚪 PATIENT LEAVE QUEUE ROUTE
app.post('/api/auth/patient-leave', async (req, res) => {
  try {
    const { tokenToRemove } = req.body;

    if (!tokenToRemove) {
      return res.status(400).json({ message: 'tokenToRemove required hai!' });
    }

    await Patient.deleteOne({ tokenNumber: parseInt(tokenToRemove) });
    await broadcastQueueStatus();

    res.status(200).json({ message: 'Left queue successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 🌐 WebSockets Master Logic
io.on('connection', async (socket) => {
  console.log(`User Connected: ${socket.id}`);

  try {
    const queue = await getOrCreateQueue();
    const patients = await Patient.find().sort({ tokenNumber: 1 });

    socket.emit('queue-updated', {
      currentToken: queue.currentToken,
      totalTokensDistributed: queue.totalTokensDistributed,
      patients,
    });
  } catch (err) {
    console.error(err);
  }

  socket.on('next-patient', async () => {
    try {
      const queue = await getOrCreateQueue();
      if (queue.currentToken < queue.totalTokensDistributed) {
        queue.currentToken++;
        await queue.save();
        await broadcastQueueStatus();
      }
    } catch (err) {
      console.error(err);
    }
  });

  socket.on('previous-patient', async () => {
    try {
      const queue = await getOrCreateQueue();
      if (queue.currentToken > 1) {
        queue.currentToken--;
        await queue.save();
        await broadcastQueueStatus();
      }
    } catch (err) {
      console.error(err);
    }
  });

  socket.on('admin-delete-patient', async (data) => {
    try {
      const { id } = data;
      if (!id || !mongoose.Types.ObjectId.isValid(id)) return;

      await Patient.deleteOne({ _id: new mongoose.Types.ObjectId(id) });
      await broadcastQueueStatus();
    } catch (err) {
      console.error(err);
    }
  });

  socket.on('admin-edit-patient', async (data) => {
    try {
      const { id, newName, newTokenNumber, newMobileNumber } = data;
      if (!id || !mongoose.Types.ObjectId.isValid(id)) return;

      await Patient.updateOne(
        { _id: new mongoose.Types.ObjectId(id) },
        {
          name: newName,
          tokenNumber: parseInt(newTokenNumber),
          mobileNumber: newMobileNumber,
        }
      );

      await broadcastQueueStatus();
    } catch (err) {
      console.error(err);
    }
  });

  socket.on('reset-entire-queue', async (data) => {
    try {
      const { username, password } = data;

      const user = await User.findOne({ username });
      if (!user) {
        return socket.emit('reset-status-response', {
          success: false,
          message: '❌ Account validation failed!',
        });
      }

      const isMatch = await bcrypt.compare(password, user.password);
      if (!isMatch) {
        return socket.emit('reset-status-response', {
          success: false,
          message: '❌ Incorrect Admin Password! Access Denied.',
        });
      }

      await Patient.deleteMany({});
      const queue = await getOrCreateQueue();
      queue.currentToken = 1;
      queue.totalTokensDistributed = 0;
      await queue.save();

      await broadcastQueueStatus();

      socket.emit('reset-status-response', {
        success: true,
        message: '♻️ System Reset Successful! All counters set to 1.',
      });
    } catch (err) {
      console.error(err);
      socket.emit('reset-status-response', {
        success: false,
        message: '❌ Critical internal database error.',
      });
    }
  });

  socket.on('disconnect', () => console.log(`User Disconnected: ${socket.id}`));
});

const PORT = process.env.PORT || 5000;

server.listen(PORT, () => {
  console.log(`Backend server running on port ${PORT}`);
});