import { useState } from "react";
import api from "../api";
import "./UploadForm.scss"

export default function UploadForm({ onDone }) {
  const [file, setFile] = useState(null);
  const [title, setTitle] = useState("");
  const [desc, setDesc] = useState("");

  const upload = async e => {
    e.preventDefault();
    if (!file) return;

    // 1) presign
    const { data: { url, key } } = await api.post("/files/presign", {
      filename: file.name, contentType: file.type
    });

    // 2) put to S3
    await fetch(url, { method: "PUT", headers: { "Content-Type": file.type }, body: file });

    // 3) save metadata
    await api.post("/files", {
      key, originalName: file.name, contentType: file.type, size: file.size,
      title, description: desc
    });

    setFile(null); setTitle(""); setDesc("");
    onDone?.();
  };

  return (
    <form onSubmit={upload} className="form-list">
      <input type="file" onChange={e=>setFile(e.target.files[0])} />
      <input type="text" placeholder="title" value={title} onChange={e=>setTitle(e.target.value)} />
      <input type="text" placeholder="description" value={desc} onChange={e=>setDesc(e.target.value)} />
      <button type="submit">Upload</button>
    </form>
  );
}