import React, { useState } from "react";

const SteganographyPanel = ({ open, onClose }) => {
  const [mode, setMode] = useState("hide"); // "hide" or "reveal"
  const [file, setFile] = useState(null);
  const [message, setMessage] = useState("");
  const [result, setResult] = useState(null);
  const [busy, setBusy] = useState(false);

  if (!open) return null;

  const handleSubmit = async () => {
    if (!file) return alert("Please choose a file");

    setBusy(true);
    setResult(null);

    try {
      const formData = new FormData();
      formData.append("file", file);
      if (mode === "hide") formData.append("message", message);

      const endpoint = mode === "hide" ? "embed" : "reveal";
const res = await fetch(`http://127.0.0.1:5002/steg/${endpoint}`, {
  method: "POST",
  body: formData,
});


      if (!res.ok) throw new Error("Server error");

      if (mode === "hide") {
        // backend returns a file (stego image/audio/video)
        const blob = await res.blob();
        const url = URL.createObjectURL(blob);
        setResult(url);
      } else {
        // backend returns a JSON with extracted message
        const data = await res.json();
        setResult(data.message || "(no message found)");
      }
    } catch (err) {
      alert(err.message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="fixed top-4 left-[68px] z-50">
      <div className="w-96 rounded-2xl bg-[#111827] shadow-2xl border border-gray-700 p-4">
        {/* header */}
        <div className="flex items-center justify-between mb-4">
          <span className="font-semibold text-lg text-white">
            {mode === "hide" ? "Hide Message" : "Reveal Message"}
          </span>
          <button
            onClick={onClose}
            className="text-red-400 hover:text-red-500"
          >
            ✖
          </button>
        </div>

        {/* mode switch */}
        <div className="flex gap-2 mb-4">
          <button
            className={`px-3 py-1 rounded ${
              mode === "hide" ? "bg-pink-600" : "bg-gray-700"
            }`}
            onClick={() => setMode("hide")}
          >
            Hide
          </button>
          <button
            className={`px-3 py-1 rounded ${
              mode === "reveal" ? "bg-pink-600" : "bg-gray-700"
            }`}
            onClick={() => setMode("reveal")}
          >
            Reveal
          </button>
        </div>

        {/* file input */}
        <input
          type="file"
          accept="image/*,audio/*,video/*"
          className="mb-3 text-sm text-gray-300"
          onChange={(e) => setFile(e.target.files[0])}
        />

        {/* secret message (for hide only) */}
        {mode === "hide" && (
          <textarea
            placeholder="Enter secret message"
            className="w-full p-2 mb-3 bg-gray-800 rounded text-white"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
          />
        )}

        {/* action button */}
        <button
          onClick={handleSubmit}
          disabled={busy}
          className="w-full bg-pink-500 hover:bg-pink-600 px-4 py-2 rounded disabled:opacity-60"
        >
          {busy
            ? "Processing..."
            : mode === "hide"
            ? "Embed"
            : "Extract"}
        </button>

        {/* result display */}
        {result && (
          <div className="mt-4">
            {mode === "hide" ? (
              <a
                href={result}
                download="stego_file"
                className="text-emerald-400 underline"
              >
                ⬇ Download Stego File
              </a>
            ) : (
              <p className="text-yellow-300">💬 Hidden Message: {result}</p>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default SteganographyPanel;
