import React, { useRef, useState, useEffect, useCallback } from 'react';
import { Camera, Video, Play, Pause, Maximize, StopCircle, Zap, ArrowLeft, ArrowRight } from 'lucide-react';
import { MediaItem } from '../types';

interface MediaCaptureProps {
  onMediaCaptured: (item: MediaItem) => void;
  onVideoUrlReady: (url: string) => void;
}

export const MediaCapture: React.FC<MediaCaptureProps> = ({ onMediaCaptured, onVideoUrlReady }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const containerRef = useRef<HTMLDivElement>(null);
  const pressTimerRef = useRef<number | null>(null);
  const pressStartTimeRef = useRef<number>(0);
  const isVideoShortcutActiveRef = useRef(false);

  // Refs for state access inside event listeners
  const stateRef = useRef({
    isStreaming: false,
    isRecording: false,
    isPaused: false
  });

  const [isStreaming, setIsStreaming] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [showOverlay, setShowOverlay] = useState(true);

  // Sync refs with state
  useEffect(() => {
    stateRef.current = { isStreaming, isRecording, isPaused };
  }, [isStreaming, isRecording, isPaused]);

  // Start Camera
  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { width: { ideal: 1920 }, height: { ideal: 1080 } },
        audio: true 
      });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        streamRef.current = stream;
        setIsStreaming(true);
      }
    } catch (err) {
      console.error("Error accessing camera:", err);
      alert("Não foi possível acessar a câmera. Verifique as permissões.");
    }
  };

  // Screenshot
  const takeSnapshot = useCallback(() => {
    if (videoRef.current && stateRef.current.isStreaming) {
      const canvas = document.createElement('canvas');
      canvas.width = videoRef.current.videoWidth;
      canvas.height = videoRef.current.videoHeight;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.drawImage(videoRef.current, 0, 0);
        const dataUrl = canvas.toDataURL('image/jpeg', 0.9);
        onMediaCaptured({
          id: Date.now().toString(),
          type: 'image',
          url: dataUrl,
          timestamp: Date.now()
        });
        
        // Visual flash effect
        const flash = document.createElement('div');
        flash.className = "absolute inset-0 bg-white opacity-50 transition-opacity duration-200 pointer-events-none";
        containerRef.current?.appendChild(flash);
        setTimeout(() => flash.remove(), 100);
      }
    }
  }, [onMediaCaptured]);

  // Recording Logic
  const startRecording = useCallback(() => {
    if (streamRef.current && stateRef.current.isStreaming && !stateRef.current.isRecording) {
      const mediaRecorder = new MediaRecorder(streamRef.current, { mimeType: 'video/webm;codecs=vp9' });
      mediaRecorderRef.current = mediaRecorder;
      chunksRef.current = [];

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) {
          chunksRef.current.push(e.data);
        }
      };

      mediaRecorder.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: 'video/webm' });
        const url = URL.createObjectURL(blob);
        
        onMediaCaptured({
          id: Date.now().toString(),
          type: 'video',
          url: url,
          blob: blob,
          timestamp: Date.now()
        });
        
        onVideoUrlReady(url); 
      };

      mediaRecorder.start(1000); 
      setIsRecording(true);
      setRecordingTime(0);
    }
  }, [onMediaCaptured, onVideoUrlReady]);

  const pauseRecording = useCallback(() => {
    if (mediaRecorderRef.current && stateRef.current.isRecording) {
      if (stateRef.current.isPaused) {
        mediaRecorderRef.current.resume();
        setIsPaused(false);
      } else {
        mediaRecorderRef.current.pause();
        setIsPaused(true);
      }
    }
  }, []);

  const stopRecording = useCallback(() => {
    if (mediaRecorderRef.current && stateRef.current.isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      setIsPaused(false);
    }
  }, []);

  // Timer
  useEffect(() => {
    let interval: number;
    if (isRecording && !isPaused) {
      interval = window.setInterval(() => {
        setRecordingTime(prev => prev + 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isRecording, isPaused]);

  // Keyboard Shortcuts Handler
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ignore if typing in an input (allows standard Paste/Save behavior in text fields)
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;

      // Snapshot Shortcut 'ArrowLeft'
      if (e.key === 'ArrowLeft') {
        e.preventDefault();
        takeSnapshot();
      }

      // Video Shortcut 'ArrowRight'
      if (e.key === 'ArrowRight') {
        e.preventDefault();
        if (e.repeat) return; // Ignore repeat events for long press detection logic
        
        isVideoShortcutActiveRef.current = true;
        pressStartTimeRef.current = Date.now();
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;

      // Only act if the specific shortcut sequence was initiated
      if (e.key === 'ArrowRight' && isVideoShortcutActiveRef.current) {
        e.preventDefault();
        isVideoShortcutActiveRef.current = false; // Reset tracker
        
        const duration = Date.now() - pressStartTimeRef.current;
        const isLongPress = duration > 500; // 500ms threshold

        const { isRecording, isPaused } = stateRef.current;

        if (isLongPress) {
          // Long Press: Stop Recording if active
          if (isRecording) {
            stopRecording();
          }
        } else {
          // Short Press: Toggle
          if (!isRecording) {
            startRecording();
          } else {
            pauseRecording();
          }
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [takeSnapshot, startRecording, pauseRecording, stopRecording]);

  // Fullscreen
  const toggleFullscreen = () => {
    if (containerRef.current) {
      if (!document.fullscreenElement) {
        containerRef.current.requestFullscreen();
      } else {
        document.exitFullscreen();
      }
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div 
      ref={containerRef} 
      className="relative flex flex-col h-full bg-black rounded-lg overflow-hidden border-2 border-slate-800 shadow-xl print:hidden group"
      onMouseEnter={() => setShowOverlay(true)}
      onMouseLeave={() => setShowOverlay(false)}
    >
      {/* Video Display */}
      <div className="flex-1 relative bg-black flex items-center justify-center">
        {!isStreaming && (
          <button 
            onClick={startCamera}
            className="flex flex-col items-center text-slate-400 hover:text-white transition"
          >
            <Camera className="w-16 h-16 mb-2" />
            <span className="text-lg">Iniciar Câmera</span>
          </button>
        )}
        <video 
          ref={videoRef} 
          autoPlay 
          muted 
          className={`w-full h-full object-contain ${!isStreaming ? 'hidden' : ''}`} 
        />
        
        {/* Fullscreen/Overlay Controls - Visible on Hover or Fullscreen */}
        {isStreaming && (
          <div className={`absolute bottom-4 left-0 right-0 flex justify-center items-end gap-6 pb-2 transition-opacity duration-300 ${showOverlay ? 'opacity-100' : 'opacity-0 hover:opacity-100'}`}>
            
            {/* Overlay Snapshot Button */}
            <button
              onClick={takeSnapshot}
              className="bg-black/50 hover:bg-slate-700/80 backdrop-blur text-white p-4 rounded-full border border-white/20 shadow-lg transform hover:scale-105 transition flex flex-col items-center gap-1"
              title="Atalho: Seta Esquerda"
            >
              <Camera className="w-6 h-6" />
              <span className="text-[10px] font-mono opacity-70 flex items-center gap-1"><ArrowLeft className="w-3 h-3"/> Esq</span>
            </button>

            {/* Overlay Video Control */}
            {!isRecording ? (
              <button
                onClick={startRecording}
                className="bg-red-600/90 hover:bg-red-700 backdrop-blur text-white p-5 rounded-full border-4 border-red-900/50 shadow-lg transform hover:scale-105 transition flex flex-col items-center gap-1"
                title="Atalho: Seta Direita (Toque)"
              >
                <Video className="w-8 h-8" />
                <span className="text-[10px] font-mono opacity-90 flex items-center gap-1">Dir <ArrowRight className="w-3 h-3"/></span>
              </button>
            ) : (
              <div className="flex items-center gap-4 bg-black/60 backdrop-blur p-2 rounded-full border border-white/10">
                 {/* Pause/Resume Overlay */}
                <button
                  onClick={pauseRecording}
                  className="bg-amber-500 hover:bg-amber-600 text-white p-4 rounded-full shadow-lg transition"
                  title="Pausar: Seta Direita (Toque Simples)"
                >
                  {isPaused ? <Play className="w-6 h-6" /> : <Pause className="w-6 h-6" />}
                </button>
                
                {/* Timer Overlay */}
                <div className="px-2 text-center">
                   <div className="text-red-500 font-black font-mono text-xl shadow-black drop-shadow-md">
                      {formatTime(recordingTime)}
                   </div>
                   <div className="text-[10px] text-slate-300">
                      {isPaused ? 'PAUSADO' : 'GRAVANDO'}
                   </div>
                </div>

                {/* Stop Overlay */}
                <button
                  onClick={stopRecording}
                  className="bg-slate-700 hover:bg-slate-600 text-white p-4 rounded-full shadow-lg transition border border-red-500/50"
                  title="Parar: Seta Direita (Segure por 1s)"
                >
                  <StopCircle className="w-6 h-6 text-red-500" />
                </button>
              </div>
            )}
          </div>
        )}

        {/* Top Right Status (Recording Dot) */}
        {isRecording && (
          <div className="absolute top-4 right-4 flex items-center gap-2 bg-red-600/80 text-white px-3 py-1 rounded-full animate-pulse z-10">
            <div className="w-3 h-3 bg-white rounded-full"></div>
            <span className="font-mono font-bold">{formatTime(recordingTime)}</span>
          </div>
        )}
      </div>

      {/* Bottom Static Control Bar (Standard UI) */}
      <div className="bg-slate-900 p-4 border-t border-slate-700 z-20">
        <div className="flex items-center justify-between max-w-4xl mx-auto">
          
          <div className="flex gap-4">
            <button 
              onClick={takeSnapshot}
              disabled={!isStreaming}
              className="flex items-center gap-2 bg-slate-700 hover:bg-slate-600 text-white px-4 py-2 rounded disabled:opacity-50"
              title="Atalho: Seta Esquerda"
            >
              <Camera className="w-5 h-5" />
              <div className="flex flex-col items-start leading-none">
                <span className="hidden md:inline">FOTO</span>
                <span className="text-[10px] text-slate-400 font-mono hidden md:flex items-center gap-1"><ArrowLeft className="w-3 h-3"/> Esq</span>
              </div>
            </button>
          </div>

          <div className="flex gap-4">
            {!isRecording ? (
              <button 
                onClick={startRecording}
                disabled={!isStreaming}
                className="flex items-center gap-2 bg-red-600 hover:bg-red-700 text-white px-6 py-2 rounded-full font-bold disabled:opacity-50 transition-colors"
                title="Atalho: Seta Direita"
              >
                <Video className="w-5 h-5" />
                <div className="flex flex-col items-start leading-none">
                  <span>REC</span>
                  <span className="text-[10px] text-white/70 font-mono font-normal flex items-center gap-1">Dir <ArrowRight className="w-3 h-3"/></span>
                </div>
              </button>
            ) : (
              <>
                <button 
                  onClick={pauseRecording}
                  className="flex items-center gap-2 bg-amber-500 hover:bg-amber-600 text-white px-4 py-2 rounded-full"
                  title="Atalho: Seta Direita (Clique)"
                >
                  {isPaused ? <Play className="w-5 h-5" /> : <Pause className="w-5 h-5" />}
                  <span className="text-xs font-mono hidden sm:inline">{isPaused ? 'RETOMAR' : 'PAUSAR'}</span>
                </button>
                <button 
                  onClick={stopRecording}
                  className="flex items-center gap-2 bg-slate-700 hover:bg-slate-600 text-white px-4 py-2 rounded-full"
                  title="Atalho: Seta Direita (Segurar)"
                >
                  <StopCircle className="w-6 h-6 text-red-500" />
                  <span className="text-xs font-mono hidden sm:inline">PARAR</span>
                </button>
              </>
            )}
          </div>

          <div>
            <button 
              onClick={toggleFullscreen}
              className="text-slate-400 hover:text-white p-2 flex flex-col items-center"
              title="Tela Cheia"
            >
              <Maximize className="w-6 h-6" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};