from flask import Flask, request, jsonify, send_file
from flask_cors import CORS
from werkzeug.utils import secure_filename
from PIL import Image
import numpy as np
import os, io, uuid, json

# ====== paths ======
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
STORAGE_DIR = os.path.join(BASE_DIR, "storage")
os.makedirs(STORAGE_DIR, exist_ok=True)

# ====== flask ======
app = Flask(__name__)
CORS(app)  # dev: allow all

# ====== double-chaotic core (your logic) ======
def logistic_map(r, x, size):
    seq = []
    for _ in range(size):
        x = r * x * (1 - x)
        seq.append(x)
    return np.array(seq)

def chaotic_key(length, r1, x01, r2, x02):
    seq1 = logistic_map(r1, x01, length)
    seq2 = logistic_map(r2, x02, length)
    key1 = np.floor(seq1 * 256).astype(np.uint8)
    key2 = np.floor(seq2 * 256).astype(np.uint8)
    return np.bitwise_xor(key1, key2)

def do_encrypt_decrypt(in_img: Image.Image, r1, x01, r2, x02):
    img = in_img.convert("RGB")
    arr = np.array(img)
    shape = arr.shape
    flat = arr.flatten()
    key = chaotic_key(len(flat), r1, x01, r2, x02)
    out = np.bitwise_xor(flat, key).reshape(shape).astype(np.uint8)
    return Image.fromarray(out)

# ====== helpers ======
def save_image_and_meta(pil_img: Image.Image, prefix: str, meta: dict):
    file_id = str(uuid.uuid4())
    fname = f"{prefix}_{file_id}.png"
    fpath = os.path.join(STORAGE_DIR, fname)
    pil_img.save(fpath)
    with open(os.path.join(STORAGE_DIR, f"{prefix}_{file_id}.json"), "w") as f:
        json.dump(meta, f, indent=2)
    return file_id, fpath, fname

@app.get("/")
def health():
    return jsonify({"message": "Image Crypto Service is running!"})

@app.post("/encrypt")
def encrypt():
    if "file" not in request.files:
        return jsonify({"error": "file is required"}), 400
    f = request.files["file"]
    filename = secure_filename(f.filename or "image.png")
    try:
        r1  = float(request.form.get("r1", 3.9))
        x01 = float(request.form.get("x01", 0.5))
        r2  = float(request.form.get("r2", 3.95))
        x02 = float(request.form.get("x02", 0.7))
    except ValueError:
        return jsonify({"error": "invalid chaotic parameters"}), 400

    img = Image.open(f.stream)
    out_img = do_encrypt_decrypt(img, r1, x01, r2, x02)

    meta = {"mode": "encrypt", "src_name": filename, "r1": r1, "x01": x01, "r2": r2, "x02": x02}
    file_id, path, stored_name = save_image_and_meta(out_img, "encrypted", meta)
    return jsonify({
        "fileId": file_id,
        "filename": stored_name,
        "downloadUrl": f"/download/{stored_name}"
    })

@app.post("/decrypt")
def decrypt():
    if "file" not in request.files:
        return jsonify({"error": "file is required"}), 400
    f = request.files["file"]
    filename = secure_filename(f.filename or "image.png")
    try:
        r1  = float(request.form.get("r1", 3.9))
        x01 = float(request.form.get("x01", 0.5))
        r2  = float(request.form.get("r2", 3.95))
        x02 = float(request.form.get("x02", 0.7))
    except ValueError:
        return jsonify({"error": "invalid chaotic parameters"}), 400

    img = Image.open(f.stream)
    out_img = do_encrypt_decrypt(img, r1, x01, r2, x02)

    meta = {"mode": "decrypt", "src_name": filename, "r1": r1, "x01": x01, "r2": r2, "x02": x02}
    file_id, path, stored_name = save_image_and_meta(out_img, "decrypted", meta)
    return jsonify({
        "fileId": file_id,
        "filename": stored_name,
        "downloadUrl": f"/download/{stored_name}"
    })

@app.get("/download/<name>")
def download(name):
    path = os.path.join(STORAGE_DIR, secure_filename(name))
    if not os.path.isfile(path):
        return jsonify({"error": "file not found"}), 404
    return send_file(path, as_attachment=True)

if __name__ == "__main__":
    app.run(host="127.0.0.1", port=8080, debug=True)





@app.post("/stego/hide")
def stego_hide():
    if "file" not in request.files or "message" not in request.form:
        return jsonify({"error": "file and message are required"}), 400

    f = request.files["file"]
    message = request.form["message"]
    filename = secure_filename(f.filename)

    # save original file temporarily
    input_path = os.path.join(STORAGE_DIR, "in_" + filename)
    f.save(input_path)

    # Decide type: image, audio, video
    if filename.lower().endswith((".png", ".jpg", ".jpeg", ".bmp")):
        # call your image LSB hide function here
        from stegano import lsb
        stego_img = lsb.hide(input_path, message)
        output_path = os.path.join(STORAGE_DIR, "stego_" + filename + ".png")
        stego_img.save(output_path)

    elif filename.lower().endswith((".wav", ".mp3")):
        from audio_stego import hide_message_in_audio
        output_path = os.path.join(STORAGE_DIR, "stego_" + filename)
        hide_message_in_audio(input_path, message, output_path)

    elif filename.lower().endswith((".mp4", ".avi", ".mkv")):
        # placeholder – later you’ll add video stego
        return jsonify({"error": "video stego not implemented yet"}), 501
    else:
        return jsonify({"error": "unsupported file type"}), 400

    return send_file(output_path, as_attachment=True)


@app.post("/stego/reveal")
def stego_reveal():
    if "file" not in request.files:
        return jsonify({"error": "file is required"}), 400

    f = request.files["file"]
    filename = secure_filename(f.filename)
    input_path = os.path.join(STORAGE_DIR, "in_" + filename)
    f.save(input_path)

    if filename.lower().endswith((".png", ".jpg", ".jpeg", ".bmp")):
        from stegano import lsb
        hidden = lsb.reveal(input_path)

    elif filename.lower().endswith((".wav", ".mp3")):
        from audio_stego import reveal_message_from_audio
        hidden = reveal_message_from_audio(input_path)

    elif filename.lower().endswith((".mp4", ".avi", ".mkv")):
        return jsonify({"error": "video stego not implemented yet"}), 501
    else:
        return jsonify({"error": "unsupported file type"}), 400

    return jsonify({"message": hidden or ""})
