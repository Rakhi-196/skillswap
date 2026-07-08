"use client";

import { useRef, useState } from "react";

interface Props {
  onRecorded: (file: Blob) => void;
}

export default function VoiceRecorder({ onRecorded }: Props) {
  const [recording, setRecording] = useState(false);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);


  const startRecording = async () => {
    const stream = await navigator.mediaDevices.getUserMedia({
      audio: true,
    });


    const recorder = new MediaRecorder(stream);

    mediaRecorderRef.current = recorder;
    chunksRef.current = [];


    recorder.ondataavailable = (e) => {
      if (e.data.size > 0) {
        chunksRef.current.push(e.data);
      }
    };


    recorder.onstop = () => {

      const audioBlob = new Blob(
        chunksRef.current,
        {
          type: "audio/webm",
        }
      );


      onRecorded(audioBlob);


      // mic release
      stream.getTracks().forEach((track) => track.stop());
    };


    recorder.start();

    setRecording(true);
  };


  const stopRecording = () => {

    if (mediaRecorderRef.current) {
      mediaRecorderRef.current.stop();
    }

    setRecording(false);
  };


  return (
    <div>

      {!recording ? (

        <button
          onClick={startRecording}
          className="px-3 py-2 bg-green-500 text-white rounded-full"
        >
          🎤
        </button>

      ) : (

        <button
          onClick={stopRecording}
          className="px-3 py-2 bg-red-500 text-white rounded-full"
        >
          ⏹ Stop
        </button>

      )}

    </div>
  );
}