import { useEffect } from "react";
import { useState } from "react";
import SpeechRecognition, {
  useSpeechRecognition,
} from "react-speech-recognition";

const App = () => {
  const {
    transcript,
    listening,
    isMicrophoneAvailable,
    browserSupportsSpeechRecognition,
  } = useSpeechRecognition();
  if (!isMicrophoneAvailable) {
    alert("microphone unavailable");
  }
  if (!browserSupportsSpeechRecognition) {
    return <span>Browser doesn't support speech recognition.</span>;
  }
  const startListening = () => {
    SpeechRecognition.startListening({ continuous: true });
  };
  console.log(listening);

  const [islistening, setIslistening] = useState(false);
  useEffect(() => {
    if (listening) {
      setIslistening(true);
    } else {
      setIslistening(false);
    }
    console.log(transcript);
  }, [listening]);
  return (
    <div>
      <p>Microphone: {listening ? "on" : "off"}</p>
      <button
        onClick={() => startListening()}
        // onMouseDown={startListening}

        // onMouseUp={SpeechRecognition.stopListening}
      >
        Hold to talk
      </button>

      <button onClick={SpeechRecognition.stopListening}>stop</button>
      <p>{transcript}</p>
    </div>
  );
};
export default App;
