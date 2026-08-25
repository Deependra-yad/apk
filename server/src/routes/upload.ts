import { Router } from 'express';
import multer from 'multer';
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import { v4 as uuidv4 } from 'uuid';

const router = Router();
const storage = multer.memoryStorage();
const upload = multer({
  storage: storage,
  limits: { fileSize: 50 * 1024 * 1024 } // 50MB limit
});

// Configure S3 Client (Works for AWS S3, Cloudflare R2, Oracle, DigitalOcean Spaces)
// These environment variables need to be set in your Railway dashboard
const s3Client = new S3Client({
  region: process.env.S3_REGION || 'auto',
  endpoint: process.env.S3_ENDPOINT, // e.g., https://<ACCOUNT_ID>.r2.cloudflarestorage.com
  credentials: {
    accessKeyId: process.env.S3_ACCESS_KEY_ID || '',
    secretAccessKey: process.env.S3_SECRET_ACCESS_KEY || '',
  }
});

router.post('/', upload.single('file'), async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: 'No file uploaded' });
  }

  const mimeType = req.file.mimetype;
  const fileName = req.file.originalname;
  const fileSizeInBytes = req.file.size;
  const fileSize = fileSizeInBytes > 1024 * 1024 
    ? `${(fileSizeInBytes / (1024 * 1024)).toFixed(1)} MB`
    : `${Math.round(fileSizeInBytes / 1024)} KB`;

  let type = 'file';
  if (mimeType.startsWith('image/')) type = 'image';
  else if (mimeType.startsWith('video/')) type = 'video';
  else if (mimeType.startsWith('audio/')) type = 'audio';

  try {
    // If S3 credentials exist, upload to S3 / R2
    if (process.env.S3_ACCESS_KEY_ID && process.env.S3_BUCKET_NAME) {
      const fileExtension = fileName.split('.').pop();
      const uniqueFileName = `${uuidv4()}.${fileExtension}`;
      
      const uploadParams = {
        Bucket: process.env.S3_BUCKET_NAME,
        Key: uniqueFileName,
        Body: req.file.buffer,
        ContentType: mimeType,
      };

      await s3Client.send(new PutObjectCommand(uploadParams));

      // Construct the public URL (Requires configuring a public domain in R2/S3)
      // e.g., https://pub-xxxxxxxxxx.r2.dev
      const publicUrlBase = process.env.S3_PUBLIC_DOMAIN || process.env.S3_ENDPOINT;
      const fileUrl = `${publicUrlBase}/${uniqueFileName}`;

      return res.json({ fileUrl, fileName, fileSize, mimeType, type });
    } else {
      // FALLBACK: If S3 isn't configured yet, fallback to Base64 (so the app doesn't break instantly)
      const base64Data = req.file.buffer.toString('base64');
      const fileUrl = `data:${mimeType};base64,${base64Data}`;
      return res.json({ fileUrl, fileName, fileSize, mimeType, type });
    }
  } catch (error) {
    console.error('Upload Error:', error);
    return res.status(500).json({ error: 'Failed to upload file to cloud storage' });
  }
});

export default router;
