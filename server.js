const express = require('express');
const mongoose = require('mongoose');
const multer = require('multer');
const cors = require('cors');
const path = require('path');

const app = express();

// 1. Explicitly allow CORS for all origins & HTTP methods
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// 2. Connect to MongoDB
mongoose.connect('mongodb://127.0.0.1:27017/event_portal')
  .then(() => console.log('✅ Connected to MongoDB'))
  .catch((err) => console.error('❌ Connection error:', err));

// 3. Schema & Model
const EventSchema = new mongoose.Schema({
  title: { type: String, required: true },
  category: { type: String, required: true },
  status: { type: String, default: 'Upcoming' },
  format: { type: String, default: 'In-person Event' },
  date: { type: String, required: true },
  location: { type: String, required: true },
  featureImage: { type: String, required: true },
  websiteUrl: { type: String, required: true },
  createdAt: { type: Date, default: Date.now }
});

const Event = mongoose.model('Event', EventSchema);

// 4. File Upload Config
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, 'uploads/'),
  filename: (req, file, cb) => cb(null, Date.now() + '-' + file.originalname)
});
const upload = multer({ storage });

// GET: Fetch events
app.get('/api/events', async (req, res) => {
  try {
    const { category, status, format } = req.query;
    let query = {};

    if (category && category !== 'All') query.category = category;

    if (status && status !== 'All') {
      if (status === 'Upcoming') {
        query.$or = [{ status: 'Upcoming' }, { status: { $exists: false } }];
      } else {
        query.status = status;
      }
    }

    if (format && format !== 'All') query.format = format;

    const events = await Event.find(query).sort({ createdAt: -1 });
    res.json(events);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST: Create Event
app.post('/api/events', upload.single('featureImage'), async (req, res) => {
  try {
    const { title, category, status, format, date, location, websiteUrl } = req.body;
    const imageUrl = req.file ? `http://localhost:5000/uploads/${req.file.filename}` : '';

    const newEvent = new Event({
      title,
      category,
      status: status || 'Upcoming',
      format: format || 'In-person Event',
      date,
      location,
      websiteUrl,
      featureImage: imageUrl
    });

    await newEvent.save();
    res.status(201).json(newEvent);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PUT: Update Event (Multer wrapper to safely parse text fields when file is missing)
app.put('/api/events/:id', (req, res, next) => {
  upload.single('featureImage')(req, res, (err) => {
    if (err) return res.status(400).json({ error: err.message });
    next();
  });
}, async (req, res) => {
  try {
    const updateData = { ...req.body };

    if (req.file) {
      updateData.featureImage = `http://localhost:5000/uploads/${req.file.filename}`;
    } else {
      delete updateData.featureImage; // Preserve existing image if no file selected
    }

    const updatedEvent = await Event.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true, runValidators: true }
    );

    if (!updatedEvent) {
      return res.status(404).json({ error: 'Event not found' });
    }

    res.json(updatedEvent);
  } catch (err) {
    console.error('Update Error:', err);
    res.status(500).json({ error: err.message });
  }
});

// DELETE: Remove Event
app.delete('/api/events/:id', async (req, res) => {
  try {
    await Event.findByIdAndDelete(req.params.id);
    res.json({ message: 'Event deleted successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.listen(5000, () => console.log('🚀 Server running on http://localhost:5000'));