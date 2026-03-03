
import React, { useState, useCallback } from 'react';
import { 
  RefreshCw, 
  UploadCloud, 
  Wand2, 
  Image as ImageIcon, 
  AlertTriangle, 
  Clipboard, 
  X, 
  Terminal,
  Cpu,
  Zap,
  Layers,
  Settings2,
  Power,
  Copy
} from 'lucide-react';
import { synthesizeImage } from './services/geminiService';
import { ImageState, AppStatus } from './types';

const App: React.FC = () => {
  const [prompt, setPrompt] = useState('Enhance this image with high-contrast cyberpunk neon aesthetics and subtle glitch artifacts.');
  const [sourceImage, setSourceImage] = useState<ImageState>({ file: null, preview: null });
  
  // Overlay States
  const [overlayImage, setOverlayImage] = useState<ImageState>({ file: null, preview: null });
  const [useOverlay, setUseOverlay] = useState(false);
  const [intensity, setIntensity] = useState(50);

  const [result, setResult] = useState<{ imageUrl: string | null; text: string | null }>({ imageUrl: null, text: null });
  const [status, setStatus] = useState<AppStatus>(AppStatus.IDLE);
  const [error, setError] = useState<string | null>(null);

  const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = (err) => reject(err);
      reader.readAsDataURL(file);
    });
  };

  const processFile = useCallback(async (file: File, type: 'source' | 'overlay') => {
    if (!file.type.startsWith('image/')) {
      setError('INVALID_MIME_TYPE: EXPECTED IMAGE/*');
      setStatus(AppStatus.ERROR);
      return;
    }

    try {
      const base64 = await fileToBase64(file);
      if (type === 'source') {
        setSourceImage({ file, preview: base64 });
      } else {
        setOverlayImage({ file, preview: base64 });
      }
      setError(null);
    } catch (err) {
      setError('BUFFER_ENCODING_FAILURE');
      setStatus(AppStatus.ERROR);
    }
  }, []);

  const injectFromClipboard = async (type: 'source' | 'overlay') => {
    try {
      const clipboardItems = await navigator.clipboard.read();
      for (const item of clipboardItems) {
        for (const mimeType of item.types) {
          if (mimeType.startsWith('image/')) {
            const blob = await item.getType(mimeType);
            const file = new File([blob], `clipboard_image.${mimeType.split('/')[1]}`, { type: mimeType });
            await processFile(file, type);
            return;
          }
        }
      }
      setError('CLIPBOARD_EMPTY: NO IMAGE DATA DETECTED');
    } catch (err: any) {
      setError(`CLIPBOARD_ACCESS_DENIED: ${err.message || 'CHECK BROWSER PERMISSIONS'}`);
    }
  };

  const runSynthesis = async () => {
    if (!sourceImage.file || !sourceImage.preview) {
      setError('SOURCE_NULL: ATTACH IMAGE DATA');
      return;
    }
    if (useOverlay && (!overlayImage.file || !overlayImage.preview)) {
      setError('OVERLAY_NULL: ATTACH OVERLAY DATA OR DISABLE MODULE');
      return;
    }

    setStatus(AppStatus.LOADING);
    setError(null);

    try {
      const primaryData = {
        buffer: sourceImage.preview.split(',')[1],
        mimeType: sourceImage.file.type
      };

      const overlayConfig = useOverlay ? {
        data: {
          buffer: overlayImage.preview!.split(',')[1],
          mimeType: overlayImage.file!.type
        },
        intensity: intensity
      } : undefined;
      
      const output = await synthesizeImage(prompt, primaryData, overlayConfig);
      setResult(output);
      setStatus(AppStatus.SUCCESS);
    } catch (err: any) {
      console.error(err);
      setError(`SYNTH_FAULT: ${err.message || 'UNEXPECTED ERROR'}`);
      setStatus(AppStatus.ERROR);
    }
  };

  return (
    <div 
      className="min-h-screen p-4 md:p-8 flex flex-col items-center justify-center relative overflow-hidden text-emerald-500 selection:bg-emerald-500 selection:text-black font-mono"
      onPaste={(e) => {
          // Default global paste targets primary source
          const file = e.clipboardData.items[0]?.getAsFile();
          if (file) processFile(file, 'source');
      }}
    >
      <div className="fixed inset-0 pointer-events-none opacity-[0.03] bg-[radial-gradient(circle_at_center,_#10b981_0%,_transparent_70%)]"></div>

      <div className="w-full max-w-7xl bg-black border border-emerald-900 shadow-[0_0_50px_rgba(16,185,129,0.1)] relative z-10 flex flex-col">
        {/* Header Bar */}
        <header className="border-b border-emerald-900 p-4 flex justify-between items-center bg-[#050505]">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-emerald-900/30 border border-emerald-800 rounded">
              <Zap className="w-5 h-5 text-emerald-400" />
            </div>
            <div>
              <h1 className="text-2xl font-bold tracking-tighter leading-none">GLORP POTION <span className="text-emerald-700">V.0.2.1</span></h1>
              <p className="text-[10px] uppercase tracking-widest text-emerald-700">Status: {status} | Mode: {useOverlay ? 'HYBRID' : 'SINGLE'}</p>
            </div>
          </div>
          <div className="hidden md:flex items-center gap-4 text-[12px] opacity-40">
            <div className="flex items-center gap-1"><Cpu className="w-3 h-3" /> CORE: GEMINI-2.5-FLASH</div>
            <div className="flex items-center gap-1"><Terminal className="w-3 h-3" /> CLIPBOARD: READY</div>
          </div>
        </header>

        {error && (
          <div className="bg-red-950/20 border-b border-red-900 p-3 flex items-center gap-3 text-red-500 text-xs font-mono animate-pulse">
            <AlertTriangle className="w-4 h-4" />
            <span>[CRITICAL ERROR]: {error}</span>
            <button onClick={() => setError(null)} className="ml-auto hover:text-red-300">
                <X className="w-4 h-4" />
            </button>
          </div>
        )}

        <main className="grid grid-cols-1 lg:grid-cols-12 gap-0 min-h-[700px]">
          {/* Left Column: Input Panels */}
          <div className="lg:col-span-5 border-r border-emerald-900 p-6 space-y-6 bg-[#020202] overflow-y-auto max-h-[calc(100vh-160px)] custom-scrollbar">
            
            {/* Primary Source */}
            <section className="space-y-3">
              <div className="flex justify-between items-center">
                <h3 className="text-xs font-bold uppercase tracking-[0.2em] text-emerald-700 flex items-center gap-2">
                  <ImageIcon className="w-3 h-3" /> 01_Source_Buffer
                </h3>
                <button 
                  onClick={() => injectFromClipboard('source')}
                  className="flex items-center gap-1.5 px-2 py-0.5 text-[9px] uppercase font-bold text-emerald-500 border border-emerald-900/50 hover:border-emerald-500 hover:bg-emerald-500/10 transition-all"
                >
                  <Clipboard className="w-3 h-3" />
                  [Inject_Clipboard]
                </button>
              </div>
              
              <div className="relative group">
                <label className="block w-full aspect-video border border-emerald-900/50 rounded cursor-pointer hover:border-emerald-500 hover:bg-emerald-950/10 transition-all overflow-hidden bg-black/40">
                  <input type="file" accept="image/*" onChange={(e) => e.target.files?.[0] && processFile(e.target.files[0], 'source')} className="hidden" />
                  {sourceImage.preview ? (
                    <img src={sourceImage.preview} alt="Source" className="w-full h-full object-cover opacity-70 group-hover:opacity-100 transition-opacity" />
                  ) : (
                    <div className="absolute inset-0 flex flex-col items-center justify-center p-6 text-emerald-900">
                      <UploadCloud className="w-8 h-8 mb-2 opacity-20" />
                      <p className="text-[10px] font-bold uppercase tracking-widest">Awaiting Main Data</p>
                    </div>
                  )}
                </label>
              </div>
            </section>

            {/* Overlay Module */}
            <section className={`p-4 border transition-all duration-300 ${useOverlay ? 'border-emerald-500 bg-emerald-950/5 shadow-[inset_0_0_20px_rgba(16,185,129,0.05)]' : 'border-emerald-900/30 opacity-50 bg-black'}`}>
              <div className="flex justify-between items-center mb-4">
                <h3 className={`text-xs font-bold uppercase tracking-[0.2em] flex items-center gap-2 ${useOverlay ? 'text-emerald-400' : 'text-emerald-800'}`}>
                  <Layers className="w-3 h-3" /> 01.5_Overlay_Module
                </h3>
                <button 
                  onClick={() => setUseOverlay(!useOverlay)}
                  className={`flex items-center gap-2 px-2 py-1 rounded border text-[10px] uppercase font-bold transition-all ${
                    useOverlay ? 'bg-emerald-500 text-black border-emerald-400' : 'bg-black text-emerald-900 border-emerald-900'
                  }`}
                >
                  <Power className="w-3 h-3" />
                  {useOverlay ? 'Module_Online' : 'Module_Offline'}
                </button>
              </div>

              {useOverlay && (
                <div className="space-y-4 animate-in fade-in slide-in-from-top-2 duration-300">
                  <div className="flex justify-between items-center">
                    <span className="text-[9px] uppercase text-emerald-800 tracking-widest font-bold">Texture_Buffer</span>
                    <button 
                      onClick={() => injectFromClipboard('overlay')}
                      className="flex items-center gap-1.5 px-2 py-0.5 text-[9px] uppercase font-bold text-emerald-400 border border-emerald-700/50 hover:bg-emerald-500/10 transition-all"
                    >
                      <Copy className="w-3 h-3" />
                      [Sync_Clipboard]
                    </button>
                  </div>
                  <div className="relative group">
                    <label className="block w-full aspect-[21/9] border border-emerald-900/50 rounded cursor-pointer hover:border-emerald-400 bg-black/60 overflow-hidden">
                      <input type="file" accept="image/*" onChange={(e) => e.target.files?.[0] && processFile(e.target.files[0], 'overlay')} className="hidden" />
                      {overlayImage.preview ? (
                        <img src={overlayImage.preview} alt="Overlay" className="w-full h-full object-cover opacity-70 group-hover:opacity-100" />
                      ) : (
                        <div className="absolute inset-0 flex flex-col items-center justify-center p-4 text-emerald-900">
                          <UploadCloud className="w-6 h-6 mb-1" />
                          <p className="text-[10px] uppercase">Upload Texture</p>
                        </div>
                      )}
                    </label>
                  </div>

                  <div className="space-y-2">
                    <div className="flex justify-between text-[10px] uppercase tracking-widest text-emerald-700">
                      <span className="flex items-center gap-1"><Settings2 className="w-3 h-3" /> Splicing_Intensity</span>
                      <span className="text-emerald-400">{intensity}%</span>
                    </div>
                    <input 
                      type="range" 
                      min="0" 
                      max="100" 
                      value={intensity} 
                      onChange={(e) => setIntensity(parseInt(e.target.value))}
                      className="w-full h-1 bg-emerald-900 rounded-lg appearance-none cursor-pointer accent-emerald-500"
                    />
                  </div>
                </div>
              )}
            </section>

            {/* Prompt Config */}
            <section className="space-y-4">
              <div className="flex justify-between items-end">
                <h3 className="text-xs font-bold uppercase tracking-[0.2em] text-emerald-700">02_Potion_Config</h3>
              </div>
              <textarea
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                placeholder="ENTER TRANSFORMATION SCRIPTS..."
                rows={3}
                className="w-full bg-black border border-emerald-900 p-4 text-emerald-400 text-sm font-mono placeholder-emerald-950 focus:outline-none focus:border-emerald-500 transition-colors resize-none"
              />

              <button
                onClick={runSynthesis}
                disabled={status === AppStatus.LOADING || !sourceImage.preview}
                className={`w-full py-4 transition-all flex items-center justify-center gap-3 font-bold uppercase tracking-widest text-sm border shadow-lg ${
                  status === AppStatus.LOADING 
                  ? 'bg-emerald-950/20 text-emerald-800 border-emerald-900 cursor-wait' 
                  : 'bg-emerald-500 text-black border-emerald-400 hover:bg-emerald-400 active:scale-[0.98]'
                }`}
              >
                {status === AppStatus.LOADING ? (
                  <RefreshCw className="w-5 h-5 animate-spin" />
                ) : (
                  <Wand2 className="w-5 h-5" />
                )}
                <span>{status === AppStatus.LOADING ? 'Processing...' : 'Activate Potion'}</span>
              </button>
            </section>
          </div>

          {/* Right Column: Results Display */}
          <div className="lg:col-span-7 p-6 flex flex-col space-y-4 bg-black relative">
             <div className="flex justify-between items-end border-b border-emerald-900 pb-2">
                <h3 className="text-xs font-bold uppercase tracking-[0.2em] text-emerald-700">03_Result_Matrix</h3>
                <div className="flex gap-2 items-center">
                    <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></div>
                    <span className="text-[9px] uppercase text-emerald-700">Display_Out</span>
                </div>
             </div>

             <div className="flex-grow flex items-center justify-center relative border border-emerald-950 bg-[#050505] overflow-hidden">
                <div className="absolute inset-0 opacity-[0.05] bg-[linear-gradient(#10b981_1px,transparent_1px),linear-gradient(90deg,#10b981_1px,transparent_1px)] bg-[length:40px_40px]"></div>
                
                {status === AppStatus.LOADING ? (
                    <div className="relative z-10 flex flex-col items-center gap-4">
                        <div className="w-12 h-12 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin"></div>
                        <div className="text-emerald-500 text-[10px] tracking-[0.4em] animate-pulse">RECONSTRUCTING_DATA</div>
                    </div>
                ) : result.imageUrl ? (
                    <div className="relative w-full h-full p-4 flex flex-col items-center">
                        <img 
                            src={result.imageUrl} 
                            alt="Result" 
                            className="max-w-full max-h-[500px] object-contain rounded shadow-[0_0_40px_rgba(16,185,129,0.1)]"
                        />
                        {result.text && (
                            <div className="mt-4 p-4 bg-emerald-950/5 border border-emerald-900/50 w-full text-[11px] text-emerald-500 font-mono whitespace-pre-wrap">
                                <span className="text-emerald-800">[LOGS]:</span> {result.text}
                            </div>
                        )}
                        <a 
                            href={result.imageUrl} 
                            download="glorp_output.png"
                            className="absolute bottom-6 right-6 p-4 bg-emerald-500 text-black rounded-none hover:bg-emerald-400 transition-all shadow-[4px_4px_0_rgba(0,0,0,1)] hover:translate-x-[-2px] hover:translate-y-[-2px]"
                        >
                            <UploadCloud className="w-5 h-5 rotate-180" />
                        </a>
                    </div>
                ) : (
                    <div className="opacity-10 flex flex-col items-center gap-3">
                        <Terminal className="w-16 h-16" />
                        <span className="text-xs uppercase tracking-[0.5em]">System_Idle</span>
                    </div>
                )}
             </div>

             <footer className="text-[9px] text-emerald-900 font-mono flex justify-between items-center px-2">
                <span>BUFFER_STATUS: STABLE</span>
                <span>UUID: {Math.random().toString(36).substring(7).toUpperCase()}</span>
             </footer>
          </div>
        </main>
      </div>

      <div className="mt-6 flex flex-col items-center gap-1 opacity-20 text-[10px] uppercase tracking-widest">
         <p>© 2025 GLORP CYBERNETICS - POTION V.2.1</p>
      </div>
    </div>
  );
};

export default App;
