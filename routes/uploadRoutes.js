const express = require('express');
const multer = require('multer');
const sharp = require('sharp');
const path = require('path');
const fs = require('fs');
const { protect } = require('../middleware/auth');
const { isValidFile } = require('../utils/validator');

const router = express.Router();

// Ensure uploads directory exists
const uploadsDir = path.join(__dirname, '../uploads');
if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { recursive: true });
}

// Configure multer storage
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, uploadsDir);
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, uniqueSuffix + path.extname(file.originalname));
    }
});

// File filter
const fileFilter = (req, file, cb) => {
    const allowedMimeTypes = [
        'image/jpeg',
        'image/png',
        'image/gif',
        'image/webp',
        'application/pdf',
        'text/plain',
        'application/msword',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'video/mp4',
        'video/webm',
        'audio/mpeg',
        'audio/wav'
    ];
    
    if (allowedMimeTypes.includes(file.mimetype)) {
        cb(null, true);
    } else {
        cb(new Error('Invalid file type'), false);
    }
};

// Configure multer
const upload = multer({
    storage,
    fileFilter,
    limits: {
        fileSize: process.env.MAX_FILE_SIZE ? parseInt(process.env.MAX_FILE_SIZE) : 10485760 // 10MB default
    }
});

/**
 * @swagger
 * /api/upload/file:
 *   post:
 *     summary: Upload a file
 *     tags: [Upload]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               file:
 *                 type: string
 *                 format: binary
 *     responses:
 *       200:
 *         description: File uploaded successfully
 */
router.post('/file', protect, upload.single('file'), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ success: false, error: 'No file uploaded' });
        }

        let fileUrl = `/uploads/${req.file.filename}`;
        let thumbnailUrl = null;

        // Generate thumbnail for images
        if (req.file.mimetype.startsWith('image/')) {
            const thumbnailFilename = `thumb-${req.file.filename}`;
            const thumbnailPath = path.join(uploadsDir, thumbnailFilename);
            
            await sharp(req.file.path)
                .resize(200, 200, { fit: 'cover' })
                .jpeg({ quality: 80 })
                .toFile(thumbnailPath);
            
            thumbnailUrl = `/uploads/${thumbnailFilename}`;
        }

        res.status(200).json({
            success: true,
            data: {
                fileUrl,
                thumbnailUrl,
                fileName: req.file.originalname,
                fileSize: req.file.size,
                mimeType: req.file.mimetype
            }
        });
    } catch (error) {
        console.error('File upload error:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

/**
 * @swagger
 * /api/upload/image:
 *   post:
 *     summary: Upload an image with processing
 *     tags: [Upload]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               file:
 *                 type: string
 *                 format: binary
 *     responses:
 *       200:
 *         description: Image uploaded and processed
 */
router.post('/image', protect, upload.single('file'), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ success: false, error: 'No image uploaded' });
        }

        if (!req.file.mimetype.startsWith('image/')) {
            return res.status(400).json({ success: false, error: 'File must be an image' });
        }

        // Process image with sharp
        const processedFilename = `processed-${req.file.filename}`;
        const processedPath = path.join(uploadsDir, processedFilename);

        await sharp(req.file.path)
            .resize(800, 800, { 
                fit: 'inside',
                withoutEnlargement: true 
            })
            .jpeg({ quality: 85 })
            .toFile(processedPath);

        // Delete original file
        fs.unlinkSync(req.file.path);

        // Generate thumbnail
        const thumbnailFilename = `thumb-${processedFilename}`;
        const thumbnailPath = path.join(uploadsDir, thumbnailFilename);
        
        await sharp(processedPath)
            .resize(200, 200, { fit: 'cover' })
            .jpeg({ quality: 80 })
            .toFile(thumbnailPath);

        res.status(200).json({
            success: true,
            data: {
                fileUrl: `/uploads/${processedFilename}`,
                thumbnailUrl: `/uploads/${thumbnailFilename}`,
                fileName: req.file.originalname,
                fileSize: fs.statSync(processedPath).size,
                mimeType: 'image/jpeg'
            }
        });
    } catch (error) {
        console.error('Image upload error:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

module.exports = router;
