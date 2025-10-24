from flask import Flask, request, jsonify, send_file
from flask_cors import CORS
from werkzeug.utils import secure_filename
from stegano import lsb
import os, uuid, wave, cv2, numpy as np

app = Flask(__name__)
CORS(app)

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
STORAGE_DIR = os.path.join(BASE_DIR, "steg_storage")
os.makedirs(STORAGE_DIR, exist_ok=True)

# End marker for audio/video
END_MARKER_BITS = "1111111111111110"

# ---------------------- Helpers ----------------------
def make_out_path(ext):
    return os.path.join(STORAGE_DIR, f"stego_{uuid.uuid4()}.{ext}")

# ---------------------- Routes ----------------------

@app.route("/", methods=["GET"])
def home():
    return {"message": "Steganography Service is running on port 5002"}

@app.post("/steg/embed")
def steg_embed():
    if "file" not in request.files or "message" not in request.form:
        return jsonify({"error": "file and message required"}), 400

    f = request.files["file"]
    message = request.form["message"]
    filename = secure_filename(f.filename)
    ext = filename.split(".")[-1].lower()

    # IMAGE
    if ext in ["png", "jpg", "jpeg", "bmp"]:
        secret = lsb.hide(f.stream, message)
        out_path = make_out_path("png")
        secret.save(out_path)
        return send_file(out_path, as_attachment=True)

    # AUDIO (wav only)
    elif ext == "wav":
        audio = wave.open(f.stream, "rb")
        frames = bytearray(list(audio.readframes(audio.getnframes())))
        bits = "".join(format(b, "08b") for b in message.encode("utf-8")) + END_MARKER_BITS
        for i, bit in enumerate(bits):
            frames[i] = (frames[i] & 0xFE) | int(bit)
        out_path = make_out_path("wav")
        with wave.open(out_path, "wb") as out:
            out.setparams(audio.getparams())
            out.writeframes(bytes(frames))
        audio.close()
        return send_file(out_path, as_attachment=True)

    # VIDEO (basic LSB in blue channel)
    elif ext in ["mp4", "avi", "mkv"]:
        cap = cv2.VideoCapture(f.stream)
        if not cap.isOpened():
            return jsonify({"error": "Video open failed"}), 400
        w, h = int(cap.get(3)), int(cap.get(4))
        fps = cap.get(cv2.CAP_PROP_FPS) or 30.0
        fourcc = cv2.VideoWriter_fourcc(*'mp4v')
        out_path = make_out_path("mp4")
        out = cv2.VideoWriter(out_path, fourcc, fps, (w, h))

        bits = "".join(format(b, "08b") for b in message.encode()) + END_MARKER_BITS
        bit_idx = 0
        while True:
            ret, frame = cap.read()
            if not ret: break
            if bit_idx < len(bits):
                b = frame[:, :, 0].flatten()
                cap_len = min(len(b), len(bits) - bit_idx)
                seg = np.frombuffer(bytearray(b), dtype=np.uint8)
                seg[:cap_len] = (seg[:cap_len] & 0xFE) | np.fromiter(
                    (int(ch) for ch in bits[bit_idx:bit_idx+cap_len]), dtype=np.uint8, count=cap_len
                )
                seg = seg.reshape(frame[:, :, 0].shape)
                frame[:, :, 0] = seg
                bit_idx += cap_len
            out.write(frame)

        cap.release(); out.release()
        return send_file(out_path, as_attachment=True)

    return jsonify({"error": f"Unsupported file type: {ext}"}), 400


@app.post("/steg/reveal")
def steg_reveal():
    if "file" not in request.files:
        return jsonify({"error": "file required"}), 400

    f = request.files["file"]
    filename = secure_filename(f.filename)
    ext = filename.split(".")[-1].lower()

    if ext in ["png", "jpg", "jpeg", "bmp"]:
        hidden = lsb.reveal(f.stream)
        return jsonify({"message": hidden or ""})

    elif ext == "wav":
        audio = wave.open(f.stream, "rb")
        frames = bytearray(list(audio.readframes(audio.getnframes())))
        bits, end_pat = [], END_MARKER_BITS
        for i in range(len(frames)):
            bits.append("1" if (frames[i] & 1) else "0")
            if len(bits) >= len(end_pat) and "".join(bits[-len(end_pat):]) == end_pat:
                bits = bits[:-len(end_pat)]
                break
        if len(bits) % 8 != 0:
            bits = bits[:len(bits) - (len(bits) % 8)]
        data = bytes(int("".join(bits[i:i+8]), 2) for i in range(0, len(bits), 8))
        audio.close()
        return jsonify({"message": data.decode("utf-8", errors="ignore")})

    elif ext in ["mp4", "avi", "mkv"]:
        cap = cv2.VideoCapture(f.stream)
        if not cap.isOpened():
            return jsonify({"error": "Video open failed"}), 400
        bits, end_pat, found = [], END_MARKER_BITS, False
        while True:
            ret, frame = cap.read()
            if not ret: break
            b = frame[:, :, 0].flatten()
            for px in b:
                bits.append("1" if (int(px) & 1) else "0")
                if len(bits) >= len(end_pat) and "".join(bits[-len(end_pat):]) == end_pat:
                    bits = bits[:-len(end_pat)]
                    found = True
                    break
            if found: break
        cap.release()
        if len(bits) % 8 != 0:
            bits = bits[:len(bits) - (len(bits) % 8)]
        data = bytes(int("".join(bits[i:i+8]), 2) for i in range(0, len(bits), 8))
        return jsonify({"message": data.decode("utf-8", errors="ignore")})

    return jsonify({"error": f"Unsupported file type: {ext}"}), 400


if __name__ == "__main__":
    app.run(host="127.0.0.1", port=5002, debug=True)
