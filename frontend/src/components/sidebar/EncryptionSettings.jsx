import React from 'react';

const EncryptionSettings = ({ close }) => {
  return (
    <div className="absolute top-0 left-0 w-full h-full bg-black/80 z-50 flex flex-col items-center justify-center text-white p-6">
      <h2 className="text-2xl font-semibold mb-6">Encryption Mode</h2>

      <div className="space-y-4 text-lg">
        <label>
          <input type="radio" name="encryption" value="chaotic" className="mr-2" />
          Chaotic (Logistic Map)
        </label>
        <label>
          <input type="radio" name="encryption" value="aes" className="mr-2" />
          AES Encryption
        </label>
        <label>
          <input type="radio" name="encryption" value="hybrid" className="mr-2" />
          Hybrid (Chaotic + AES)
        </label>
      </div>

      <button
        onClick={close}
        className="mt-6 px-4 py-2 bg-pink-600 rounded hover:bg-pink-500 transition"
      >
        Close
      </button>
    </div>
  );
};

export default EncryptionSettings;
