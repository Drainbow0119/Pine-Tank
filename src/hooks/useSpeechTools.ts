import { useState, useRef, useEffect, useCallback } from "react";
import {
  detectBrowserEnvironment,
  type BrowserGuidance,
} from "../utils/dialogueEngine";

export type MicButtonState = "ready" | "listening" | "done";

interface SpeechRecognitionAlternativeLike {
  transcript: string;
}

interface SpeechRecognitionResultLike {
  isFinal: boolean;
  length: number;
  [index: number]: SpeechRecognitionAlternativeLike;
}

interface SpeechRecognitionResultListLike {
  length: number;
  [index: number]: SpeechRecognitionResultLike;
}

interface SpeechRecognitionEventLike {
  resultIndex: number;
  results: SpeechRecognitionResultListLike;
}

interface SpeechRecognitionErrorEventLike {
  error: string;
}

interface SpeechRecognitionInstance {
  lang: string;
  continuous: boolean;
  interimResults: boolean;
  maxAlternatives: number;
  onstart: (() => void) | null;
  onresult: ((event: SpeechRecognitionEventLike) => void) | null;
  onerror: ((event: SpeechRecognitionErrorEventLike) => void) | null;
  onend: (() => void) | null;
  start: () => void;
  stop: () => void;
  abort: () => void;
}

type SpeechRecognitionConstructor = new () => SpeechRecognitionInstance;

function getSpeechRecognitionCtor(): SpeechRecognitionConstructor | null {
  if (typeof window === "undefined") return null;
  const win = window as unknown as {
    SpeechRecognition?: SpeechRecognitionConstructor;
    webkitSpeechRecognition?: SpeechRecognitionConstructor;
  };
  return win.SpeechRecognition || win.webkitSpeechRecognition || null;
}

export function useSpeechTools(onSpeechFinalized: (transcript: string) => void) {
  const [micState, setMicState] = useState<MicButtonState>("ready");
  const [liveTranscript, setLiveTranscript] = useState<string>("");
  const [isModelAudioPlaying, setIsModelAudioPlaying] = useState<boolean>(false);
  const [activeAudioTag, setActiveAudioTag] = useState<string | null>(null);
  const [micPermissionDenied, setMicPermissionDenied] = useState<boolean>(false);
  const [browserGuidance, setBrowserGuidance] = useState<BrowserGuidance>(() => {
    const hasApi = Boolean(getSpeechRecognitionCtor());
    const ua = typeof navigator !== "undefined" ? navigator.userAgent : "";
    return detectBrowserEnvironment(ua, hasApi);
  });

  const recognitionRef = useRef<SpeechRecognitionInstance | null>(null);
  const silenceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const initialSilenceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const audioFallbackTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const transcriptBufferRef = useRef<string>("");
  const finalizedCallbackRef = useRef(onSpeechFinalized);
  const hasFinalizedCurrentTurnRef = useRef<boolean>(false);

  useEffect(() => {
    finalizedCallbackRef.current = onSpeechFinalized;
  }, [onSpeechFinalized]);

  useEffect(() => {
    const hasApi = Boolean(getSpeechRecognitionCtor());
    const ua = typeof navigator !== "undefined" ? navigator.userAgent : "";
    setBrowserGuidance(detectBrowserEnvironment(ua, hasApi));
  }, []);

  const clearTimers = useCallback(() => {
    if (silenceTimerRef.current) {
      clearTimeout(silenceTimerRef.current);
      silenceTimerRef.current = null;
    }
    if (initialSilenceTimerRef.current) {
      clearTimeout(initialSilenceTimerRef.current);
      initialSilenceTimerRef.current = null;
    }
  }, []);

  const stopModelAudio = useCallback(() => {
    if (audioFallbackTimerRef.current) {
      clearTimeout(audioFallbackTimerRef.current);
      audioFallbackTimerRef.current = null;
    }
    if (typeof window !== "undefined" && "speechSynthesis" in window) {
      try {
        window.speechSynthesis.cancel();
      } catch {
        // Ignore synthesis cancel errors
      }
    }
    setIsModelAudioPlaying(false);
    setActiveAudioTag(null);
  }, []);

  const speakText = useCallback(
    (
      text: string,
      rate: 0.9 | 0.7 = 0.9,
      tag = "listen",
      onlyDisableOnStart = false
    ) => {
      if (typeof window === "undefined" || !("speechSynthesis" in window)) {
        return;
      }

      // Never run speech synthesis while recognition is active
      if (recognitionRef.current) {
        try {
          recognitionRef.current.abort();
        } catch {
          // Ignore
        }
        recognitionRef.current = null;
      }

      stopModelAudio();

      try {
        const utterance = new SpeechSynthesisUtterance(text);
        utterance.lang = "en-US";
        utterance.rate = rate;

        const words = text.trim().split(/\s+/).length;
        const estimatedMs = Math.min(
          5000,
          Math.max(1100, Math.round((words * 420) / rate))
        );

        const startedAt = Date.now();
        const finishPlayback = () => {
          if (audioFallbackTimerRef.current) {
            clearTimeout(audioFallbackTimerRef.current);
            audioFallbackTimerRef.current = null;
          }
          setIsModelAudioPlaying(false);
          setActiveAudioTag(null);
        };

        const handleUtteranceDone = () => {
          if (onlyDisableOnStart) {
            finishPlayback();
            return;
          }
          const elapsed = Date.now() - startedAt;
          if (elapsed < 450) {
            if (audioFallbackTimerRef.current) {
              clearTimeout(audioFallbackTimerRef.current);
            }
            audioFallbackTimerRef.current = setTimeout(
              finishPlayback,
              450 - elapsed
            );
          } else {
            finishPlayback();
          }
        };

        if (!onlyDisableOnStart) {
          setIsModelAudioPlaying(true);
          setActiveAudioTag(tag);
          audioFallbackTimerRef.current = setTimeout(finishPlayback, estimatedMs);
        } else {
          utterance.onstart = () => {
            setIsModelAudioPlaying(true);
            setActiveAudioTag(tag);
            audioFallbackTimerRef.current = setTimeout(
              finishPlayback,
              estimatedMs
            );
          };
        }

        utterance.onend = handleUtteranceDone;
        utterance.onerror = handleUtteranceDone;

        window.speechSynthesis.speak(utterance);
      } catch {
        setIsModelAudioPlaying(false);
        setActiveAudioTag(null);
      }
    },
    [stopModelAudio]
  );

  const stopListening = useCallback(() => {
    clearTimers();
    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch {
        // Ignore stop errors
      }
    }
  }, [clearTimers]);

  const startListening = useCallback(() => {
    if (isModelAudioPlaying) return;

    const Ctor = getSpeechRecognitionCtor();
    const ua = typeof navigator !== "undefined" ? navigator.userAgent : "";
    const currentGuidance = detectBrowserEnvironment(ua, Boolean(Ctor));
    setBrowserGuidance(currentGuidance);

    if (!Ctor) {
      return;
    }

    stopModelAudio();
    clearTimers();

    transcriptBufferRef.current = "";
    hasFinalizedCurrentTurnRef.current = false;
    setLiveTranscript("");
    setMicPermissionDenied(false);
    setMicState("listening");

    const recognition = new Ctor();
    recognition.lang = "en-US";
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.maxAlternatives = 1;
    recognitionRef.current = recognition;

    const finalizeOnce = () => {
      if (hasFinalizedCurrentTurnRef.current) return;
      hasFinalizedCurrentTurnRef.current = true;
      clearTimers();
      recognitionRef.current = null;
      const finalSpoken = transcriptBufferRef.current.trim();
      setMicState("done");
      finalizedCallbackRef.current(finalSpoken);
    };

    // Auto-stop if user says nothing within ~2.2 seconds
    initialSilenceTimerRef.current = setTimeout(() => {
      try {
        recognition.stop();
      } catch {
        finalizeOnce();
      }
    }, 2200);

    recognition.onresult = (event: SpeechRecognitionEventLike) => {
      if (initialSilenceTimerRef.current) {
        clearTimeout(initialSilenceTimerRef.current);
        initialSilenceTimerRef.current = null;
      }

      let combined = "";
      for (let i = 0; i < event.results.length; i++) {
        combined += event.results[i][0].transcript + " ";
      }
      const trimmed = combined.trim();
      transcriptBufferRef.current = trimmed;
      setLiveTranscript(trimmed);

      // Stop listening automatically after ~1.5 seconds of silence following speech
      if (silenceTimerRef.current) {
        clearTimeout(silenceTimerRef.current);
      }
      silenceTimerRef.current = setTimeout(() => {
        try {
          recognition.stop();
        } catch {
          finalizeOnce();
        }
      }, 1500);
    };

    recognition.onerror = (event: SpeechRecognitionErrorEventLike) => {
      clearTimers();
      if (
        event.error === "not-allowed" ||
        event.error === "service-not-allowed"
      ) {
        setMicPermissionDenied(true);
        hasFinalizedCurrentTurnRef.current = true;
        recognitionRef.current = null;
        setMicState("ready");
        return;
      }
      // For 'no-speech' or 'aborted', let onend finalize cleanly
    };

    recognition.onend = () => {
      finalizeOnce();
    };

    try {
      recognition.start();
    } catch {
      clearTimers();
      recognitionRef.current = null;
      setMicState("ready");
    }
  }, [clearTimers, isModelAudioPlaying, stopModelAudio]);

  const resetMicToReady = useCallback(() => {
    clearTimers();
    if (recognitionRef.current) {
      hasFinalizedCurrentTurnRef.current = true;
      try {
        recognitionRef.current.abort();
      } catch {
        // Ignore
      }
      recognitionRef.current = null;
    }
    setLiveTranscript("");
    setMicState("ready");
  }, [clearTimers]);

  useEffect(() => {
    return () => {
      clearTimers();
      stopModelAudio();
      if (recognitionRef.current) {
        try {
          recognitionRef.current.abort();
        } catch {
          // Ignore
        }
      }
    };
  }, [clearTimers, stopModelAudio]);

  return {
    micState,
    liveTranscript,
    isModelAudioPlaying,
    activeAudioTag,
    micPermissionDenied,
    browserGuidance,
    speakText,
    stopModelAudio,
    startListening,
    stopListening,
    resetMicToReady,
  };
}
