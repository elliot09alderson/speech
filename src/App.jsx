import { useEffect, useState } from "react";
import SpeechRecognition, {
  useSpeechRecognition,
} from "react-speech-recognition";

const App = () => {
  const {
    transcript,
    listening,
    isMicrophoneAvailable,
    browserSupportsSpeechRecognition,
    resetTranscript,
  } = useSpeechRecognition();

  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    if (!isMicrophoneAvailable) {
      setErrorMessage("Microphone is unavailable. Please check your device.");
    }
    if (!browserSupportsSpeechRecognition) {
      setErrorMessage("Browser doesn't support speech recognition.");
    }
  }, [isMicrophoneAvailable, browserSupportsSpeechRecognition]);

  const startListening = () => {
    try {
      console.log("Starting Speech Recognition...");
      SpeechRecognition.startListening({ continuous: true, language: "en-US" });
    } catch (error) {
      console.error("Error starting speech recognition:", error);
      setErrorMessage("Error starting speech recognition.");
    }
  };

  const stopListening = () => {
    console.log("Stopping Speech Recognition...");
    SpeechRecognition.stopListening();
  };

  useEffect(() => {
    console.log("Listening status:", listening);
    console.log("Transcript:", transcript);
  }, [listening, transcript]);

  return (
    <div>
      <h1>Speech-to-Text App</h1>
      {errorMessage && <p style={{ color: "red" }}>{errorMessage}</p>}
      <p>Microphone: {listening ? "On" : "Off"}</p>
      <button onClick={startListening}>Start Listening</button>
      <button onClick={stopListening}>Stop Listening</button>
      <button onClick={resetTranscript}>Reset Transcript</button>
      <h2>Transcript:</h2>
      <p>{transcript || "No transcript available yet"}</p>
    </div>
  );
};

export default App;
