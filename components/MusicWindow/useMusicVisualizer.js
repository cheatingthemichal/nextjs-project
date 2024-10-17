// components/MusicWindow/useMusicVisualizer.js
import { useRef, useState, useEffect } from 'react';
import Visualizer from './Visualizer';
import { useSharedAudioContext } from '../../context/AudioContextProvider';

const useMusicVisualizer = (canvasRef) => {
  const sharedAudioContext = useSharedAudioContext();
  const audioRef = useRef(null);
  const [visualizer, setVisualizer] = useState(null);
  
  // State for control values
  const [controlValues, setControlValues] = useState({
    norm: 90,
    fftSize: 2048,
    tau: 5,
    color: 1,
    version: 'osc',
    memoryMode: 'off',
  });

  // Update control values
  const updateControlValues = (newValues) => {
    setControlValues(prevValues => ({
      ...prevValues,
      ...newValues,
    }));
  };

  // Handler for volume changes
  const handleVolumeChange = (value) => {
    if (audioRef.current) {
      // Ensure the volume stays within 0 to 1
      const clampedValue = Math.min(Math.max(value, 0), 1);
      audioRef.current.volume = clampedValue;
    }
  };

  const handleAudioSourceChange = (source) => {
    if (audioRef.current && canvasRef.current && sharedAudioContext) {
      if (sharedAudioContext.state === 'suspended') {
        sharedAudioContext.resume();
      }
      audioRef.current.src = source;
      audioRef.current.load();
      audioRef.current.play();

      if (!visualizer) {
        const newVisualizer = new Visualizer(
          sharedAudioContext, // Use shared AudioContext
          audioRef.current, 
          canvasRef.current,
          controlValues.fftSize,
          controlValues.tau,
          controlValues.norm,
          controlValues.color,
          controlValues.version,
          controlValues.memoryMode
        );
        setVisualizer(newVisualizer);
        newVisualizer.start();
      } else {
        visualizer.stop();
        visualizer.setFFTSize(controlValues.fftSize);
        visualizer.setTau(controlValues.tau);
        visualizer.setNorm(controlValues.norm);
        visualizer.setColor(controlValues.color);
        visualizer.setVersion(controlValues.version);
        visualizer.setMemoryMode(controlValues.memoryMode);
        visualizer.start();
      }
    }
  };

  const handleFileChange = (event) => {
    const files = event.target.files;
    if (files.length > 0) {
      const file = files[0];
      const url = URL.createObjectURL(file);
      handleAudioSourceChange(url);
    }
  };

  const handleSongSelect = (url) => {
    handleAudioSourceChange(url);
  };

  const handleMemoryChange = (newMemoryMode) => {
    updateControlValues({ memoryMode: newMemoryMode });
    if (visualizer) {
      visualizer.setMemoryMode(newMemoryMode);
    }
  };

  const handleVersionChange = (newVersion) => {
    updateControlValues({ version: newVersion });
    if (visualizer) {
      visualizer.setVersion(newVersion);
    }
  };

  const handleTauChange = (newTau) => {
    updateControlValues({ tau: newTau });
    if (visualizer) {
      visualizer.setTau(newTau);
    }
  };

  const handleNormChange = (newNorm) => {
    updateControlValues({ norm: newNorm });
    if (visualizer) {
      visualizer.setNorm(newNorm);
    }
  };

  const handleFFTSizeChange = (newSize) => {
    updateControlValues({ fftSize: newSize });
    if (visualizer) {
      visualizer.setFFTSize(newSize);
    }
  };

  const handlePlay = () => {
    if (audioRef.current) {
      audioRef.current.play();
    }
  };

  const handlePause = () => {
    if (audioRef.current) {
      audioRef.current.pause();
    }
  };

  const handleSeek = (value) => {
    if (audioRef.current) {
      const seekTime = (audioRef.current.duration * value) / 100;
      audioRef.current.currentTime = seekTime;
    }
  };

  const handleSpeedChange = (value) => {
    if (audioRef.current) {
      audioRef.current.playbackRate = value;
    }
  };

  const handleColorChange = (value) => {
    updateControlValues({ color: value });
    if (visualizer) {
      visualizer.setColor(value);
    }
  };

  const stopVisualizer = () => {
    if (visualizer) {
      visualizer.stop();
    }
  };

  return {
    handleFileChange,
    handleSongSelect,
    handleMemoryChange,
    handleVersionChange,
    handleTauChange,
    handleNormChange,
    handleFFTSizeChange,
    handlePlay,
    handlePause,
    handleSeek,
    handleSpeedChange,
    handleColorChange,
    handleVolumeChange, // Expose the volume handler
    stopVisualizer,
    audioRef,
  };
};

export default useMusicVisualizer;
