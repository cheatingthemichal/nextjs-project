// context/AudioContextProvider.js
import React, { createContext, useContext, useState } from 'react';

const AudioContextContext = createContext(null);

export const AudioContextProvider = ({ children }) => {
  const [audioContext, setAudioContext] = useState(null);

  const initAudioContext = () => {
    if (!audioContext) {
      const ctx = new (window.AudioContext || window.webkitAudioContext)();
      setAudioContext(ctx);
      console.log('AudioContext initialized');
    }
  };

  return (
    <AudioContextContext.Provider value={{ audioContext, initAudioContext }}>
      {children}
    </AudioContextContext.Provider>
  );
};

export const useSharedAudioContext = () => {
  return useContext(AudioContextContext);
};
