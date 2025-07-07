import mongoose from 'mongoose';

const documentSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true
  },
  fileType: {
    type: String,
    required: true
  },
  filePath: {
    type: String,
    required: true
  },
  owner: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  comment: {
    type: String,
    trim: true,
    default: ''
  },
  approved: {
    type: Boolean,
    default: false
  },
  accessLevel: {
    type: String,
    enum: ['public', 'private', 'restricted'],
    default: 'private'
  },
  uploadDate: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

const Document = mongoose.model('Document', documentSchema);

export default Document; 