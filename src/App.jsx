import React, { useState, useEffect, useRef } from "react";

const App = () => {
  const [transcript, setTranscript] = useState("");
  const [isListening, setIsListening] = useState(false);
  const [error, setError] = useState(null);
  const [isMicMuted, setIsMicMuted] = useState(false);
  const [inputLevel, setInputLevel] = useState(0); // For debugging audio input levels
  const recognitionRef = useRef(null);

  useEffect(() => {
    const SpeechRecognition =
      window.SpeechRecognition || window.webkitSpeechRecognition;

    if (!SpeechRecognition) {
      setError("Speech recognition not supported");
      return;
    }

    const recognition = new SpeechRecognition();
    recognitionRef.current = recognition;

    // Configure for Indian English
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.maxAlternatives = 1;
    recognition.lang = "en-IN";

    recognition.onresult = (event) => {
      const result = event.results[event.results.length - 1];
      const transcript = result[0].transcript;
      setTranscript((prev) => prev + " " + transcript);
    };

    recognition.onerror = (event) => {
      setError(`Error asdsads: ${event.error}`);
      if (event.error === "no-speech") {
        checkMicMuted();
      }
      setIsListening(false);
    };

    recognition.onstart = () => {
      setIsListening(true);
      setError(null);
      monitorMicInput(); // Start monitoring audio input
    };

    recognition.onend = () => {
      setIsListening(false);
      stopMicInputMonitoring(); // Stop monitoring audio input
    };

    return () => {
      recognition.stop();
      stopMicInputMonitoring();
    };
  }, []);

  const checkMicMuted = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const audioTracks = stream.getAudioTracks();
      const isMuted = audioTracks.every(
        (track) => track.muted || track.readyState === "ended"
      );
      setIsMicMuted(isMuted);

      // Stop the stream to release the microphone
      audioTracks.forEach((track) => track.stop());
    } catch (err) {
      setError("Unable to access the microphone");
      setIsMicMuted(true);
    }
  };

  const monitorMicInput = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
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
      setError("Unable to monitor audio input");
    }
  };

  const stopMicInputMonitoring = () => {
    setInputLevel(0);
  };

  const startListening = () => {
    if (recognitionRef.current) {
      try {
        recognitionRef.current.start();
      } catch (err) {
        setError(`Start error: ${err.message}`);
      }
    }
  };

  const stopListening = () => {
    if (recognitionRef.current) {
      recognitionRef.current.stop();
    }
  };

  const resetTranscript = () => {
    setTranscript("");
    setError(null);
    setIsMicMuted(false);
    setInputLevel(0);
  };

  return (
    <div>
      <h1>Speech Recognition (Indian English)</h1>

      <div>
        <button onClick={startListening} disabled={isListening || isMicMuted}>
          Start Listening
        </button>

        <button onClick={stopListening} disabled={!isListening}>
          Stop Listening
        </button>

        <button onClick={resetTranscript}>Reset</button>
      </div>

      {error && <div style={{ color: "red", marginTop: "10px" }}>{error}</div>}

      {isMicMuted && (
        <div style={{ color: "red", marginTop: "10px" }}>
          Microphone is muted or not working. Please check your mic settings.
        </div>
      )}

      <div>
        <h2>Transcript:</h2>
        <p>{transcript || "No transcript yet..."}</p>
      </div>

      <div>
        <p>Status: {isListening ? "Listening" : "Not Listening"}</p>
        <p>
          Mic Input Level:{" "}
          {inputLevel > 0 ? inputLevel.toFixed(2) : "No input detected"}
        </p>
      </div>

      <div
        style={{ marginTop: "20px", border: "1px solid #ccc", padding: "10px" }}
      >
        <h3>Tips for Indian English Speech Recognition:</h3>
        <ul>
          <li>Speak clearly and at a moderate pace</li>
          <li>Minimize background noise</li>
          <li>Use standard Indian English pronunciation</li>
          <li>Ensure good microphone input</li>
        </ul>
      </div>
    </div>
  );
};

export default App;
