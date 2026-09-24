const mongoose = require('mongoose');

const EventSchema = new mongoose.Schema({
  title: { type: String, required: true },
  category: { 
    type: String, 
    required: true, 
    enum: ['NBFC', 'Education', 'Tech', 'BFSI', 'Banking', 'Enterprise', 'Pharma', 'Marketing'] 
  },
  status: { 
    type: String, 
    required: true, 
    enum: ['Upcoming', 'Past'], 
    default: 'Upcoming' 
  },
  format: { 
    type: String, 
    required: true, 
    enum: ['In-person Event', 'Residential Event', 'Round Table', 'Custom Event', 'Panel Discussion', 'Webinar', 'Case Study', 'Virtual Event'],
    default: 'In-person Event'
  },
  date: { type: String, required: true },
  location: { type: String, required: true },
  featureImage: { type: String, required: true },
  websiteUrl: { type: String, required: true },
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Event', EventSchema);