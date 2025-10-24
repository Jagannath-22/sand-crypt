// frontend/src/components/VideoPlayer.jsx

import React, { useRef, useEffect } from 'react';

const VideoPlayer = ({ stream, isMuted }) => {
    const videoRef = useRef(null);

    useEffect(() => {
        if (videoRef.current && stream) {
            videoRef.current.srcObject = stream;
        }
    }, [stream]);

    return (
        <video
            ref={videoRef}
            muted={isMuted}
            autoPlay
            playsInline
        />
    );
};

export default VideoPlayer;