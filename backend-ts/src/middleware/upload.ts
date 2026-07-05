import multer from 'multer';
import path from 'path';
import { env } from '../config/env';
import fs from 'fs';

// Ensure upload directories exist
const uploadDirs = ['uploads', 'uploads/profile_pictures', 'uploads/config_files', 'uploads/report_images', 'uploads/chat_images'];
for (const dir of uploadDirs) {
  const fullPath = path.resolve(dir);
  if (!fs.existsSync(fullPath)) {
    fs.mkdirSync(fullPath, { recursive: true });
  }
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    let subdir = 'uploads';
    if (file.fieldname === 'profile_picture') subdir = 'uploads/profile_pictures';
    else if (file.fieldname === 'file' || file.fieldname === 'config_file') subdir = 'uploads/config_files';
    else if (file.fieldname === 'image' && req.path.includes('report')) subdir = 'uploads/report_images';
    else if (file.fieldname === 'image') subdir = 'uploads/chat_images';
    cb(null, path.resolve(subdir));
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  },
});

export const upload = multer({ storage, limits: { fileSize: 50 * 1024 * 1024 } });

export function getFileUrl(filename: string, subdir: string = 'uploads'): string {
  return `/${subdir}/${filename}`;
}
