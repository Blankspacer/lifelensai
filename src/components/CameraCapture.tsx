import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  Camera,
  Upload,
  RefreshCw,
  Sparkles,
  Zap,
  Image as ImageIcon,
  CheckCircle2,
  X,
  FileQuestion,
  HelpCircle,
  Box,
  Layers,
  ArrowRight,
} from 'lucide-react';
import { SAMPLE_DOCUMENTS } from '../data/sampleDocuments';
import { SampleDocument, LanguageCode } from '../types';

interface CameraCaptureProps {
  onAnalyze: (imageDataUrl: string, userNotes?: string) => void;
  isLoading: boolean;
  selectedLanguage: LanguageCode;
  onOpen3D?: () => void;
}

export const CameraCapture: React.FC<CameraCaptureProps> = ({
  onAnalyze,
  isLoading,
  selectedLanguage,
  onOpen3D,
}) => {
  const [mode, setMode] = useState<'camera' | 'upload'>('upload');
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [userNotes, setUserNotes] = useState<string>('');
  const [isCameraActive, setIsCameraActive] = useState<boolean>(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [facingMode, setFacingMode] = useState<'environment' | 'user'>('environment');
  const [isTorchOn, setIsTorchOn] = useState<boolean>(false);
  const [dragActive, setDragActive] = useState<boolean>(false);
  const [activeSampleId, setActiveSampleId] = useState<string | null>(null);

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Initialize camera stream
  const startCamera = useCallback(async () => {
    try {
      setCameraError(null);
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
      }

      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: facingMode,
          width: { ideal: 1920 },
          height: { ideal: 1080 },
        },
        audio: false,
      });

      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play();
      }
      setIsCameraActive(true);
    } catch (err: any) {
      console.warn('Camera access error:', err);
      setCameraError(
        'Unable to access camera device. Please ensure camera permissions are allowed, or upload an image directly.'
      );
      setIsCameraActive(false);
      setMode('upload');
    }
  }, [facingMode]);

  // Stop camera stream
  const stopCamera = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    setIsCameraActive(false);
  }, []);

  // Toggle Camera Facing Mode (back / front)
  const toggleFacingMode = () => {
    setFacingMode((prev) => (prev === 'environment' ? 'user' : 'environment'));
  };

  // Switch between mode tabs
  useEffect(() => {
    if (mode === 'camera' && !selectedImage) {
      startCamera();
    } else {
      stopCamera();
    }
    return () => {
      stopCamera();
    };
  }, [mode, startCamera, stopCamera, selectedImage]);

  // Handle global paste event for screenshots
  useEffect(() => {
    const handlePaste = (e: ClipboardEvent) => {
      const items = e.clipboardData?.items;
      if (!items) return;

      for (let i = 0; i < items.length; i++) {
        if (items[i].type.indexOf('image') !== -1) {
          const blob = items[i].getAsFile();
          if (blob) {
            const reader = new FileReader();
            reader.onload = (event) => {
              if (event.target?.result) {
                setSelectedImage(event.target.result as string);
                setActiveSampleId(null);
                setMode('upload');
              }
            };
            reader.readAsDataURL(blob);
            break;
          }
        }
      }
    };

    window.addEventListener('paste', handlePaste);
    return () => window.removeEventListener('paste', handlePaste);
  }, []);

  // Capture frame from active video
  const takeSnapshot = () => {
    if (!videoRef.current) return;
    const video = videoRef.current;
    const canvas = document.createElement('canvas');
    canvas.width = video.videoWidth || 1280;
    canvas.height = video.videoHeight || 720;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    const dataUrl = canvas.toDataURL('image/jpeg', 0.92);
    setSelectedImage(dataUrl);
    setActiveSampleId(null);
    stopCamera();
  };

  // Handle file picker selection
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      if (event.target?.result) {
        setSelectedImage(event.target.result as string);
        setActiveSampleId(null);
      }
    };
    reader.readAsDataURL(file);
  };

  // Handle drag and drop
  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const file = e.dataTransfer.files[0];
      const reader = new FileReader();
      reader.onload = (event) => {
        if (event.target?.result) {
          setSelectedImage(event.target.result as string);
          setActiveSampleId(null);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  // Load a sample preset
  const handleSelectSample = (sample: SampleDocument) => {
    setSelectedImage(sample.dataUrl);
    setActiveSampleId(sample.id);
    if (sample.userNotes) {
      setUserNotes(sample.userNotes);
    }
    stopCamera();
  };

  const clearImage = () => {
    setSelectedImage(null);
    setActiveSampleId(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
    if (mode === 'camera') {
      startCamera();
    }
  };

  const handleSubmit = () => {
    if (!selectedImage) return;
    onAnalyze(selectedImage, userNotes.trim() ? userNotes.trim() : undefined);
  };

  return (
    <div className="w-full max-w-4xl mx-auto px-4 py-6 sm:py-8">
      {/* Hero Header */}
      <div className="text-center mb-6 sm:mb-8">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-950/60 border border-cyan-800/60 text-cyan-300 text-xs font-semibold mb-3">
          <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
          <span>Camera-First AI Interpreter</span>
        </div>
        <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-white tracking-tight">
          Scan It. <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-sky-300 to-indigo-400">Understand It.</span>
        </h1>
        <p className="mt-2 text-slate-300 text-sm sm:text-base max-w-xl mx-auto font-normal">
          Confusing bills, foreign product labels, dense legal clauses, suspicious SMS messages, or cryptic appliance manuals. Take a photo and get plain-language answers instantly.
        </p>
      </div>

      {/* Main Ingestion Container */}
      <div className="bg-slate-900/90 rounded-2xl border border-slate-800 shadow-2xl p-4 sm:p-6 backdrop-blur-xl">
        {/* Ingestion Mode Toggle */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-800 mb-5">
          <div className="flex bg-slate-950 p-1 rounded-xl border border-slate-800">
            <button
              onClick={() => {
                setMode('camera');
                if (selectedImage) clearImage();
              }}
              className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-medium transition-all ${
                mode === 'camera'
                  ? 'bg-gradient-to-r from-cyan-600 to-indigo-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Camera className="w-3.5 h-3.5" />
              <span>Live Camera</span>
            </button>
            <button
              onClick={() => {
                setMode('upload');
                stopCamera();
              }}
              className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-medium transition-all ${
                mode === 'upload'
                  ? 'bg-gradient-to-r from-cyan-600 to-indigo-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Upload className="w-3.5 h-3.5" />
              <span>Upload / Paste</span>
            </button>
          </div>

          <div className="text-[11px] text-slate-400 hidden sm:flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-cyan-400" />
            <span>Paste screenshot with <kbd className="px-1.5 py-0.5 bg-slate-800 text-slate-300 rounded text-[10px] font-mono">Ctrl+V</kbd></span>
          </div>
        </div>

        {/* Viewfinder / Capture Box */}
        <div className="relative min-h-[340px] sm:min-h-[420px] rounded-xl overflow-hidden bg-slate-950 border border-slate-800 flex items-center justify-center">
          {/* CAMERA FEED MODE */}
          {mode === 'camera' && !selectedImage && (
            <div className="relative w-full h-full min-h-[380px] sm:min-h-[440px] flex items-center justify-center bg-black">
              {isCameraActive ? (
                <>
                  <video
                    ref={videoRef}
                    playsInline
                    muted
                    className="w-full h-full object-cover"
                  />
                  {/* Viewfinder Target Framing Brackets */}
                  <div className="absolute inset-8 sm:inset-12 border-2 border-cyan-400/40 rounded-2xl pointer-events-none">
                    {/* Corner accents */}
                    <div className="absolute -top-1 -left-1 w-6 h-6 border-t-4 border-l-4 border-cyan-400 rounded-tl-lg" />
                    <div className="absolute -top-1 -right-1 w-6 h-6 border-t-4 border-r-4 border-cyan-400 rounded-tr-lg" />
                    <div className="absolute -bottom-1 -left-1 w-6 h-6 border-b-4 border-l-4 border-cyan-400 rounded-bl-lg" />
                    <div className="absolute -bottom-1 -right-1 w-6 h-6 border-b-4 border-r-4 border-cyan-400 rounded-br-lg" />
                    {/* Laser Scanner Line Animation */}
                    <div className="w-full h-0.5 bg-gradient-to-r from-transparent via-cyan-400 to-transparent shadow-[0_0_15px_#22d3ee] animate-pulse absolute top-1/2 -translate-y-1/2" />
                  </div>

                  {/* Camera Control Overlays */}
                  <div className="absolute bottom-6 inset-x-0 flex items-center justify-center gap-4 z-20">
                    <button
                      onClick={toggleFacingMode}
                      className="p-3 rounded-full bg-slate-900/80 hover:bg-slate-800 text-slate-300 backdrop-blur-md border border-slate-700 transition-transform active:scale-90"
                      title="Flip Camera"
                    >
                      <RefreshCw className="w-5 h-5" />
                    </button>
                    {/* Giant Shutter Button */}
                    <button
                      onClick={takeSnapshot}
                      className="relative flex items-center justify-center w-18 h-18 rounded-full bg-white text-slate-950 p-1.5 shadow-xl hover:scale-105 active:scale-95 transition-all"
                      title="Capture Document"
                    >
                      <div className="w-full h-full rounded-full border-2 border-slate-900 flex items-center justify-center bg-gradient-to-tr from-cyan-400 to-indigo-500">
                        <Camera className="w-6 h-6 text-white" />
                      </div>
                    </button>
                    <button
                      onClick={() => setMode('upload')}
                      className="p-3 rounded-full bg-slate-900/80 hover:bg-slate-800 text-slate-300 backdrop-blur-md border border-slate-700 transition-transform active:scale-90"
                      title="Upload instead"
                    >
                      <Upload className="w-5 h-5" />
                    </button>
                  </div>
                </>
              ) : (
                <div className="text-center p-6 max-w-sm">
                  <div className="w-14 h-14 rounded-2xl bg-slate-900 border border-slate-800 flex items-center justify-center mx-auto mb-3 text-cyan-400">
                    <Camera className="w-7 h-7" />
                  </div>
                  <h3 className="text-base font-semibold text-white">Starting Live Camera...</h3>
                  <p className="text-xs text-slate-400 mt-1 mb-4">
                    {cameraError || 'Hold any document, receipt, bill, or product label in front of the lens.'}
                  </p>
                  <button
                    onClick={startCamera}
                    className="px-4 py-2 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-semibold"
                  >
                    Allow Camera Permissions
                  </button>
                </div>
              )}
            </div>
          )}

          {/* UPLOAD / DROPZONE MODE (when no image selected) */}
          {mode === 'upload' && !selectedImage && (
            <div
              onDragEnter={handleDrag}
              onDragLeave={handleDrag}
              onDragOver={handleDrag}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              className={`w-full h-full min-h-[360px] sm:min-h-[420px] flex flex-col items-center justify-center p-6 text-center cursor-pointer transition-colors ${
                dragActive ? 'bg-cyan-950/30 border-2 border-dashed border-cyan-400' : 'hover:bg-slate-900/40'
              }`}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleFileChange}
                className="hidden"
              />
              <div className="relative mb-4">
                <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-cyan-500/20 via-indigo-500/20 to-purple-500/20 border border-slate-700 flex items-center justify-center text-cyan-400">
                  <Upload className="w-8 h-8" />
                </div>
                <div className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-indigo-600 text-white flex items-center justify-center text-xs shadow-md">
                  +
                </div>
              </div>
              <h3 className="text-base font-bold text-white mb-1">
                Drop your photo, document, or bill here
              </h3>
              <p className="text-xs text-slate-400 max-w-sm mb-4">
                Supports photos from smartphone camera, screenshots, receipts, nutrition labels, and PDF page snapshots.
              </p>
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-medium text-slate-200 border border-slate-700 transition-colors">
                <ImageIcon className="w-4 h-4 text-cyan-400" />
                <span>Browse Files</span>
              </div>
              <div className="mt-4 text-[11px] text-slate-400 flex items-center gap-2">
                <span>Or simply click here and press <kbd className="px-1.5 py-0.5 rounded bg-slate-800 border border-slate-700 text-slate-300 font-mono">Ctrl+V</kbd></span>
              </div>
            </div>
          )}

          {/* IMAGE PREVIEW (when image is captured or selected) */}
          {selectedImage && (
            <div className="relative w-full h-full min-h-[380px] sm:min-h-[440px] flex items-center justify-center bg-slate-950 p-4">
              <img
                src={selectedImage}
                alt="Scanned preview"
                className="max-h-[400px] w-auto max-w-full object-contain rounded-lg shadow-2xl border border-slate-800"
              />

              {/* Clear / Retake button */}
              <button
                onClick={clearImage}
                className="absolute top-4 right-4 p-2 rounded-full bg-slate-900/90 hover:bg-slate-800 text-slate-300 border border-slate-700 shadow-lg backdrop-blur-md transition-colors"
                title="Remove photo and take new one"
              >
                <X className="w-5 h-5" />
              </button>

              {/* Ready Badge */}
              <div className="absolute bottom-4 left-4 flex items-center gap-2 px-3 py-1.5 rounded-full bg-slate-900/90 border border-emerald-500/40 text-emerald-300 text-xs font-medium backdrop-blur-md">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                <span>Image ready for LifeLens analysis</span>
              </div>
            </div>
          )}
        </div>

        {/* Optional User Note Bar */}
        <div className="mt-4">
          <div className="relative">
            <input
              type="text"
              value={userNotes}
              onChange={(e) => setUserNotes(e.target.value)}
              placeholder="Optional: What specifically puzzles you? (e.g. 'Is the $16 fee standard?' or 'Check peanut allergens')"
              className="w-full bg-slate-950 border border-slate-800 focus:border-cyan-500 rounded-xl px-4 py-2.5 text-xs sm:text-sm text-slate-100 placeholder:text-slate-400 focus:outline-none transition-colors"
            />
            {userNotes && (
              <button
                onClick={() => setUserNotes('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-200"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>

        {/* The Killer Feature: "Help Me Understand" Action Button */}
        <div className="mt-5">
          <button
            onClick={handleSubmit}
            disabled={!selectedImage || isLoading}
            className={`w-full py-4 rounded-xl font-bold text-sm sm:text-base flex items-center justify-center gap-3 transition-all ${
              selectedImage && !isLoading
                ? 'bg-gradient-to-r from-cyan-500 via-indigo-600 to-purple-600 hover:from-cyan-400 hover:to-purple-500 text-white shadow-xl shadow-cyan-500/20 active:scale-[0.99] cursor-pointer'
                : 'bg-slate-800/80 text-slate-400 cursor-not-allowed border border-slate-700/50'
            }`}
          >
            {isLoading ? (
              <>
                <RefreshCw className="w-5 h-5 animate-spin text-cyan-300" />
                <span>LifeLens AI is inspecting every line &amp; clause...</span>
              </>
            ) : (
              <>
                <Sparkles className="w-5 h-5 text-cyan-300" />
                <span>Help Me Understand</span>
                <span className="text-xs bg-white/20 text-white px-2 py-0.5 rounded font-mono">1-Click</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* 3D Spatial AI Dissector Spotlight Banner */}
      {onOpen3D && (
        <div className="mt-8 p-4 rounded-2xl bg-gradient-to-r from-slate-900 via-indigo-950/60 to-slate-900 border border-indigo-700/50 shadow-xl flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-tr from-cyan-500 to-indigo-600 flex items-center justify-center shrink-0 shadow-lg shadow-indigo-500/25">
              <Box className="w-6 h-6 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-white text-sm">3D Spatial AI Dissector</h3>
                <span className="px-1.5 py-0.2 rounded text-[10px] font-mono font-bold bg-cyan-950 text-cyan-300 border border-cyan-700/60">
                  WebGL 60 FPS
                </span>
              </div>
              <p className="text-xs text-slate-300 mt-0.5">
                Understand appliances &amp; meters in exploded 3D: inspect De&apos;Longhi boiler valves, current shunts, and LiDAR sensors.
              </p>
            </div>
          </div>
          <button
            onClick={onOpen3D}
            className="w-full sm:w-auto px-4 py-2 rounded-xl bg-gradient-to-r from-cyan-500 to-indigo-600 hover:from-cyan-400 hover:to-indigo-500 text-slate-950 font-bold text-xs flex items-center justify-center gap-2 shadow-md shadow-cyan-500/20 active:scale-95 transition-all cursor-pointer whitespace-nowrap"
          >
            <Layers className="w-3.5 h-3.5 text-slate-950" />
            <span>Launch 3D Dissector</span>
            <ArrowRight className="w-3.5 h-3.5 text-slate-950" />
          </button>
        </div>
      )}

      {/* Preset Realistic Samples Library */}
      <div className="mt-8">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Zap className="w-4 h-4 text-amber-400" />
            <h2 className="text-sm font-bold text-white uppercase tracking-wider">
              Or Try a Confusing Real-World Example
            </h2>
          </div>
          <span className="text-[11px] text-slate-400">Click any card to test immediately</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {SAMPLE_DOCUMENTS.map((sample) => {
            const isSelected = activeSampleId === sample.id;
            return (
              <button
                key={sample.id}
                onClick={() => handleSelectSample(sample)}
                className={`flex flex-col text-left p-3.5 rounded-xl border transition-all ${
                  isSelected
                    ? 'bg-cyan-950/40 border-cyan-500 ring-1 ring-cyan-500 shadow-md'
                    : 'bg-slate-900/70 hover:bg-slate-800/80 border-slate-800 hover:border-slate-700'
                }`}
              >
                <div className="flex items-start justify-between w-full mb-2">
                  <span className="text-2xl p-1.5 rounded-lg bg-slate-950 border border-slate-800">
                    {sample.thumbnail}
                  </span>
                  <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 border border-slate-700">
                    {sample.badge}
                  </span>
                </div>
                <h3 className="font-bold text-slate-100 text-xs sm:text-sm line-clamp-1">{sample.name}</h3>
                <p className="text-[11px] text-slate-400 mt-1 line-clamp-2 leading-relaxed">
                  {sample.tagline}
                </p>
              </button>
            );
          })}
        </div>
      </div>

      {/* Problem Solver Value Props Footer */}
      <div className="mt-8 p-4 rounded-xl bg-slate-900/40 border border-slate-800/60 flex flex-wrap items-center justify-around gap-4 text-xs text-slate-400">
        <div className="flex items-center gap-2">
          <span className="text-cyan-400 font-bold">✓</span>
          <span>Plain language breakdown</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-cyan-400 font-bold">✓</span>
          <span>Identifies hidden fees &amp; deadlines</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-cyan-400 font-bold">✓</span>
          <span>Bengali (বাংলা) &amp; English support</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-cyan-400 font-bold">✓</span>
          <span>Grounded follow-up Q&amp;A</span>
        </div>
      </div>
    </div>
  );
};
