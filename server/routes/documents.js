import express from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { auth, adminAuth } from '../middleware/auth.js';
import Document from '../models/Document.js';
import User from '../models/User.js';
import jwt from 'jsonwebtoken';

const router = express.Router();
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const uploadsDir = path.join(__dirname, '..', '..', 'uploads');

// Configure multer for file upload
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const userDir = path.join(uploadsDir, 'documents', req.user._id.toString());
    if (!fs.existsSync(userDir)) {
      fs.mkdirSync(userDir, { recursive: true });
    }
    cb(null, userDir);
  },
  filename: (req, file, cb) => {
    // Create a unique filename with original extension
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  }
});

const fileFilter = (req, file, cb) => {
  const allowedTypes = /jpeg|jpg|png|pdf|doc|docx/;
  const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
  const mimetype = allowedTypes.test(file.mimetype);

  if (extname && mimetype) {
    return cb(null, true);
  }
  cb(new Error('Invalid file type! Only PDF, DOC, DOCX, JPG, and PNG files are allowed.'));
};

const upload = multer({
  storage,
  limits: { 
    fileSize: 10 * 1024 * 1024, // 10MB limit
    files: 1 // Only 1 file at a time
  },
  fileFilter
});

// Upload document
router.post('/upload', auth, upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'No file uploaded' });
    }

    // Get the original filename without extension
    const fileNameWithoutExt = req.file.originalname.replace(/\.[^/.]+$/, "");

    const document = new Document({
      title: req.body.title || fileNameWithoutExt, // Use filename if title is empty
      fileType: path.extname(req.file.originalname).toLowerCase(),
      filePath: path.relative(uploadsDir, req.file.path),
      owner: req.user._id,
      accessLevel: 'private',
      comment: req.body.comment || ''
    });

    await document.save();
    res.status(201).json({
      ...document.toObject(),
      message: 'Document uploaded successfully'
    });
  } catch (error) {
    // Clean up file if document save fails
    if (req.file) {
      fs.unlink(req.file.path, (err) => {
        if (err) console.error('Error deleting file:', err);
      });
    }
    res.status(500).json({ message: 'Upload failed' });
  }
});

// Get user's documents
router.get('/user', auth, async (req, res) => {
  try {
    const documents = await Document.find({ 
      $or: [
        { owner: req.user._id },
        { accessLevel: 'public' },
        { 
          accessLevel: 'restricted',
          owner: { $ne: req.user._id }
        }
      ]
    })
    .populate('owner', 'firstName lastName')
    .sort({ createdAt: -1 });
    
    res.json(documents);
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch documents' });
  }
});

// Get all documents (admin only)
router.get('/admin', adminAuth, async (req, res) => {
  try {
    const documents = await Document.find()
      .populate('owner', 'firstName lastName')
      .sort({ createdAt: -1 });
    res.json(documents);
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch documents' });
  }
});

// Download document
router.get('/download/:id', auth, async (req, res) => {
  try {
    const document = await Document.findById(req.params.id)
      .populate('owner', 'firstName lastName email');

    if (!document) {
      return res.status(404).json({ message: 'Document not found' });
    }

    // Check access permissions
    if (document.accessLevel === 'private' && document.owner._id.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Access denied' });
    }

    if (document.accessLevel === 'restricted' && 
        !document.allowedUsers.includes(req.user.id) && 
        document.owner._id.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Access denied' });
    }

    // Construct full file path
    const fullPath = path.join(uploadsDir, document.filePath);
    
    // Check if file exists
    if (!fs.existsSync(fullPath)) {
      return res.status(404).json({ message: 'File not found' });
    }

    // Read file from uploads directory
    const fileData = fs.readFileSync(fullPath);

    // Set response headers for download
    res.setHeader('Content-Type', 'application/octet-stream');
    res.setHeader('Content-Disposition', `attachment; filename="${path.basename(document.filePath)}"`);
    
    // Send file data
    res.send(fileData);
  } catch (error) {
    console.error('Error downloading document:', error);
    res.status(500).json({ message: 'Error downloading document' });
  }
});

// Get public documents
router.get('/public', auth, async (req, res) => {
  try {
    const documents = await Document.find({ 
      accessLevel: 'public',
      approved: true
    })
    .populate('owner', 'firstName lastName')
    .sort({ createdAt: -1 });
    
    res.json(documents);
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch public documents' });
  }
});

// View document
router.get('/view/:id', async (req, res) => {
  try {
    // Get token from query parameter
    const token = req.query.token;
    if (!token) {
      return res.status(401).json({ message: 'Please authenticate' });
    }

    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.id);
    if (!user) {
      return res.status(401).json({ message: 'Please authenticate' });
    }

    const document = await Document.findById(req.params.id)
      .populate('owner', 'firstName lastName email');

    if (!document) {
      return res.status(404).json({ message: 'Document not found' });
    }

    // Check access permissions
    if (document.accessLevel === 'private' && document.owner._id.toString() !== user.id) {
      return res.status(403).json({ message: 'Access denied' });
    }

    if (document.accessLevel === 'restricted' && 
        !document.allowedUsers.includes(user.id) && 
        document.owner._id.toString() !== user.id) {
      return res.status(403).json({ message: 'Access denied' });
    }

    // Get file extension
    const fileExt = path.extname(document.filePath).toLowerCase();
    
    // Set appropriate content type based on file extension
    let contentType = 'application/octet-stream';
    switch (fileExt) {
      case '.pdf':
        contentType = 'application/pdf';
        break;
      case '.jpg':
      case '.jpeg':
        contentType = 'image/jpeg';
        break;
      case '.png':
        contentType = 'image/png';
        break;
      case '.gif':
        contentType = 'image/gif';
        break;
      case '.txt':
        contentType = 'text/plain';
        break;
      case '.doc':
        contentType = 'application/msword';
        break;
      case '.docx':
        contentType = 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';
        break;
      case '.xls':
        contentType = 'application/vnd.ms-excel';
        break;
      case '.xlsx':
        contentType = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
        break;
    }

    // Construct full file path
    const fullPath = path.join(uploadsDir, document.filePath);
    
    // Check if file exists
    if (!fs.existsSync(fullPath)) {
      return res.status(404).json({ message: 'File not found' });
    }

    // Set response headers
    res.setHeader('Content-Type', contentType);
    res.setHeader('Content-Disposition', `inline; filename="${path.basename(document.filePath)}"`);
    
    // Use sendFile instead of send for better file handling
    res.sendFile(fullPath);
  } catch (error) {
    console.error('Error viewing document:', error);
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({ message: 'Please authenticate' });
    }
    res.status(500).json({ message: 'Error viewing document' });
  }
});

// Approve/reject document
router.post('/:id/approve', adminAuth, async (req, res) => {
  try {
    const { approved } = req.body;
    const document = await Document.findByIdAndUpdate(
      req.params.id,
      { approved },
      { new: true }
    ).populate('owner', 'firstName lastName');
    
    if (!document) {
      return res.status(404).json({ message: 'Document not found' });
    }
    
    res.json(document);
  } catch (error) {
    res.status(500).json({ message: 'Failed to update document status' });
  }
});

// Update document access level
router.post('/:id/access', adminAuth, async (req, res) => {
  try {
    const { accessLevel } = req.body;
    const document = await Document.findByIdAndUpdate(
      req.params.id,
      { accessLevel },
      { new: true }
    );
    res.json(document);
  } catch (error) {
    res.status(500).json({ message: 'Failed to update access level' });
  }
});

// Delete document
router.delete('/:id', auth, async (req, res) => {
  try {
    const document = await Document.findById(req.params.id);
    
    if (!document) {
      return res.status(404).json({ message: 'Document not found' });
    }

    // Check if the user is the owner of the document
    if (document.owner.toString() !== req.user.id) {
      return res.status(403).json({ message: 'You can only delete your own documents' });
    }

    // Delete the file from the filesystem
    const fullPath = path.join(uploadsDir, document.filePath);
    if (fs.existsSync(fullPath)) {
      fs.unlinkSync(fullPath);
    }

    // Delete the document from the database
    await Document.findByIdAndDelete(req.params.id);

    res.json({ message: 'Document deleted successfully' });
  } catch (error) {
    console.error('Error deleting document:', error);
    res.status(500).json({ message: 'Failed to delete document' });
  }
});

// Helper function to get content type
function getContentType(fileType) {
  const types = {
    '.pdf': 'application/pdf',
    '.doc': 'application/msword',
    '.docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    '.jpg': 'image/jpeg',
    '.jpeg': 'image/jpeg',
    '.png': 'image/png'
  };
  return types[fileType.toLowerCase()] || 'application/octet-stream';
}

export default router; 