export async function embedSteg(file, message, type) {
  const form = new FormData();
  form.append("file", file);
  form.append("message", message);
  form.append("type", type); // "image" | "audio" | "video"

  const res = await fetch("http://127.0.0.1:5002/stego/embed", {
    method: "POST",
    body: form,
  });

  if (!res.ok) throw new Error("Failed to embed");
  return await res.json();
}

export async function revealSteg(file) {
  const form = new FormData();
  form.append("file", file);

  const res = await fetch("http://127.0.0.1:5002/stego/reveal", {
    method: "POST",
    body: form,
  });

  if (!res.ok) throw new Error("Failed to reveal");
  return await res.json();
}
