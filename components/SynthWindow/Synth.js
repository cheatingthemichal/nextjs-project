// components/Synth.js
import React, { useState, useEffect, useRef, useMemo } from 'react';
import { List, Modal, Button } from '@react95/core';
import { Mmsys120 } from '@react95/icons';
import styled from 'styled-components';
import Controls from './Controls';
import VirtualKeyboard from './VirtualKeyboard';
import { Instructions, Container } from './styles';
import { px } from '@xstyled/styled-components';
import { useSharedAudioContext } from '../../context/AudioContextProvider';
import { FaArrowDown, FaArrowUp } from 'react-icons/fa'; // Import icons

const ButtonContainer = styled.div`
  display: flex;
  gap: 10px;
  margin-top: 10px;
  align-self: center;
  justify-content: center; /* Center the buttons */
`;

const ToggleButton = styled(Button)`
  align-self: center;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 5px 10px;
`;

// Define the list of keys outside the component to prevent re-creation
const KEYS = [
  { note: 'C4', frequency: 261.63, type: 'white', keyCode: '90' }, // Z
  { note: 'C#4', frequency: 277.18, type: 'black', keyCode: '83' }, // S
  { note: 'D4', frequency: 293.66, type: 'white', keyCode: '88' }, // X
  { note: 'D#4', frequency: 311.13, type: 'black', keyCode: '68' }, // D
  { note: 'E4', frequency: 329.63, type: 'white', keyCode: '67' }, // C
  { note: 'F4', frequency: 349.23, type: 'white', keyCode: '86' }, // V
  { note: 'F#4', frequency: 369.99, type: 'black', keyCode: '71' }, // G
  { note: 'G4', frequency: 391.99, type: 'white', keyCode: '66' }, // B
  { note: 'G#4', frequency: 415.3, type: 'black', keyCode: '72' }, // H
  { note: 'A4', frequency: 440, type: 'white', keyCode: '78' }, // N
  { note: 'A#4', frequency: 466.16, type: 'black', keyCode: '74' }, // J
  { note: 'B4', frequency: 493.88, type: 'white', keyCode: '77' }, // M
  { note: 'C5', frequency: 523.25, type: 'white', keyCode: '81' }, // Q
  { note: 'C#5', frequency: 554.37, type: 'black', keyCode: '50' }, // 2
  { note: 'D5', frequency: 587.33, type: 'white', keyCode: '87' }, // W
  { note: 'D#5', frequency: 622.25, type: 'black', keyCode: '51' }, // 3
  { note: 'E5', frequency: 659.26, type: 'white', keyCode: '69' }, // E
  { note: 'F5', frequency: 698.46, type: 'white', keyCode: '82' }, // R
  { note: 'F#5', frequency: 739.99, type: 'black', keyCode: '53' }, // 5
  { note: 'G5', frequency: 783.99, type: 'white', keyCode: '84' }, // T
  { note: 'G#5', frequency: 830.61, type: 'black', keyCode: '54' }, // 6
  { note: 'A5', frequency: 880, type: 'white', keyCode: '89' }, // Y
  { note: 'A#5', frequency: 932.33, type: 'black', keyCode: '55' }, // 7
  { note: 'B5', frequency: 987.77, type: 'white', keyCode: '85' }, // U
  { note: 'C6', frequency: 1046.5, type: 'white', keyCode: '73' }, // I
];

const Synth = ({ onClose, position }) => {
  // State variables
  const [waveform, setWaveform] = useState('sine');
  const [pulseWidth, setPulseWidth] = useState(0.5);
  const [additiveMode, setAdditiveMode] = useState('off');
  const [numPartials, setNumPartials] = useState(50);
  const [distPartials, setDistPartials] = useState(50);
  const [amMode, setAmMode] = useState('off');
  const [amFrequency, setAmFrequency] = useState(250);
  const [fmMode, setFmMode] = useState('off');
  const [fmFrequency, setFmFrequency] = useState(250);
  const [lfoMode, setLfoMode] = useState('off');
  const [lfoFrequency, setLfoFrequency] = useState(5);
  const [crazy, setCrazy] = useState(false); // New state for crazy mode
  const [showKeyboard, setShowKeyboard] = useState(false); // State to toggle keyboard visibility
  const [isTwoRows, setIsTwoRows] = useState(false);
  const [distortedFmIntensity, setDistortedFmIntensity] = useState(0); // New state for distorted FM intensity
  const [volume, setVolume] = useState(1); // New state for volume (range: 0 to 1)

  // New state for octave shifting
  const [octaveShift, setOctaveShift] = useState(0);

  // Refs for active oscillators/gains
  const activeOscillatorsRef = useRef({});
  const activeGainsRef = useRef({});
  const compressorRef = useRef(null); // We will use shared AudioContext
  const masterGainRef = useRef(null); // Ref for master gain node

  // Get shared AudioContext
  const audioContext = useSharedAudioContext();

  // Ref to store current parameters
  const parametersRef = useRef({
    waveform,
    pulseWidth,
    additiveMode,
    numPartials,
    distPartials,
    amMode,
    amFrequency,
    fmMode,
    fmFrequency,
    lfoMode,
    lfoFrequency,
    crazy,
    distortedFmIntensity,
    octaveShift, // Include octaveShift
    volume, // Include volume
  });

  // Update parametersRef whenever state changes
  useEffect(() => {
    parametersRef.current = {
      waveform,
      pulseWidth,
      additiveMode,
      numPartials,
      distPartials,
      amMode,
      amFrequency,
      fmMode,
      fmFrequency,
      lfoMode,
      lfoFrequency,
      crazy,
      distortedFmIntensity,
      octaveShift, // Update octaveShift
      volume, // Update volume
    };

    // Destructure current parameters for ease of use
    const {
      waveform: currentWaveform,
      amFrequency: currentAmFreq,
      fmFrequency: currentFmFreq,
      lfoFrequency: currentLfoFreq,
      distortedFmIntensity: currentDistortedFmIntensity,
      pulseWidth: currentPulseWidth,
      volume: currentVolume,
    } = parametersRef.current;

    // Update master gain volume
    if (masterGainRef.current) {
      masterGainRef.current.gain.setValueAtTime(currentVolume, audioContext.currentTime);
    }

    // Iterate over all active oscillators and update their properties
    Object.values(activeOscillatorsRef.current).forEach((oscList) => {
      // Update main oscillators' waveform
      oscList.mainOscillators.forEach((osc) => {
        if (currentWaveform !== 'pulse') {
          osc.type = currentWaveform;
        } else {
          updatePulseWave(osc, currentPulseWidth);
        }
      });

      // Update AM frequency if AM is on
      if (oscList.amMod) {
        oscList.amMod.frequency.setValueAtTime(currentAmFreq, audioContext.currentTime);
        // console.log(`Updated AM frequency to ${currentAmFreq}`);
      }

      // Update FM frequency if FM is on
      if (oscList.fmMod) {
        oscList.fmMod.frequency.setValueAtTime(currentFmFreq, audioContext.currentTime);
        // console.log(`Updated FM frequency to ${currentFmFreq}`);
      }

      // Update LFO frequency if LFO is on
      if (oscList.lfo) {
        oscList.lfo.frequency.setValueAtTime(currentLfoFreq, audioContext.currentTime);
        // console.log(`Updated LFO frequency to ${currentLfoFreq}`);
      }

      // Update distorted FM intensity if applicable
      if (oscList.distortedFmMod && oscList.distortedFmGain) {
        oscList.distortedFmGain.gain.setValueAtTime(100 * currentDistortedFmIntensity, audioContext.currentTime);
        // console.log(`Updated distorted FM intensity to ${currentDistortedFmIntensity}`);
      }
    });
  }, [
    waveform,
    pulseWidth,
    additiveMode,
    numPartials,
    distPartials,
    amMode,
    amFrequency,
    fmMode,
    fmFrequency,
    lfoMode,
    lfoFrequency,
    crazy,
    distortedFmIntensity,
    octaveShift, // Include octaveShift in dependencies
    volume, // Include volume in dependencies
    audioContext,
  ]);

  // Define shifted keys based on octaveShift
  const shiftedKeys = useMemo(() => {
    const factor = Math.pow(2, octaveShift);
    return KEYS.map((key) => ({
      ...key,
      frequency: key.frequency * factor,
    }));
  }, [octaveShift]);

  // Update keyboardFrequencyMap to use shiftedKeys
  const keyboardFrequencyMap = useMemo(() => {
    return shiftedKeys.reduce((acc, key) => {
      acc[key.keyCode] = key.frequency;
      return acc;
    }, {});
  }, [shiftedKeys]);

  // Function to create a pulse wave oscillator
  const createPulseOscillator = (audioCtx, frequency, pulseWidth) => {
    const osc = audioCtx.createOscillator();
    const pulseShaper = audioCtx.createWaveShaper();

    const createPulseCurve = (pulseWidth) => {
      const curves = new Float32Array(256);
      for (let i = 0; i < 128; i++) {
        curves[i] = i < 128 * pulseWidth ? -1 : 1;
      }
      for (let i = 128; i < 256; i++) {
        curves[i] = i < 128 + 128 * pulseWidth ? 1 : -1;
      }
      return curves;
    };

    pulseShaper.curve = createPulseCurve(pulseWidth);
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(frequency, audioCtx.currentTime);
    osc.connect(pulseShaper);

    return { osc, pulseShaper };
  };

  // Function to update an existing pulse wave oscillator
  const updatePulseWave = (osc, pulseWidth) => {
    if (osc.pulseShaper) {
      const curves = new Float32Array(256);
      for (let i = 0; i < 128; i++) {
        curves[i] = i < 128 * pulseWidth ? -1 : 1;
      }
      for (let i = 128; i < 256; i++) {
        curves[i] = i < 128 + 128 * pulseWidth ? 1 : -1;
      }
      osc.pulseShaper.curve = curves;
    }
  };

  // Initialize Compressor and Master Gain once
  useEffect(() => {
    if (audioContext && !compressorRef.current) {
      // Create Master Gain Node
      const masterGain = audioContext.createGain();
      masterGain.gain.setValueAtTime(volume, audioContext.currentTime); // Initialize volume
      masterGain.connect(audioContext.destination);
      masterGainRef.current = masterGain;

      // Create Compressor and connect to Master Gain
      const compressor = audioContext.createDynamicsCompressor();
      compressor.threshold.setValueAtTime(-50, audioContext.currentTime);
      // You can adjust compressor settings here if needed
      compressor.connect(masterGain);
      compressorRef.current = compressor;
      console.log('Compressor and Master Gain initialized and connected to AudioContext');
    }

    // Event listeners for keyboard
    const handleKeyDown = (event) => {
      const keyCode = event.keyCode.toString();
      const currentParams = parametersRef.current;

      if (keyboardFrequencyMap[keyCode] && !activeOscillatorsRef.current[keyCode]) {
        if (currentParams.crazy) {
          playCrazy();
        } else {
          playNote(
            keyCode,
            keyboardFrequencyMap[keyCode],
            currentParams.additiveMode === 'on' ? parseInt(currentParams.numPartials) : 1,
            currentParams.additiveMode === 'on' ? parseInt(currentParams.distPartials) : 0,
            currentParams.amMode === 'on' ? parseFloat(currentParams.amFrequency) : 0,
            currentParams.fmMode === 'on' ? parseFloat(currentParams.fmFrequency) : 0,
            currentParams.lfoMode === 'on' ? parseFloat(currentParams.lfoFrequency) : 0
          );
        }
      }
    };

    const handleKeyUp = (event) => {
      const keyCode = event.keyCode.toString();
      if (keyboardFrequencyMap[keyCode] && activeOscillatorsRef.current[keyCode]) {
        stopNote(keyCode);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [keyboardFrequencyMap, audioContext]);

  // Function to play a note
  const playNote = async (
    key,
    frequency,
    numPartials,
    distPartials,
    amFreq,
    fmFreq,
    lfoFreq
  ) => {
    if (!audioContext) return;

    // Ensure AudioContext is running
    if (audioContext.state === 'suspended') {
      audioContext.resume();
    }

    const currentParams = parametersRef.current;

    // Initialize structure for the key if not present
    if (!activeOscillatorsRef.current[key]) {
      activeOscillatorsRef.current[key] = {
        mainOscillators: [],
        amMod: null,
        fmMod: null,
        distortedFmMod: null,
        lfo: null,
      };
    }

    if (!activeGainsRef.current[key]) {
      activeGainsRef.current[key] = {
        gainNodes: [],
        amGain: null,
        fmGain: null,
        distortedFmGain: null,
        lfoGain: null,
      };
    }

    // Create oscillators for each partial
    const oscillators = [];
    for (let i = 0; i < numPartials; i++) {
      let osc;
      if (currentParams.waveform === 'pulse') {
        const { osc: pulseOsc, pulseShaper } = createPulseOscillator(
          audioContext,
          frequency + i * distPartials,
          currentParams.pulseWidth
        );
        osc = pulseOsc;
        osc.pulseShaper = pulseShaper;
      } else {
        osc = audioContext.createOscillator();
        osc.type = currentParams.waveform;
        osc.frequency.setValueAtTime(frequency + i * distPartials, audioContext.currentTime);
      }

      oscillators.push(osc);
      activeOscillatorsRef.current[key].mainOscillators.push(osc);
    }

    // Create Gain Node for the main signal
    const gainNode = audioContext.createGain();
    gainNode.gain.setValueAtTime(0, audioContext.currentTime);
    gainNode.gain.linearRampToValueAtTime(1, audioContext.currentTime + 0.1); // Fade in
    oscillators.forEach((osc) => {
      if (currentParams.waveform === 'pulse') {
        osc.pulseShaper.connect(gainNode);
      } else {
        osc.connect(gainNode);
      }
      osc.start();
    });

    // Connect Gain Node to Compressor (which is already connected to Master Gain)
    if (compressorRef.current) {
      gainNode.connect(compressorRef.current);
    } else if (masterGainRef.current) {
      gainNode.connect(masterGainRef.current);
    }

    // Store Gain Node
    activeGainsRef.current[key].gainNodes.push(gainNode);

    // AM Modulation
    if (amFreq > 0 && currentParams.amMode === 'on') {
      const amMod = audioContext.createOscillator();
      amMod.frequency.value = amFreq;

      const amGain = audioContext.createGain();
      amGain.gain.value = 0.5; // Modulation depth for AM

      amMod.connect(amGain);
      amGain.connect(gainNode.gain); // Modulate the gainNode's gain

      amMod.start();

      activeOscillatorsRef.current[key].amMod = amMod;
      activeGainsRef.current[key].amGain = amGain;
    }

    // FM Modulation (Correct Implementation)
    if (fmFreq > 0 && currentParams.fmMode === 'on') {
      const fmMod = audioContext.createOscillator();
      fmMod.frequency.value = fmFreq;

      const fmGain = audioContext.createGain();
      fmGain.gain.value = 100; // Modulation index for FM

      fmMod.connect(fmGain);
      // Modulate the frequency of each oscillator
      oscillators.forEach((osc) => {
        fmGain.connect(osc.frequency);
      });

      fmMod.start();

      activeOscillatorsRef.current[key].fmMod = fmMod;
      activeGainsRef.current[key].fmGain = fmGain;
    }

    // Distorted FM Modulation (Old Implementation)
    if (
      fmFreq > 0 &&
      currentParams.distortedFmIntensity > 0 &&
      currentParams.fmMode === 'on'
    ) {
      const distortedFmMod = audioContext.createOscillator();
      distortedFmMod.frequency.value = fmFreq;

      const distortedFmGain = audioContext.createGain();
      distortedFmGain.gain.value = 100 * currentParams.distortedFmIntensity; // Scaled by intensity

      distortedFmMod.connect(distortedFmGain).connect(audioContext.destination);
      distortedFmMod.start();

      activeOscillatorsRef.current[key].distortedFmMod = distortedFmMod;
      activeGainsRef.current[key].distortedFmGain = distortedFmGain;
    }

    // LFO Modulation
    if (lfoFreq > 0 && currentParams.lfoMode === 'on') {
      const lfo = audioContext.createOscillator();
      lfo.frequency.value = lfoFreq;

      const lfoGain = audioContext.createGain();
      lfoGain.gain.value = 0.5; // Modulation depth for LFO

      lfo.connect(lfoGain);
      lfoGain.connect(gainNode.gain); // Modulate the gainNode's gain

      lfo.start();

      activeOscillatorsRef.current[key].lfo = lfo;
      activeGainsRef.current[key].lfoGain = lfoGain;
    }
  };

  // Function to stop a note
  const stopNote = (key) => {
    if (!audioContext) return;

    const gainNodes = activeGainsRef.current[key]?.gainNodes || [];
    const { amMod, fmMod, distortedFmMod, lfo } = activeOscillatorsRef.current[key] || {};
    const { amGain, fmGain, distortedFmGain, lfoGain } = activeGainsRef.current[key] || {};

    // Fade out gain nodes
    gainNodes.forEach((gainNode) => {
      gainNode.gain.cancelScheduledValues(audioContext.currentTime);
      gainNode.gain.setValueAtTime(gainNode.gain.value, audioContext.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.0001, audioContext.currentTime + 0.3); // Fade out
    });

    // Fade out and stop AM modulation oscillator
    if (amMod && amGain) {
      amGain.gain.cancelScheduledValues(audioContext.currentTime);
      amGain.gain.setValueAtTime(amGain.gain.value, audioContext.currentTime);
      amGain.gain.exponentialRampToValueAtTime(0.0001, audioContext.currentTime + 0.3);
      amMod.stop(audioContext.currentTime + 0.3);
    }

    // Fade out and stop FM modulation oscillator
    if (fmMod && fmGain) {
      fmGain.gain.cancelScheduledValues(audioContext.currentTime);
      fmGain.gain.setValueAtTime(fmGain.gain.value, audioContext.currentTime);
      fmGain.gain.exponentialRampToValueAtTime(0.0001, audioContext.currentTime + 0.3);
      fmMod.stop(audioContext.currentTime + 0.3);
    }

    // Fade out and stop Distorted FM modulation oscillator
    if (distortedFmMod && distortedFmGain) {
      distortedFmGain.gain.cancelScheduledValues(audioContext.currentTime);
      distortedFmGain.gain.setValueAtTime(distortedFmGain.gain.value, audioContext.currentTime);
      distortedFmGain.gain.exponentialRampToValueAtTime(0.0001, audioContext.currentTime + 0.3);
      distortedFmMod.stop(audioContext.currentTime + 0.3);
    }

    // Fade out and stop LFO oscillator
    if (lfo && lfoGain) {
      lfoGain.gain.cancelScheduledValues(audioContext.currentTime);
      lfoGain.gain.setValueAtTime(lfoGain.gain.value, audioContext.currentTime);
      lfoGain.gain.exponentialRampToValueAtTime(0.0001, audioContext.currentTime + 0.3);
      lfo.stop(audioContext.currentTime + 0.3);
    }

    // Stop main oscillators
    const mainOscillators = activeOscillatorsRef.current[key]?.mainOscillators || [];
    mainOscillators.forEach((osc) => {
      try {
        osc.stop(audioContext.currentTime + 0.3);
      } catch (e) {
        // Oscillator might have already been stopped
      }
    });

    // Clean up
    delete activeGainsRef.current[key];
    delete activeOscillatorsRef.current[key];
  };

  // Function to shuffle an array
  const shuffleArray = (array) => {
    let currentIndex = array.length,
      randomIndex;

    // While there remain elements to shuffle.
    while (currentIndex !== 0) {
      // Pick a remaining element.
      randomIndex = Math.floor(Math.random() * currentIndex);
      currentIndex--;

      // And swap it with the current element.
      [array[currentIndex], array[randomIndex]] = [
        array[randomIndex],
        array[currentIndex],
      ];
    }

    return array;
  };

  // Function to play a crazy note
  const playCrazy = () => {
    if (!audioContext) return;

    const currentParams = parametersRef.current;
    const whiteKeysList = KEYS.filter((key) => key.type === 'white'); // Prefer white keys for crazy mode
    const shuffledKeys = shuffleArray([...whiteKeysList]);
    const selectedKey = shuffledKeys[0]; // Pick the first key after shuffle

    if (selectedKey) {
      const virtualKey = `virtual-${selectedKey.note}`;
      if (!activeOscillatorsRef.current[virtualKey]) {
        // Play the selected key with current settings
        playNote(
          virtualKey,
          selectedKey.frequency,
          currentParams.additiveMode === 'on' ? currentParams.numPartials : 1,
          currentParams.additiveMode === 'on' ? currentParams.distPartials : 0,
          currentParams.amMode === 'on' ? currentParams.amFrequency : 0,
          currentParams.fmMode === 'on' ? currentParams.fmFrequency : 0,
          currentParams.lfoMode === 'on' ? currentParams.lfoFrequency : 0
        );

        // Schedule stopping the note after a short duration
        setTimeout(() => {
          stopNote(virtualKey);
        }, 300); // 300ms duration
      }
    }
  };

  const handleVirtualKeyDown = (key) => {
    const currentParams = parametersRef.current;
    if (currentParams.crazy) {
      playCrazy();
    } else {
      const virtualKey = `virtual-${key.note}`;
      if (!activeOscillatorsRef.current[virtualKey]) {
        playNote(
          virtualKey,
          key.frequency,
          currentParams.additiveMode === 'on' ? currentParams.numPartials : 1,
          currentParams.additiveMode === 'on' ? currentParams.distPartials : 0,
          currentParams.amMode === 'on' ? currentParams.amFrequency : 0,
          currentParams.fmMode === 'on' ? currentParams.fmFrequency : 0,
          currentParams.lfoMode === 'on' ? currentParams.lfoFrequency : 0
        );
      }
    }
  };

  // Function to handle virtual key release
  const handleVirtualKeyUp = (key) => {
    const virtualKey = `virtual-${key.note}`;
    if (activeOscillatorsRef.current[virtualKey]) {
      stopNote(virtualKey);
    }
  };

  // Function to handle Octave Down
  const handleOctaveDown = () => {
    setOctaveShift((prev) => Math.max(prev - 1, -1));
  };

  // Function to handle Octave Up
  const handleOctaveUp = () => {
    setOctaveShift((prev) => Math.min(prev + 1, 1));
  };

  return (
    <Modal
      closeModal={onClose}
      style={{
        width: '700px',
        height: 'auto',
        left: position.x,
        top: position.y,
        maxWidth: '95%',
        maxHeight: '95%',
        overflow: 'auto',
        zIndex: 1000,
      }}
      icon={<Mmsys120 variant="32x32_4" />}
      title="MySynthesizer.exe"
      menu={[
        {
          name: 'Options',
          list: (
            <List width="200px">
              <List.Item onClick={onClose}>Close</List.Item>
            </List>
          ),
        },
      ]}
    >
      <Container>
        {/* Controls */}
        <Controls
          waveform={waveform}
          setWaveform={setWaveform}
          pulseWidth={pulseWidth}
          setPulseWidth={setPulseWidth}
          additiveMode={additiveMode}
          setAdditiveMode={setAdditiveMode}
          numPartials={numPartials}
          setNumPartials={setNumPartials}
          distPartials={distPartials}
          setDistPartials={setDistPartials}
          amMode={amMode}
          setAmMode={setAmMode}
          amFrequency={amFrequency}
          setAmFrequency={setAmFrequency}
          fmMode={fmMode}
          setFmMode={setFmMode}
          fmFrequency={fmFrequency}
          setFmFrequency={setFmFrequency}
          lfoMode={lfoMode}
          setLfoMode={setLfoMode}
          lfoFrequency={lfoFrequency}
          setLfoFrequency={setLfoFrequency}
          crazy={crazy}
          setCrazy={setCrazy}
          distortedFmIntensity={distortedFmIntensity}
          setDistortedFmIntensity={setDistortedFmIntensity}
          volume={volume}
          setVolume={setVolume} // Pass volume and setter
        />

        {/* Instructions */}
        <Instructions>
          Press keys (Z, S, X, D, C, V, G, B, H, N, J, M, Q, 2, W, 3, E, R, 5, T, 6, Y, 7, U, I) to play notes.
        </Instructions>

        {/* Button Container for Octave and Virtual Keyboard */}
        <ButtonContainer>
          {/* Octave Down Button */}
          <ToggleButton
            onClick={handleOctaveDown}
            disabled={octaveShift <= -1}
            title="Shift down by one octave"
            aria-label="Shift down by one octave"
          >
            <FaArrowDown style={{ marginRight: '5px' }} />
            Octave Down
          </ToggleButton>

          {/* Show/Hide Virtual Keyboard Button */}
          <ToggleButton onClick={() => setShowKeyboard(!showKeyboard)}>
            {showKeyboard ? 'Hide Virtual Keyboard' : 'Show Virtual Keyboard'}
          </ToggleButton>

          {showKeyboard && (
            <ToggleButton onClick={() => setIsTwoRows(!isTwoRows)}>
              {isTwoRows ? 'Make One Row' : 'Make Two Rows'}
            </ToggleButton>
          )}

          {/* Octave Up Button */}
          <ToggleButton
            onClick={handleOctaveUp}
            disabled={octaveShift >= 1}
            title="Shift up by one octave"
            aria-label="Shift up by one octave"
          >
            <FaArrowUp style={{ marginRight: '5px' }} />
            Octave Up
          </ToggleButton>
        </ButtonContainer>

        {/* Virtual Keyboard */}
        {showKeyboard && (
          <VirtualKeyboard
            keys={shiftedKeys} // Use shiftedKeys here
            handleVirtualKeyDown={handleVirtualKeyDown}
            handleVirtualKeyUp={handleVirtualKeyUp}
            activeOscillators={activeOscillatorsRef.current}
            isTwoRows={isTwoRows}
          />
        )}
      </Container>
    </Modal>
  );
};

export default Synth;
