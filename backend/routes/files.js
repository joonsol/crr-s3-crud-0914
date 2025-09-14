import { Router } from 'express';
import { nanoid } from 'nanoid';
import FileItem from '../models/FileItem.js';
import { presignGet, presignPut, deleteObject } from '../src/s3.js';

const r = Router();

// 업로드용 PUT 프리사인드 URL
r.post("/presign", async (req, res) => {
  const { filename, contentType } = req.body;
  if (!filename || !contentType) {
    return res.status(400).json({ error: "filename/contentType required" });
  }
  const key = `uploads/${Date.now()}-${nanoid(6)}-${filename}`;
  const url = await presignPut(key, contentType);
  res.json({ url, key });
});

// 메타데이터 저장
r.post("/", async (req, res) => {
  const { key, originalName, contentType, size, title = "", description = "" } = req.body;
  const doc = await FileItem.create({ key, originalName, contentType, size, title, description });
  res.status(201).json(doc);
});


// 목록
r.get("/", async (req, res) => {
  const items = await FileItem.find().sort({ createdAt: -1 }).lean();
  const out = await Promise.all(
    items.map(async (it) => ({ ...it, url: await presignGet(it.key, 300) }))
  );
  res.json(out);
});



// 단건
r.get("/:id", async (req, res) => {
  const it = await FileItem.findById(req.params.id).lean();
  if (!it) return res.sendStatus(404);
  it.url = await presignGet(it.key, 300);
  res.json(it);
});

// 메타 수정
r.patch("/:id", async (req, res) => {
  const { title, description } = req.body;
  const it = await FileItem.findByIdAndUpdate(
    req.params.id,
    { title, description },
    { new: true }
  );
  res.json(it);
});

// 삭제 (DB + S3)
// 삭제 (DB + S3)
r.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    // 잘못된 ObjectId 대응(선택)
    if (!id || id.length !== 24) {
      return res.status(400).json({ error: 'invalid id' });
    }

    const it = await FileItem.findById(id);
    if (!it) return res.sendStatus(404);

    // S3 객체 삭제 (없는 키여도 S3는 보통 성공으로 처리)
    await deleteObject(it.key);

    // DB 문서 삭제
    await it.deleteOne();

    return res.status(204).json({message:"성공적 삭제"});
  } catch (err) {
    // Mongoose 캐스팅 에러 상세 처리
    if (err?.name === 'CastError') {
      return res.status(400).json({ error: 'invalid id' });
    }
    console.error('Delete error:', err);
    return res.status(500).json({ error: 'failed to delete file' });
  }
});

export default r;
