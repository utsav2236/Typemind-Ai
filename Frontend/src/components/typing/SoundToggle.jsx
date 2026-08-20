import React, { useState, useEffect } from 'react';
import { Volume2, VolumeX } from 'lucide-react';
import typingSoundService from '../../services/typingSoundService';

const SoundToggle = () => {
  const [isEnabled, setIsEnabled] = useState(typingSoundService.getIsEnabled());

  // Preload sounds when the toggle component mounts (meaning the typing test has loaded)
  useEffect(() => {
    typingSoundService.preload();
  }, []);

  const handleToggle = () => {
    const newState = typingSoundService.toggleEnabled();
    setIsEnabled(newState);
  };

  return (
    <button
      onClick={handleToggle}
      className="flex items-center justify-center p-2 rounded-lg text-text-secondary hover:text-text-main hover:bg-card focus:outline-none transition-colors"
      title={isEnabled ? "Sound feedback enabled" : "Sound feedback disabled"}
      aria-label={isEnabled ? "Disable typing sounds" : "Enable typing sounds"}
    >
      {isEnabled ? (
        <Volume2 className="h-5 w-5" />
      ) : (
        <VolumeX className="h-5 w-5" />
      )}
    </button>
  );
};

export default SoundToggle;
