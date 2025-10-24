const API_BASE = "http://127.0.0.1:5001";

export async function encryptImage(file, { r1, x01, r2, x02 }) {
  const fd = new FormData();
  fd.append("file", file);
  fd.append("r1", r1);
  fd.append("x01", x01);
  fd.append("r2", r2);
  fd.append("x02", x02);

  const res = await fetch(`${API_BASE}/encrypt`, { method: "POST", body: fd });
  if (!res.ok) throw new Error("Encrypt failed");
  return res.json(); // { fileId, filename, downloadUrl }
}

export async function decryptImage(file, { r1, x01, r2, x02 }) {
  const fd = new FormData();
  fd.append("file", file);
  fd.append("r1", r1);
  fd.append("x01", x01);
  fd.append("r2", r2);
  fd.append("x02", x02);

  const res = await fetch(`${API_BASE}/decrypt`, { method: "POST", body: fd });
  if (!res.ok) throw new Error("Decrypt failed");
  return res.json();
}
