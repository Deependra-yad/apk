import { Router } from 'express';
import multer from 'multer';
import { PrismaClient } from '@prisma/client';

const router = Router();
const storage = multer.memoryStorage();
const upload = multer({
  storage: storage,
  limits: { fileSize: 50 * 1024 * 1024 } // 50MB limit
});

const prisma = new PrismaClient();

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
    // Highly Optimized Database Binary Storage (Supabase/Railway only)
    const media = await prisma.media.create({
      data: {
        data: req.file.buffer,
        mimeType: mimeType,
        fileName: fileName,
      }
    });

    const fileUrl = `/api/upload/${media.id}`;
    return res.json({ fileUrl, fileName, fileSize, mimeType, type });
  } catch (error) {
    console.error('Upload Error:', error);
    return res.status(500).json({ error: 'Failed to upload file to database' });
  }
});

// GET route to serve the binary data directly to the browser
router.get('/:id', async (req, res) => {
  try {
    const media = await prisma.media.findUnique({
      where: { id: req.params.id }
    });

    if (!media) {
      return res.status(404).send('Media not found');
    }

    // Set aggressive caching headers so the browser doesn't re-download it
    res.setHeader('Content-Type', media.mimeType);
    res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
    if (media.fileName) {
      res.setHeader('Content-Disposition', `inline; filename="${media.fileName}"`);
    }

    return res.send(media.data);
  } catch (error) {
    console.error('Media Fetch Error:', error);
    return res.status(500).send('Internal Server Error');
  }
});

export default router;
