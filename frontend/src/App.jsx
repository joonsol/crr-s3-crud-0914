import UploadForm from "./components/UploadForm";
import FileList from "./components/FileList";
import { useRef } from "react";

export default function App() {
  const listRef = useRef(null);
  const reload = ()=> listRef.current?.load?.();

  return (
    <div style={{maxWidth:800, margin:"40px auto"}}>
      <h2>MERN + S3 Mini CRUD</h2>
      <UploadForm onDone={reload}/>
      {/* 간단히 리프레시 위해 key 트릭 */}
      <FileList ref={listRef}/>
    </div>
  );
}