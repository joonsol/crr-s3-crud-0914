import { useEffect, useState } from "react";
import api from "../api";
import "./FileList.scss"

export default function FileList() {
  const [items, setItems] = useState([]);
  const load = async () => setItems((await api.get("/files")).data);


  useEffect(() => {
    load();
  }, []);

  const del = async id => { await api.delete(`/files/${id}`); await load(); };

  return (
    <ul className="file-list">
      {items.map(it => (
        <li 
        key={it._id} 
    >
          <div>
            <b>{it.title || it.originalName}</b></div>
          {it.contentType?.startsWith("image/") && (
            <img src={it.url} alt="" style={{ maxWidth: 200, display: "block" }} />
          )}
          <div>{it.description}</div>
          <a href={it.url} target="_blank" rel="noreferrer">Open</a>
          <button onClick={() => del(it._id)} style={{ marginLeft: 8 }}>Delete</button>
        </li>
      ))}
    </ul>
  );
}