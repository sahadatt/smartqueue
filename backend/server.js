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

const corsOptions = {
  origin: true, 
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  credentials: true,
};

app.use(cors(corsOptions));
app.options('*', cors(corsOptions));
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: true, 
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    credentials: true,
  },
});

mongoose
  .connect(process.env.MONGO_URI, { serverSelectionTimeoutMS: 5000 })
  .then(() => console.log('🚀 MongoDB Cloud se successfully connect ho gaye!'))
  .catch((err) => console.error('❌ MongoDB connection error:', err.message));

const userSchema = new mongoose.Schema({
  username: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  profileImage: { type: String, default: '' },
  doctorName: { type: String, default: 'Dr. Sahadat Ansari' },
  clinicName: { type: String, default: 'LIFE CARE' },
  degree: { type: String, default: 'MBBS, MD' },
  mobile: { type: String, default: '+91 0000000000' },
  expectedStartTime: { type: String, default: '' },
  timePerPatient: { type: Number, default: 5 } 
});
const User = mongoose.model('User', userSchema);

const queueSchema = new mongoose.Schema({
  name: { type: String, default: 'Main Clinic Queue' },
  currentToken: { type: Number, default: 1 },
  totalTokensDistributed: { type: Number, default: 0 },
  clinicStatus: { type: String, default: 'not-started' },
  lastTokenUpdateTime: { type: Number, default: Date.now } 
});
const Queue = mongoose.model('Queue', queueSchema);

const patientSchema = new mongoose.Schema({
  name: { type: String, required: true },
  mobileNumber: { type: String, required: true },
  tokenNumber: { type: Number, required: true },
  createdAt: { type: Date, default: Date.now },
});
const Patient = mongoose.model('Patient', patientSchema);

const deletedPatientSchema = new mongoose.Schema({
  name: { type: String, required: true },
  mobileNumber: { type: String, required: true },
  tokenNumber: { type: Number, required: true },
  createdAt: { type: Date },
  deletedAt: { type: Date, default: Date.now },
  deletedBy: { type: String, default: 'by admin' }
});
const DeletedPatient = mongoose.model('DeletedPatient', deletedPatientSchema);

async function getOrCreateQueue() {
  let queue = await Queue.findOne({ name: 'Main Clinic Queue' });
  if (!queue) {
    queue = new Queue();
    await queue.save();
  }
  return queue;
}

async function broadcastQueueStatus() {
  const queue = await getOrCreateQueue();
  const admin = await User.findOne();
  const patients = await Patient.find().sort({ tokenNumber: 1 });

  io.emit('queue-updated', {
    currentToken: queue.currentToken,
    totalTokensDistributed: queue.totalTokensDistributed,
    patients: patients,
    clinicStatus: queue.clinicStatus,
    expectedStartTime: admin ? admin.expectedStartTime : '',
    timePerPatient: admin ? admin.timePerPatient : 5,
    lastTokenUpdateTime: queue.lastTokenUpdateTime, 
    serverTime: Date.now() 
  });
}

app.get('/api/auth/clinic-status', async (req, res) => {
  try {
    const queue = await getOrCreateQueue();
    const admin = await User.findOne();
    res.status(200).json({ 
      status: queue.clinicStatus,
      expectedStartTime: admin ? admin.expectedStartTime : '',
      timePerPatient: admin ? admin.timePerPatient : 5,
      lastTokenUpdateTime: queue.lastTokenUpdateTime, 
      serverTime: Date.now() 
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/', (req, res) => {
  res.send('SmartQueue Backend is Running 🚀');
});

// ==========================================
// 🔐 AUTHENTICATION & ACCOUNT ROUTES
// ==========================================

app.post('/api/auth/signup', async (req, res) => {
  try {
    const { username, password, doctorName, clinicName, degree, mobile } = req.body;
    if (!username || !password) return res.status(400).json({ message: 'Username aur password bharna zaroori hai!' });
    const existingUser = await User.findOne({ username });
    if (existingUser) return res.status(400).json({ message: '❌ Yeh username pehle se exist karta hai!' });
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);
    const newUser = new User({ username, password: hashedPassword, doctorName: doctorName || 'Dr. Sahadat Ansari', clinicName: clinicName || 'LIFE CARE', degree: degree || 'MBBS, MD', mobile: mobile || '+91 0000000000' });
    await newUser.save();
    res.status(201).json({ message: 'Registration successful!' });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

app.post('/api/auth/login', async (req, res) => {
  try {
    const { username, password } = req.body;
    if (!username || !password) return res.status(400).json({ message: 'Username aur password required hai!' });
    const user = await User.findOne({ username });
    if (!user) return res.status(400).json({ message: '❌ Invalid Username or Password!' });
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(400).json({ message: '❌ Invalid Username or Password!' });
    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET || 'SECRET_KEY', { expiresIn: '1d' });
    res.json({ token, username: user.username });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

app.get('/api/auth/admin-profile', async (req, res) => {
  try {
    const user = await User.findOne();
    if (!user) return res.status(404).json({ message: 'Admin not found!' });
    res.status(200).json({ username: user.username, profileImage: user.profileImage || '', doctorName: user.doctorName, clinicName: user.clinicName, degree: user.degree, mobile: user.mobile, expectedStartTime: user.expectedStartTime, timePerPatient: user.timePerPatient });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

app.post('/api/auth/update-admin', async (req, res) => {
  try {
    const { username, password, profileImage, doctorName, clinicName, degree, mobile, expectedStartTime, timePerPatient } = req.body;
    const user = await User.findOne();
    if (!user) return res.status(404).json({ message: 'Admin user not found!' });
    if (username) user.username = username;
    if (profileImage) user.profileImage = profileImage;
    if (doctorName) user.doctorName = doctorName;
    if (clinicName) user.clinicName = clinicName;
    if (degree) user.degree = degree;
    if (mobile) user.mobile = mobile;
    if (expectedStartTime !== undefined) user.expectedStartTime = expectedStartTime;
    if (timePerPatient !== undefined) user.timePerPatient = Number(timePerPatient);
    if (password && password.trim() !== "") {
      const salt = await bcrypt.genSalt(10);
      user.password = await bcrypt.hash(password, salt);
    }
    
    await user.save(); 
    await broadcastQueueStatus(); 

    res.status(200).json({ message: 'Profile updated successfully!' });
  } catch (err) { if (err.code === 11000) return res.status(400).json({ message: 'Username already taken!' }); res.status(500).json({ error: err.message }); }
});

app.post('/api/auth/delete-account', async (req, res) => {
  try {
    const { username, password } = req.body;
    const user = await User.findOne({ username });
    if (!user) return res.status(404).json({ message: 'User not found!' });
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(400).json({ message: '❌ Incorrect Password! Account cannot be deleted.' });
    await User.deleteOne({ username });
    await Patient.deleteMany({});
    await DeletedPatient.deleteMany({});
    const queue = await getOrCreateQueue();
    queue.currentToken = 1; queue.totalTokensDistributed = 0; queue.clinicStatus = 'not-started'; queue.lastTokenUpdateTime = Date.now();
    await queue.save(); await broadcastQueueStatus();
    res.status(200).json({ message: 'Account and all data deleted successfully.' });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// ==========================================
// 🎫 PATIENT ROUTES & WEBSOCKETS 
// ==========================================
app.post('/api/auth/patient-checkin', async (req, res) => {
  try {
    const { patientName, mobileNumber } = req.body;
    if (!patientName || !mobileNumber) return res.status(400).json({ message: 'patientName aur mobileNumber required hai!' });
    
    await getOrCreateQueue();

    const updatedQueue = await Queue.findOneAndUpdate(
      { name: 'Main Clinic Queue' },
      { $inc: { totalTokensDistributed: 1 } },
      { returnDocument: 'after' }
    );

    let myAssignedToken = updatedQueue.totalTokensDistributed;

    if (myAssignedToken < updatedQueue.currentToken) {
      myAssignedToken = updatedQueue.currentToken;
      await Queue.updateOne(
        { name: 'Main Clinic Queue' }, 
        { $set: { totalTokensDistributed: myAssignedToken } }
      );
    }

    const newPatient = new Patient({ name: patientName, mobileNumber, tokenNumber: myAssignedToken });
    await newPatient.save();
    
    await broadcastQueueStatus();
    res.status(201).json({ myToken: myAssignedToken, patientName, mobileNumber, patientId: newPatient._id });
  } catch (err) { 
    res.status(500).json({ error: err.message }); 
  }
});

app.post('/api/auth/patient-leave', async (req, res) => {
  try {
    const { tokenToRemove } = req.body;
    if (!tokenToRemove) return res.status(400).json({ message: 'tokenToRemove required hai!' });
    const p = await Patient.findOne({ tokenNumber: parseInt(tokenToRemove) });
    if (p) {
      await DeletedPatient.create({
        name: p.name,
        mobileNumber: p.mobileNumber,
        tokenNumber: p.tokenNumber,
        createdAt: p.createdAt,
        deletedBy: 'by user'
      });
      await Patient.deleteOne({ _id: p._id });
    }
    await broadcastQueueStatus();
    res.status(200).json({ message: 'Left queue successfully' });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

app.post('/api/auth/auto-next', async (req, res) => {
  try {
    const { currentLive } = req.body;
    const queue = await getOrCreateQueue();
    if (queue.currentToken === parseInt(currentLive) && queue.currentToken < queue.totalTokensDistributed) {
      queue.currentToken++;
      queue.lastTokenUpdateTime = Date.now();
      await queue.save();
      await broadcastQueueStatus();
    }
    res.status(200).json({ success: true });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

app.get('/api/auth/deleted-patients', async (req, res) => {
  try {
    const list = await DeletedPatient.find().sort({ deletedAt: -1 });
    res.status(200).json(list);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.delete('/api/auth/deleted-patients', async (req, res) => {
  try {
    await DeletedPatient.deleteMany({});
    res.status(200).json({ message: 'Deleted history cleared' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

io.on('connection', async (socket) => {
  try { await broadcastQueueStatus(); } catch (err) {}

  socket.on('update-clinic-status', async (status) => {
    try {
      const queue = await getOrCreateQueue();
      queue.clinicStatus = status;
      if (status === 'active') queue.lastTokenUpdateTime = Date.now(); 
      await queue.save();
      io.emit('clinic-status-changed', status);
      await broadcastQueueStatus();
    } catch (err) {}
  });

  socket.on('next-token', async () => {
    try {
      const queue = await getOrCreateQueue();
      if (queue.currentToken < queue.totalTokensDistributed) {
        queue.currentToken++; 
        queue.lastTokenUpdateTime = Date.now(); 
        await queue.save(); await broadcastQueueStatus();
      }
    } catch (err) {}
  });

  socket.on('prev-token', async () => {
    try {
      const queue = await getOrCreateQueue();
      if (queue.currentToken > 1) {
        queue.currentToken--; 
        queue.lastTokenUpdateTime = Date.now(); 
        await queue.save(); await broadcastQueueStatus();
      }
    } catch (err) {}
  });

  socket.on('admin-delete-patient', async (data) => {
    try {
      const { id } = data;
      if (!id || !mongoose.Types.ObjectId.isValid(id)) return;
      const p = await Patient.findById(id);
      if (p) {
        await DeletedPatient.create({
          name: p.name,
          mobileNumber: p.mobileNumber,
          tokenNumber: p.tokenNumber,
          createdAt: p.createdAt,
          deletedBy: 'by admin'
        });
        await Patient.deleteOne({ _id: new mongoose.Types.ObjectId(id) });
      }
      await broadcastQueueStatus();
    } catch (err) {}
  });

  socket.on('admin-edit-patient', async (data) => {
    try {
      const { id, newName, newTokenNumber, newMobileNumber } = data;
      if (!id || !mongoose.Types.ObjectId.isValid(id)) return;
      await Patient.updateOne({ _id: new mongoose.Types.ObjectId(id) }, { name: newName, tokenNumber: parseInt(newTokenNumber), mobileNumber: newMobileNumber });
      await broadcastQueueStatus();
    } catch (err) {}
  });

  socket.on('reset-entire-queue', async (data) => {
    try {
      const { username, password } = data;
      const user = await User.findOne({ username });
      
      if (!user) return socket.emit('reset-status-response', { success: false, message: '❌ Account validation failed!' });
      
      const isMatch = await bcrypt.compare(password, user.password);
      if (!isMatch) return socket.emit('reset-status-response', { success: false, message: '❌ Incorrect Admin Password! Access Denied.' });
      
      const activePatients = await Patient.find({});
      if (activePatients.length > 0) {
        const resetTime = new Date();
        const historyDocs = activePatients.map(p => ({
          name: p.name,
          mobileNumber: p.mobileNumber,
          tokenNumber: p.tokenNumber,
          createdAt: p.createdAt,
          deletedAt: resetTime,
          deletedBy: 'by admin'
        }));
        await DeletedPatient.insertMany(historyDocs);
      }

      await Patient.deleteMany({});
      const queue = await getOrCreateQueue();
      queue.currentToken = 1; 
      queue.totalTokensDistributed = 0; 
      queue.clinicStatus = 'not-started'; 
      queue.lastTokenUpdateTime = Date.now(); 
      await queue.save();
      
      await broadcastQueueStatus();
      
    } catch (err) { 
      socket.emit('reset-status-response', { success: false, message: '❌ Critical internal database error.' }); 
    }
  });
});

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => { console.log(`Backend server running on port ${PORT}`); });