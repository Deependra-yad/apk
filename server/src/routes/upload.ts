import { Router } from 'express';
import multer from 'multer';

const router = Router();

const storage = multer.memoryStorage();

const upload = multer({
  storage: storage,
  limits: { fileSize: 50 * 1024 * 1024 } // 50MB limit
});

router.post('/', upload.single('file'), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: 'No file uploaded' });
  }

  const mimeType = req.file.mimetype;
  const base64Data = req.file.buffer.toString('base64');
  const fileUrl = `data:${mimeType};base64,${base64Data}`;
  
  const fileName = req.file.originalname;
  const fileSizeInBytes = req.file.size;
  const fileSize = fileSizeInBytes > 1024 * 1024 
    ? `${(fileSizeInBytes / (1024 * 1024)).toFixed(1)} MB`
    : `${Math.round(fileSizeInBytes / 1024)} KB`;

  let type = 'file';
  if (mimeType.startsWith('image/')) type = 'image';
  else if (mimeType.startsWith('video/')) type = 'video';
  else if (mimeType.startsWith('audio/')) type = 'audio';

  res.json({
    fileUrl,
    fileName,
    fileSize,
    mimeType,
    type
  });
});

export default router;
