import { useState, useEffect, useRef, useCallback } from 'react';
import { NovaCallSession } from '../utils/aiCallService';

export function useNovaCall({ isExamMode = false, isInterviewMode = false, interviewStack = '', interviewTopic = '' } = {}) {
  const [isActive, setIsActive] = useState(false);
  const [timeLeft, setTimeLeft] = useState(0); // Will now count UP for duration tracking
  const [status, setStatus] = useState('idle'); // idle, listening, speaking, processing, complete
  const [transcript, setTranscript] = useState('');
  const [novaSubtitle, setNovaSubtitle] = useState('');
  const [summary, setSummary] = useState(null);
  const [isMuted, setIsMuted] = useState(false);
  const [hasError, setHasError] = useState(false);
  const [userAudioLevel, setUserAudioLevel] = useState(0);
  const [useFallback, setUseFallback] = useState(false);

  const recognitionRef = useRef(null);
  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);
  const silenceStartRef = useRef(null);
  const synthesisRef = useRef(window.speechSynthesis);
  const sessionRef = useRef(null);
  const timerRef = useRef(null);
  const speechTimeoutRef = useRef(null); // Used for debounce
  
  // Streaming Queue Refs
  const speechQueueRef = useRef([]);
  const isSpeakingRef = useRef(false);

  // Audio Context refs for visualizer
  const audioContextRef = useRef(null);
  const analyserRef = useRef(null);
  const microphoneRef = useRef(null);
  const animationFrameRef = useRef(null);

  // Sync state for async callbacks
  const stateRef = useRef({ isActive, isMuted, timeLeft, status, useFallback });
  useEffect(() => {
    stateRef.current = { isActive, isMuted, timeLeft, status, useFallback };
  }, [isActive, isMuted, timeLeft, status, useFallback]);

  // Initialize Speech Recognition
  useEffect(() => {
    if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
      console.warn("Speech Recognition API not supported natively. Using Whisper Fallback.");
      setUseFallback(true);
      return;
    }

    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    recognitionRef.current = new SpeechRecognition();
    recognitionRef.current.continuous = false;
    recognitionRef.current.interimResults = true;
    recognitionRef.current.lang = 'en-IN'; // Indian English for better recognition

    recognitionRef.current.onstart = () => setStatus('listening');
    
    recognitionRef.current.onresult = (event) => {
      let finalTranscript = '';
      let interimTranscript = '';
      for (let i = event.resultIndex; i < event.results.length; ++i) {
        if (event.results[i].isFinal) {
          finalTranscript += event.results[i][0].transcript;
        } else {
          interimTranscript += event.results[i][0].transcript;
        }
      }
      if (finalTranscript) {
        setTranscript(finalTranscript);
        
        // INTERRUPT LOGIC for Chrome
        const current = stateRef.current;
        if (current.status === 'speaking' || isSpeakingRef.current) {
           synthesisRef.current.cancel();
           speechQueueRef.current = [];
           isSpeakingRef.current = false;
           setStatus('listening');
        }
        
        // Debounce: Wait 2 seconds of silence before assuming they are done speaking
        if (speechTimeoutRef.current) {
          clearTimeout(speechTimeoutRef.current);
        }
        speechTimeoutRef.current = setTimeout(() => {
          handleUserSpeech(finalTranscript);
        }, 2000);
      }
    };

    recognitionRef.current.onerror = (event) => {
      if (event.error === 'no-speech') {
        // Expected behavior when user pauses. Ignore it, onend will restart.
        return;
      }
      console.error("Speech recognition error:", event.error);
      if (event.error !== 'aborted') {
          setStatus('idle');
      }
    };

    recognitionRef.current.onend = () => {
      const current = stateRef.current;
      // Restart if listening OR speaking, so the mic never dies during Barge-in
      if ((current.status === 'listening' || current.status === 'speaking') && current.isActive && !current.isMuted && !current.useFallback) {
        try { recognitionRef.current.start(); } catch (e) {}
      }
    };

    return () => {
      if (recognitionRef.current) recognitionRef.current.abort();
      if (timerRef.current) clearInterval(timerRef.current);
      if (speechTimeoutRef.current) clearTimeout(speechTimeoutRef.current);
      synthesisRef.current.cancel();
      stopAudioVisualizer();
    };
  }, []);

  const startAudioVisualizer = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      audioContextRef.current = new (window.AudioContext || window.webkitAudioContext)();
      analyserRef.current = audioContextRef.current.createAnalyser();
      microphoneRef.current = audioContextRef.current.createMediaStreamSource(stream);
      
      analyserRef.current.fftSize = 256;
      microphoneRef.current.connect(analyserRef.current);
      
      const dataArray = new Uint8Array(analyserRef.current.frequencyBinCount);
      
      // Initialize MediaRecorder for fallback
      const currentUseFallback = stateRef.current.useFallback;
      if (currentUseFallback) {
        mediaRecorderRef.current = new MediaRecorder(stream, { mimeType: 'audio/webm' });
        mediaRecorderRef.current.ondataavailable = (event) => {
          if (event.data.size > 0) audioChunksRef.current.push(event.data);
        };
        mediaRecorderRef.current.onstop = async () => {
          if (audioChunksRef.current.length === 0) return;
          const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
          audioChunksRef.current = []; // reset
          
          const current = stateRef.current;
          if (!sessionRef.current || current.status === 'speaking' || current.status === 'processing') return;
          
          setStatus('processing');
          
          // Use Whisper API
          const transcriptText = await sessionRef.current.transcribeAudio(audioBlob);
          if (transcriptText && transcriptText.trim().length > 1) {
             setTranscript(transcriptText);
             await handleUserSpeech(transcriptText);
          } else {
             // If silence or failed transcription, ask them to repeat
             if (current.isActive && !current.isMuted) {
                speakResponse("I'm sorry, I didn't quite catch that. Could you please repeat?");
             }
          }
        };

        // Start recording immediately if active
        if (stateRef.current.isActive && !stateRef.current.isMuted) {
           setStatus('listening');
           try { mediaRecorderRef.current.start(); } catch(e) {}
        }
      }

      const updateLevel = () => {
        if (!analyserRef.current) return;
        analyserRef.current.getByteFrequencyData(dataArray);
        let sum = 0;
        for (let i = 0; i < dataArray.length; i++) {
          sum += dataArray[i];
        }
        const average = sum / dataArray.length;
        setUserAudioLevel(average); // value between 0 and 255
        
        // Fallback silence & interruption logic
        const current = stateRef.current;
        if (current.useFallback && mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
            
            // INTERRUPT LOGIC for Firefox/Fallback
            if (average > 15 && (current.status === 'speaking' || isSpeakingRef.current)) {
                synthesisRef.current.cancel();
                speechQueueRef.current = [];
                isSpeakingRef.current = false;
                setStatus('listening');
            }

            if (current.status === 'listening' || current.status === 'speaking') {
                if (average > 15) { // threshold
                    silenceStartRef.current = null; // Reset silence timer
                } else {
                    if (!silenceStartRef.current) {
                        silenceStartRef.current = Date.now();
                    } else if (Date.now() - silenceStartRef.current > 2000) { // 2 seconds of silence
                        silenceStartRef.current = null;
                        // Stop recorder to trigger transcription
                        mediaRecorderRef.current.stop();
                    }
                }
            }
        }

        animationFrameRef.current = requestAnimationFrame(updateLevel);
      };
      
      updateLevel();
    } catch (err) {
      console.error("Microphone access denied for visualizer", err);
      // If mic fails, we can't do either
      setHasError(true);
    }
  };

  const stopAudioVisualizer = () => {
    if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
    if (audioContextRef.current) {
      audioContextRef.current.close();
      audioContextRef.current = null;
    }
    if (microphoneRef.current) {
      microphoneRef.current.disconnect();
      microphoneRef.current = null;
    }
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop();
    }
    setUserAudioLevel(0);
  };

  // -----------------------------------------------------
  // Streaming Queue Logic
  // -----------------------------------------------------
  
  const processSpeechQueue = () => {
    if (isSpeakingRef.current || speechQueueRef.current.length === 0) return;
    
    const { text, isFinal, triggerEnd } = speechQueueRef.current.shift();
    isSpeakingRef.current = true;
    setStatus('speaking');
    setNovaSubtitle(text);

    // Ensure mic is ON while speaking so Barge-in works
    const current = stateRef.current;
    if (current.isActive && !current.isMuted) {
        if (current.useFallback) {
            try { mediaRecorderRef.current.start(); } catch(e){}
        } else {
            try { recognitionRef.current.start(); } catch(e) {}
        }
    }

    if (!text) {
        // Empty text, just skip synthesis and run the end logic
        isSpeakingRef.current = false;
        if (speechQueueRef.current.length > 0) {
            processSpeechQueue();
        } else {
            const current = stateRef.current;
            if (triggerEnd) {
                endCall();
            } else if (isFinal && current.isActive && !current.isMuted) {
                setStatus('listening');
                if (current.useFallback) {
                    try { mediaRecorderRef.current.start(); } catch(e){}
                } else {
                    try { recognitionRef.current.start(); } catch(e) {}
                }
            } else if (isFinal) {
                setStatus('idle');
            }
        }
        return;
    }

    if (synthesisRef.current.speaking) {
      synthesisRef.current.cancel();
    }

    const utterance = new SpeechSynthesisUtterance(text);
    // Try to find a good English voice
    const voices = synthesisRef.current.getVoices();
    const preferredVoice = 
      voices.find(v => v.lang === 'en-IN' && (v.name.includes('Female') || v.name.includes('Google'))) || 
      voices.find(v => v.lang === 'en-IN') ||
      voices.find(v => v.lang.startsWith('en-') && (v.name.includes('Female') || v.name.includes('Google'))) || 
      voices.find(v => v.lang.startsWith('en-'));
    if (preferredVoice) utterance.voice = preferredVoice;
    
    utterance.rate = 0.9; // Slower rate for beginners
    utterance.pitch = 1.1;

    utterance.onend = () => {
      isSpeakingRef.current = false;
      if (speechQueueRef.current.length > 0) {
        processSpeechQueue();
      } else {
        setNovaSubtitle('');
        // This was the last chunk
        const current = stateRef.current;
        if (triggerEnd) {
          endCall();
        } else if (isFinal && current.isActive && !current.isMuted) {
          setStatus('listening');
          if (current.useFallback) {
            try { mediaRecorderRef.current.start(); } catch(e){}
          } else {
            try { recognitionRef.current.start(); } catch(e) {}
          }
        } else if (isFinal) {
          setStatus('idle');
        }
      }
    };

    synthesisRef.current.speak(utterance);
  };

  const queueSpeech = (text, isFinal = false, triggerEnd = false) => {
    const cleanText = text.replace(/\[END_CALL\]/g, '').trim();
    if (cleanText) {
      speechQueueRef.current.push({ text: cleanText, isFinal, triggerEnd });
      processSpeechQueue();
    } else if (isFinal) {
      // if empty but final, we must ensure the loop terminates and goes to listening
      speechQueueRef.current.push({ text: '', isFinal, triggerEnd });
      processSpeechQueue();
    }
  };

  const speakResponse = (text, shouldEndCall = false) => {
    queueSpeech(text, true, shouldEndCall);
  };

  // -----------------------------------------------------

  const handleUserSpeech = async (text) => {
    if (!sessionRef.current || status === 'processing') return;
    
    // Stop speaking if it was interrupted
    if (isSpeakingRef.current || status === 'speaking') {
        synthesisRef.current.cancel();
        speechQueueRef.current = [];
        isSpeakingRef.current = false;
        setNovaSubtitle('');
    }

    if (!text || text.trim().length < 2) {
        speakResponse("I'm sorry, I didn't quite catch that. Could you please repeat?");
        return;
    }

    setStatus('processing');
    if (speechTimeoutRef.current) clearTimeout(speechTimeoutRef.current);
    if (recognitionRef.current) recognitionRef.current.abort(); // Stop listening while processing
    if (stateRef.current.useFallback && mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
        mediaRecorderRef.current.stop();
    }

    // Use non-streaming API (Groq is fast enough, and stream hangs in some browsers)
    let aiResponse = await sessionRef.current.sendMessage(text);
    
    let shouldEndCall = aiResponse.includes('[END_CALL]');
    aiResponse = aiResponse.replace(/\[END_CALL\]/g, '').trim();
    
    // Split the full response into sentences for the queue
    // This avoids the window.speechSynthesis long-text bug and plays seamlessly
    const sentences = aiResponse.match(/[^.?!]+[.?!]+(?:\s|$)|[^.?!]+$/g) || [aiResponse];
    
    sentences.forEach((sentence, index) => {
      const isFinalChunk = index === sentences.length - 1;
      queueSpeech(sentence.trim(), isFinalChunk, isFinalChunk ? shouldEndCall : false);
    });
  };

  const startCall = useCallback(() => {
    if (hasError) return;
    setIsActive(true);
    setTimeLeft(0);
    setSummary(null);
    setTranscript('');
    setIsMuted(false);
    
    // Reset Queue
    speechQueueRef.current = [];
    isSpeakingRef.current = false;
    
    // Immediately update ref so synchronous calls know we are active
    stateRef.current = { ...stateRef.current, isActive: true, isMuted: false, timeLeft: 0 };
    
    sessionRef.current = new NovaCallSession({ isExamMode, isInterviewMode, interviewStack, interviewTopic });
    
    // Start initial greeting
    if (isExamMode) {
      speakResponse("Welcome to your English placement exam. Let's begin. Could you please introduce yourself and tell me why you are learning English?");
    } else if (isInterviewMode && interviewStack) {
      if (interviewTopic) {
        speakResponse(`Hello. I will be your technical interviewer today for the ${interviewStack} role. We will focus specifically on ${interviewTopic}. Could you start by introducing yourself and your experience with this topic?`);
      } else {
        speakResponse(`Hello. I will be your technical interviewer today for the ${interviewStack} role. Could you start by introducing yourself and your experience with this stack?`);
      }
    } else {
      speakResponse("Hi! I'm Nova. We have two minutes to practice your English. What would you like to talk about today?");
    }

    // Start Timer (counting up)
    timerRef.current = setInterval(() => {
      setTimeLeft((prev) => prev + 1);
    }, 1000);
    
    // Start mic volume visualizer
    startAudioVisualizer();
  }, [hasError, isExamMode, isInterviewMode, interviewStack, interviewTopic]);

  const endCall = useCallback(async () => {
    setIsActive(false);
    setStatus('complete');
    if (timerRef.current) clearInterval(timerRef.current);
    if (speechTimeoutRef.current) clearTimeout(speechTimeoutRef.current);
    if (recognitionRef.current) recognitionRef.current.abort();
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') mediaRecorderRef.current.stop();
    synthesisRef.current.cancel();
    stopAudioVisualizer();

    if (sessionRef.current) {
        setStatus('processing'); // processing summary
        const callSummary = await sessionRef.current.generateSummary();
        setSummary(callSummary);
        setStatus('complete');
    }
  }, []);

  const toggleMute = () => {
    setIsMuted(!isMuted);
    const current = stateRef.current;
    if (!isMuted) {
      if (current.useFallback) {
         if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') mediaRecorderRef.current.stop();
      } else {
         if (recognitionRef.current) recognitionRef.current.abort();
      }
      setStatus('idle');
    } else {
      setStatus('listening');
      if (current.useFallback) {
         try { mediaRecorderRef.current.start(); } catch(e){}
      } else {
         try { recognitionRef.current.start(); } catch(e) {}
      }
    }
  };

  return {
    isActive,
    timeLeft,
    status,
    transcript,
    novaSubtitle,
    summary,
    isMuted,
    hasError,
    userAudioLevel,
    startCall,
    endCall,
    toggleMute
  };
}
