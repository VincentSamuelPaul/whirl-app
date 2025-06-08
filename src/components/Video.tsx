import React from 'react';

const Video: React.FC = () => {
    return (
        <div className="relative w-full h-full">
            <video
                className="w-full h-full object-cover rounded-lg"
                autoPlay
                loop
                muted
                playsInline
            >
                <source src="../assets/whirl edit.mp4" type="video/mp4" />
                Your browser does not support the video tag.
            </video>
        </div>
    );
};

export default Video; 