import React, { useState, useEffect, useRef } from "react";

const App = () => {
  const [devices, setDevices] = useState([]);
  const [selectedDeviceId, setSelectedDeviceId] = useState(null);
  const [transcript, setTranscript] = useState("");
  const [isListening, setIsListening] = useState(false);
  const [inputLevel, setInputLevel] = useState(0);
  const [error, setError] = useState(null);
  const recognitionRef = useRef(null);
  const micStreamRef = useRef(null);

  // Fetch active and connected microphones
  useEffect(() => {
    const fetchActiveDevices = async () => {
      try {
        const deviceList = await navigator.mediaDevices.enumerateDevices();
        const activeDevices = deviceList.filter(
          (device) => device.kind === "audioinput" && device.label
        ); // Filter out devices without labels (inactive)

        setDevices(activeDevices);

        if (activeDevices.length > 0) {
          setSelectedDeviceId(activeDevices[0].deviceId); // Default to the first active device
        } else {
          setError("No active microphones found.");
        }
      } catch (err) {
        setError("Unable to fetch devices: " + err.message);
      }
    };

    navigator.mediaDevices
      .getUserMedia({ audio: true })
      .then(fetchActiveDevices)
      .catch((err) => {
        setError("Microphone access is required to list devices.");
      });
  }, []);

  // Initialize speech recognition
  useEffect(() => {
    const SpeechRecognition =
      window.SpeechRecognition || window.webkitSpeechRecognition;

    if (!SpeechRecognition) {
      setError("Speech recognition not supported");
      return;
    }

    const recognition = new SpeechRecognition();
    recognitionRef.current = recognition;

    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = "en-IN";

    recognition.onresult = (event) => {
      const result = event.results[event.results.length - 1];
      const transcript = result[0].transcript;
      setTranscript((prev) => prev + " " + transcript);
    };

    recognition.onerror = (event) => {
      setError(`Recognition Error: ${event.error}`);
      setIsListening(false);
    };

    recognition.onstart = () => {
      setIsListening(true);
      setError(null);
    };

    recognition.onend = () => {
      setIsListening(false);
    };

    return () => {
      recognition.stop();
    };
  }, []);

  // Monitor microphone input level
  const monitorMicInput = async (deviceId) => {
    try {
      if (micStreamRef.current) {
        micStreamRef.current.getTracks().forEach((track) => track.stop());
      }

      const stream = await navigator.mediaDevices.getUserMedia({
        audio: { deviceId: deviceId },
      });

      micStreamRef.current = stream;

      const audioContext = new (window.AudioContext ||
        window.webkitAudioContext)();
      const source = audioContext.createMediaStreamSource(stream);
      const analyser = audioContext.createAnalyser();
      analyser.fftSize = 256;
      const dataArray = new Uint8Array(analyser.frequencyBinCount);
      source.connect(analyser);

      const checkAudioLevel = () => {
        analyser.getByteFrequencyData(dataArray);
        const volume = dataArray.reduce((a, b) => a + b) / dataArray.length;
        setInputLevel(volume);

        if (isListening) {
          requestAnimationFrame(checkAudioLevel);
        } else {
          stream.getTracks().forEach((track) => track.stop());
          audioContext.close();
        }
      };

      checkAudioLevel();
    } catch (err) {
      setError("Unable to monitor mic input: " + err.message);
    }
  };

  // Start listening with the selected mic
  const startListening = () => {
    if (recognitionRef.current && selectedDeviceId) {
      try {
        recognitionRef.current.start();
        monitorMicInput(selectedDeviceId);
      } catch (err) {
        setError(`Start Error: ${err.message}`);
      }
    }
  };

  const stopListening = () => {
    if (recognitionRef.current) {
      recognitionRef.current.stop();
    }
    setInputLevel(0);
  };

  const resetTranscript = () => {
    setTranscript("");
    setError(null);
  };

  const handleDeviceChange = (event) => {
    const newDeviceId = event.target.value;
    setSelectedDeviceId(newDeviceId);
    if (isListening) {
      monitorMicInput(newDeviceId);
    }
  };

  return (
    <div>
      <h1>Speech Recognition with Active Mic Selector</h1>

      {/* Device Selector */}
      <div>
        <label htmlFor="mic-select">Select Microphone:</label>
        <select
          id="mic-select"
          onChange={handleDeviceChange}
          value={selectedDeviceId || ""}
        >
          {devices.length > 0 ? (
            devices.map((device) => (
              <option key={device.deviceId} value={device.deviceId}>
                {device.label}
              </option>
            ))
          ) : (
            <option>No active microphones available</option>
          )}
        </select>
      </div>

      {/* Controls */}
      <div>
        <button
          onClick={startListening}
          disabled={isListening || !devices.length}
        >
          Start Listening
        </button>
        <button onClick={stopListening} disabled={!isListening}>
          Stop Listening
        </button>
        <button onClick={resetTranscript}>Reset</button>
      </div>

      {/* Error Display */}
      {error && <div style={{ color: "red" }}>{error}</div>}

      {/* Transcript */}
      <div>
        <h2>Transcript:</h2>
        <p>{transcript || "No transcript yet..."}</p>
      </div>

      {/* Input Level Meter */}
      <div>
        <p>Audio Input Level: {Math.round(inputLevel)}%</p>
        <div
          style={{
            height: "10px",
            width: `${Math.min(inputLevel, 100)}%`,
            background: "green",
            marginTop: "10px",
          }}
        />
      </div>

      {/* Status */}
      <div>
        <p>Status: {isListening ? "Listening" : "Not Listening"}</p>
      </div>
    </div>
  );
};

export default App;
