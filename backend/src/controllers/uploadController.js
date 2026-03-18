const asyncHandler = require('../utils/asyncHandler');
const configureCloudinary = require('../config/cloudinary');
const { ERROR_MESSAGES } = require('../config/constants');
const { logger } = require('../utils/logger');

const cloudinary = configureCloudinary();
 
/**
 * @desc    Upload file to Cloudinary
 * @route   POST /api/upload
 * @access  Private
 */
const uploadFile = asyncHandler(async (req, res) => {
  console.log('\n📥 UPLOAD REQUEST RECEIVED');
  console.log('Headers:', req.headers);
  console.log('Body:', req.body);
  console.log('File:', req.file ? {
    fieldname: req.file.fieldname,
    originalname: req.file.originalname,
    encoding: req.file.encoding,
    mimetype: req.file.mimetype,
    size: req.file.size,
    path: req.file.path
  } : 'No file');

  if (!req.file) {
    console.error('❌ No file in request');
    return res.status(400).json({
      success: false,
      error: 'No file uploaded'
    });
  }

  // Check file size (your limit is 10MB)
  if (req.file.size > 7 * 1024 * 1024) {
    console.error('❌ File too large:', req.file.size);
    return res.status(400).json({
      success: false,
      error: 'File size exceeds 10MB limit'
    });
  }

  // Check file type
  const allowedTypes = [
    'image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp',
    'video/mp4', 'video/webm', 'video/quicktime',
    'audio/mpeg', 'audio/mp3', 'audio/wav', 'audio/ogg', 'audio/webm',
    'application/pdf', 'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'text/plain'
  ];

  if (!allowedTypes.includes(req.file.mimetype)) {
    console.error('❌ Invalid file type:', req.file.mimetype);
    return res.status(400).json({
      success: false,
      error: 'File type not allowed'
    });
  }

  try {
    // Determine resource type for Cloudinary
    let resourceType = 'auto';
    const mimeType = req.file.mimetype;
    
    if (mimeType.startsWith('image/')) {
      resourceType = 'image';
    } else if (mimeType.startsWith('video/')) {
      resourceType = 'video';
    } else if (mimeType.startsWith('audio/')) {
      resourceType = 'video'; // Cloudinary treats audio as video
    }

    console.log('☁️ Uploading to Cloudinary...');
    console.log('   Resource type:', resourceType);
    console.log('   File path:', req.file.path);

    // Upload to Cloudinary
    const uploadResult = await cloudinary.uploader.upload(req.file.path, {
      resource_type: resourceType,
      folder: 'chat-app/profiles',
      use_filename: true,
      unique_filename: true,
      overwrite: false,
      transformation: [
        { width: 500, height: 500, crop: 'limit' }, // Resize if too large
        { quality: 'auto' }
      ]
    });

    console.log('✅ Cloudinary upload successful:', uploadResult.public_id);

    // Generate thumbnail for images and videos
    let thumbnailUrl = null;
    if (resourceType === 'image' || resourceType === 'video') {
      const thumbnailResult = cloudinary.url(uploadResult.public_id, {
        transformation: [
          { width: 300, height: 300, crop: 'fill' },
          { quality: 'auto' }
        ]
      });
      thumbnailUrl = thumbnailResult;
    }

    logger.info(`File uploaded: ${uploadResult.original_filename} (${uploadResult.bytes} bytes)`);

    res.json({
      success: true,
      data: {
        url: uploadResult.secure_url,
        public_id: uploadResult.public_id,
        format: uploadResult.format,
        resource_type: uploadResult.resource_type,
        bytes: uploadResult.bytes,
        width: uploadResult.width,
        height: uploadResult.height,
        duration: uploadResult.duration,
        thumbnail_url: thumbnailUrl,
        original_filename: uploadResult.original_filename,
        mime_type: mimeType
      }
    });

  } catch (error) {
    console.error('❌ Cloudinary upload error:', error);
    console.error('   Error name:', error.name);
    console.error('   Error message:', error.message);
    console.error('   Error stack:', error.stack);
    
    res.status(500).json({
      success: false,
      error: 'Failed to upload file: ' + error.message
    });
  }
})

/**
 * @desc    Upload multiple files
 * @route   POST /api/upload/multiple
 * @access  Private
 */
const uploadMultipleFiles = asyncHandler(async (req, res) => {
  if (!req.files || req.files.length === 0) {
    return res.status(400).json({
      success: false,
      error: 'No files uploaded'
    });
  }

  const uploadResults = [];
  const errors = [];

  // Upload each file
  for (const file of req.files) {
    try {
      const mimeType = file.mimetype;
      let resourceType = 'auto';
      
      if (mimeType.startsWith('image/')) {
        resourceType = 'image';
      } else if (mimeType.startsWith('video/')) {
        resourceType = 'video';
      } else if (mimeType.startsWith('audio/')) {
        resourceType = 'video';
      }

      const uploadResult = await cloudinary.uploader.upload(file.path, {
        resource_type: resourceType,
        folder: 'chat-app',
        use_filename: true,
        unique_filename: true,
        overwrite: false
      });

      // Generate thumbnail for images and videos
      let thumbnailUrl = null;
      if (resourceType === 'image' || resourceType === 'video') {
        const thumbnailResult = cloudinary.url(uploadResult.public_id, {
          transformation: [
            { width: 300, height: 300, crop: 'fill' },
            { quality: 'auto' }
          ]
        });
        thumbnailUrl = thumbnailResult;
      }

      uploadResults.push({
        url: uploadResult.secure_url,
        public_id: uploadResult.public_id,
        format: uploadResult.format,
        resource_type: uploadResult.resource_type,
        bytes: uploadResult.bytes,
        width: uploadResult.width,
        height: uploadResult.height,
        duration: uploadResult.duration,
        thumbnail_url: thumbnailUrl,
        original_filename: uploadResult.original_filename,
        mime_type: mimeType
      });

    } catch (error) {
      logger.error(`Error uploading file ${file.originalname}:`, error);
      errors.push({
        filename: file.originalname,
        error: error.message
      });
    }
  }

  res.json({
    success: true,
    data: {
      files: uploadResults,
      errors: errors.length > 0 ? errors : undefined,
      message: `Successfully uploaded ${uploadResults.length} file(s)`
    }
  });
});

/**
 * @desc    Delete file from Cloudinary
 * @route   DELETE /api/upload/:publicId
 * @access  Private
 */
const deleteFile = asyncHandler(async (req, res) => {
  const { publicId } = req.params;

  try {
    const result = await cloudinary.uploader.destroy(publicId);
    
    if (result.result === 'ok') {
      logger.info(`File deleted: ${publicId}`);
      res.json({
        success: true,
        message: 'File deleted successfully'
      });
    } else {
      res.status(404).json({
        success: false,
        error: 'File not found'
      });
    }
  } catch (error) {
    logger.error('File delete error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to delete file'
    });
  }
});

/**
 * @desc    Get upload limits and allowed types
 * @route   GET /api/upload/limits
 * @access  Private
 */
const getUploadLimits = asyncHandler(async (req, res) => {
  res.json({
    success: true,
    data: {
      max_file_size: 10 * 1024 * 1024, // 10MB
      allowed_types: [
        'image/jpeg',
        'image/jpg',
        'image/png',
        'image/gif',
        'image/webp',
        'video/mp4',
        'video/webm',
        'video/quicktime',
        'audio/mpeg',
        'audio/mp3',
        'audio/wav',
        'audio/ogg',
        'audio/webm',
        'application/pdf',
        'application/msword',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'text/plain'
      ],
      max_files_per_upload: 10,
      image_formats: ['jpg', 'jpeg', 'png', 'gif', 'webp'],
      video_formats: ['mp4', 'webm', 'mov'],
      audio_formats: ['mp3', 'wav', 'ogg'],
      document_formats: ['pdf', 'doc', 'docx', 'txt']
    }
  });
});

module.exports = {
  uploadFile,
  uploadMultipleFiles,
  deleteFile,
  getUploadLimits
};