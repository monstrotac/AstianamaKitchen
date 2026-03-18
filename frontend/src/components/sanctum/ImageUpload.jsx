import { useState, useRef } from 'react';
import { uploadImage } from '../../api/sanctum';

const API_BASE = (import.meta.env.VITE_API_URL || '/api').replace('/api', '');

export default function ImageUpload({ charId, currentUrl, onUploaded }) {
  const [preview, setPreview] = useState(currentUrl ? `${API_BASE}${currentUrl}` : null);
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState('');
  const inputRef = useRef();

  function handleChange(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    setPreview(URL.createObjectURL(file));
    handleUpload(file);
  }

  async function handleUpload(file) {
    setLoading(true);
    setError('');
    try {
      const data = await uploadImage(charId, file);
      onUploaded?.(data.image_url);
    } catch (err) {
      setError(err.response?.data?.error || 'Upload failed');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div>
      {preview && <img src={preview} alt="Portrait" className="s-img-preview" />}
      <div
        className="s-img-upload-area"
        onClick={() => inputRef.current?.click()}
      >
        {loading ? 'Uploading…' : preview ? 'Replace portrait' : 'Upload portrait'}
      </div>
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        style={{ display: 'none' }}
        onChange={handleChange}
      />
      {error && <div style={{ color: '#e74c3c', fontSize: '0.75rem', marginTop: '0.3rem' }}>{error}</div>}
    </div>
  );
}
