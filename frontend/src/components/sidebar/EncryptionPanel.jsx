import React, { useRef, useState } from "react";
import { encryptImage, decryptImage } from "../../lib/imageCryptoApi";

export default function EncryptionPanel({ open, onClose }) {
  const [mode, setMode] = useState(null); // "encrypt" | "decrypt" | null
  const [r1, setR1] = useState("3.9");
  const [x01, setX01] = useState("0.5");
  const [r2, setR2] = useState("3.95");
  const [x02, setX02] = useState("0.7");
  const [busy, setBusy] = useState(false);
  const [resultUrl, setResultUrl] = useState(null);
  const fileRef = useRef(null);

  if (!open) return null;

  const submit = async (e) => {
    e.preventDefault();
    const file = fileRef.current?.files?.[0];
    if (!file) return alert("Choose an image file");
    setBusy(true);
    setResultUrl(null);
    try {
      const params = { r1, x01, r2, x02 };
      const res =
        mode === "encrypt"
          ? await encryptImage(file, params)
          : await decryptImage(file, params);
      const url = `http://127.0.0.1:5001${res.downloadUrl}`;
      setResultUrl(url);
    } catch (err) {
      alert(err.message || "Operation failed");
    } finally {
      setBusy(false);
    }
  };

  const resetPanel = () => {
    setMode(null);
    setResultUrl(null);
    fileRef.current && (fileRef.current.value = "");
  };

  return (
    <div className="fixed top-4 left-[68px] z-50">
      {/* card */}
      <div className="w-90 rounded-2xl bg-white/95 shadow-2xl border border-gray-200">
        <div className="flex items-center justify-between px-4 py-3 border-b">
          <span className="font-semibold text-gray-900">
            {mode ? (mode === "encrypt" ? "Encrypt" : "Decrypt") : "Encryption"}
          </span>
          <button
            onClick={() => {
              resetPanel();
              onClose();
            }}
            className="text-gray-500 hover:text-gray-800"
            title="Close"
          >
            ✕
          </button>
        </div>

        {/* chooser */}
        {!mode && (
          <div className="p-4 flex flex-col gap-3">
            <button
              onClick={() => setMode("encrypt")}
              className="w-full px-4 py-2 rounded-xl bg-gradient-to-r from-pink-500 to-rose-500 text-white hover:opacity-90 shadow-md"
            >
              Encrypt
            </button>
            <button
              onClick={() => setMode("decrypt")}
              className="w-full px-4 py-2 rounded-xl bg-gradient-to-r from-blue-500 to-indigo-500 text-white hover:opacity-90 shadow-md"
            >
              Decrypt
            </button>
          </div>
        )}

        {/* form */}
        {mode && (
          <form onSubmit={submit} className="p-4 flex flex-col gap-3">
            <input
              ref={fileRef}
              type="file"
              accept="image/png,image/jpeg,image/jpg,image/bmp"
              className="block w-full text-sm file:mr-3 file:px-3 file:py-1.5 file:rounded-md 
                         file:border-0 file:bg-gray-800 file:text-white hover:file:bg-black/80"
            />
            <div className="grid grid-cols-2 gap-2">
              <input
                className="px-2 py-1 rounded-xl border border-gray-300 shadow-sm focus:ring-2 focus:ring-blue-500"
                value={mode === "encrypt" ? r1 : undefined}
                onChange={(e) => setR1(e.target.value)}
                placeholder="r1"
              />
              <input
                className="px-2 py-1 rounded-xl border border-gray-300 shadow-sm focus:ring-2 focus:ring-blue-500"
                value={mode === "encrypt" ? x01 : undefined}
                onChange={(e) => setX01(e.target.value)}
                placeholder="x01"
              />
              <input
                className="px-2 py-1 rounded-xl border border-gray-300 shadow-sm focus:ring-2 focus:ring-blue-500"
                value={mode === "encrypt" ? r2 : undefined}
                onChange={(e) => setR2(e.target.value)}
                placeholder="r2"
              />
              <input
                className="px-2 py-1 rounded-xl border border-gray-300 shadow-sm focus:ring-2 focus:ring-blue-500"
                value={mode === "encrypt" ? x02 : undefined}
                onChange={(e) => setX02(e.target.value)}
                placeholder="x02"
              />
            </div>

            <div className="flex gap-2 mt-2">
              <button
                type="submit"
                disabled={busy}
                className="flex-1 px-3 py-2 rounded-xl text-white bg-gray-900 hover:bg-black disabled:opacity-60 shadow-md"
              >
                {busy ? "Processing..." : mode === "encrypt" ? "Encrypt" : "Decrypt"}
              </button>
              <button
                type="button"
                onClick={resetPanel}
                className="px-3 py-2 rounded-xl border shadow-sm"
              >
                Back
              </button>
            </div>

            {resultUrl && (
              <div className="flex gap-2 mt-3">
                <a
                  href={resultUrl}
                  className="flex-1 text-center px-3 py-2 rounded-xl bg-emerald-600 text-white hover:bg-emerald-700 shadow-md"
                >
                  Download
                </a>
                <button
                  type="button"
                  onClick={() => alert("TODO: Share to contact")}
                  className="px-3 py-2 rounded-xl bg-blue-600 text-white hover:bg-blue-700 shadow-md"
                >
                  Share
                </button>
              </div>
            )}
          </form>
        )}
      </div>
    </div>
  );
}
