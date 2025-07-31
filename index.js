const express = require('express');
const multer = require('multer');
const cors = require('cors');
const { S3Client, PutObjectCommand } = require('@aws-sdk/client-s3');
require('dotenv').config();

const app = express();
const port = 3000;

app.use(cors());
app.use(express.json());

const storage = multer.memoryStorage();
const upload = multer({ storage });

// AWS S3 클라이언트 초기화
const s3 = new S3Client({
  region: process.env.AWS_REGION,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  },
});

app.post('/upload', upload.single('image'), async (req, res) => {
  if (!req.file) return res.status(400).json({ message: 'No file uploaded' });

  const bucketName = process.env.AWS_S3_BUCKET;
  const key = `uploads/${Date.now()}_${req.file.originalname}`;

  try {
    // S3에 파일 업로드
    await s3.send(
      new PutObjectCommand({
        Bucket: bucketName,
        Key: key,
        Body: req.file.buffer,
        ContentType: req.file.mimetype,
      })
    );

    const url = `https://${bucketName}.s3.${process.env.AWS_REGION}.amazonaws.com/${key}`;

    res.json({
      message: 'File uploaded successfully',
      url,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Failed to upload to S3' });
  }
});

app.listen(port, () => {
  console.log(`Server listening at http://localhost:${port}`);
});
