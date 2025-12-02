import React, { useState, useEffect, useRef, useCallback } from 'react';
import { 
  Printer, 
  Trash2, 
  Upload, 
  Sparkles,
  Youtube,
  FileText,
  Mic,
  MicOff
} from 'lucide-react';
import { MediaCapture } from './components/MediaCapture';
import { refineReportWithAI } from './services/geminiService';
import { ExamType, ExamData, PatientInfo, DoctorInfo, MediaItem } from './types';
import { EXAM_TEMPLATES } from './constants';

function App() {
  // --- State ---
  const [doctor, setDoctor] = useState<DoctorInfo>({
    name: "Dr. João Silva",
    crm: "12345-SP",
    rqe: "9876",
    clinicName: "Clínica Otorrino Avançada",
    address: "Av. Paulista, 1000 - Conj 50 - São Paulo/SP",
    phone: "(11) 99999-9999"
  });

  const [patient, setPatient] = useState<PatientInfo>({
    name: "",
    age: "",
    sex: 'Masculino',
    date: new Date().toLocaleDateString('pt-BR')
  });

  const [currentExam, setCurrentExam] = useState<ExamData>({
    type: ExamType.NASOSSINUSAL,
    ...EXAM_TEMPLATES[ExamType.NASOSSINUSAL]
  });

  const [mediaItems, setMediaItems] = useState<MediaItem[]>([]);
  const [youtubeLink, setYoutubeLink] = useState<string>("");
  const [isUploading, setIsUploading] = useState(false);
  const [isRefining, setIsRefining] = useState(false);
  
  // Dictation State
  const [isListening, setIsListening] = useState(false);
  const recognitionRef = useRef<any>(null);

  // --- Initialization ---

  useEffect(() => {
    // Initialize Speech Recognition
    if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      const recognition = new SpeechRecognition();
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.lang = 'pt-BR';
      
      recognitionRef.current = recognition;
    }
  }, []);

  // --- Handlers ---

  const handleExamChange = (type: ExamType) => {
    setCurrentExam({
      type,
      ...EXAM_TEMPLATES[type]
    });
  };

  const handleMediaCaptured = (item: MediaItem) => {
    setMediaItems(prev => [...prev, item]);
  };

  const handleVideoReady = (localUrl: string) => {
    // In a real app, this would be the raw video file ready to upload
    console.log("Video Recorded at:", localUrl);
  };

  const simulateYoutubeUpload = () => {
    const videoItem = mediaItems.find(m => m.type === 'video');
    if (!videoItem) {
      alert("Nenhum vídeo gravado para enviar.");
      return;
    }
    
    setIsUploading(true);
    // Simulating API latency
    setTimeout(() => {
      // Mock YouTube ID generation
      const mockId = Math.random().toString(36).substring(7);
      const link = `https://youtube.com/watch?v=DEMO_${mockId}_${patient.name.split(' ')[0]}`;
      setYoutubeLink(link);
      setIsUploading(false);
    }, 2500);
  };

  const handleRefineAI = async () => {
    if (!currentExam.findings) return;
    setIsRefining(true);
    try {
      const refinedText = await refineReportWithAI(currentExam.findings, currentExam.type);
      setCurrentExam(prev => ({ ...prev, findings: refinedText }));
    } catch (e) {
      alert("Erro ao conectar com a IA. Verifique sua chave de API.");
    } finally {
      setIsRefining(false);
    }
  };

  const toggleDictation = () => {
    if (!recognitionRef.current) {
      alert("Seu navegador não suporta reconhecimento de fala.");
      return;
    }

    if (isListening) {
      recognitionRef.current.stop();
      setIsListening(false);
    } else {
      recognitionRef.current.start();
      setIsListening(true);
      
      let finalTranscript = '';

      recognitionRef.current.onresult = (event: any) => {
        let interimTranscript = '';
        
        for (let i = event.resultIndex; i < event.results.length; ++i) {
          if (event.results[i].isFinal) {
            finalTranscript += event.results[i][0].transcript + ' ';
            
            // Append final result to state safely
            setCurrentExam(prev => ({
              ...prev,
              findings: (prev.findings + ' ' + event.results[i][0].transcript).replace(/\s+/g, ' ')
            }));
            finalTranscript = ''; // Reset for next sentence
          } else {
            interimTranscript += event.results[i][0].transcript;
          }
        }
      };

      recognitionRef.current.onerror = (event: any) => {
        console.error("Speech recognition error", event.error);
        setIsListening(false);
      };

      recognitionRef.current.onend = () => {
        setIsListening(false);
      };
    }
  };

  const handleDeleteMedia = (id: string) => {
    setMediaItems(prev => prev.filter(item => item.id !== id));
  };

  const handlePrint = () => {
    window.print();
  };

  // --- Components ---

  const Header = () => (
    <header className="border-b-2 border-medical-500 pb-4 mb-6 flex justify-between items-start">
      <div className="flex items-center gap-4">
        {/* Placeholder Logo */}
        <div className="w-20 h-20 bg-medical-600 text-white flex items-center justify-center rounded-lg shadow-sm">
          <svg className="w-12 h-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
          </svg>
        </div>
        <div>
          <h1 className="text-2xl font-bold text-slate-800 uppercase tracking-wide">{doctor.clinicName}</h1>
          <p className="text-sm text-slate-600">{doctor.address}</p>
          <p className="text-sm text-slate-600">Tel: {doctor.phone}</p>
        </div>
      </div>
      <div className="text-right hidden print:block">
        <h2 className="text-xl font-bold text-medical-700">{doctor.name}</h2>
        <p className="text-sm text-slate-600">CRM: {doctor.crm} | RQE: {doctor.rqe}</p>
      </div>
    </header>
  );

  return (
    <div className="min-h-screen flex flex-col md:flex-row bg-slate-100 print:bg-white">
      
      {/* LEFT PANEL: Report Editor (Prints) */}
      <div className="w-full md:w-1/2 lg:w-3/5 p-8 bg-white shadow-lg overflow-y-auto print:w-full print:shadow-none print:p-0 print:overflow-visible">
        
        {/* Actions Bar (Hidden on Print) */}
        <div className="flex justify-between mb-6 print:hidden">
          <h2 className="text-xl font-bold text-slate-700 flex items-center gap-2">
            <FileText className="w-6 h-6" />
            Editor de Laudo
          </h2>
          <button 
            onClick={handlePrint}
            className="bg-medical-600 text-white px-4 py-2 rounded-lg hover:bg-medical-700 flex items-center gap-2 shadow-sm transition"
          >
            <Printer className="w-4 h-4" />
            Imprimir Laudo
          </button>
        </div>

        <div className="max-w-[210mm] mx-auto print:max-w-none">
          <Header />

          {/* Patient Info */}
          <div className="grid grid-cols-12 gap-4 mb-6 bg-slate-50 p-4 rounded-lg border border-slate-200 print:bg-transparent print:border-none print:p-0">
            <div className="col-span-8 print:col-span-8">
              <label className="block text-xs font-bold text-slate-500 uppercase">Nome do Paciente</label>
              <input 
                type="text" 
                value={patient.name}
                onChange={(e) => setPatient({...patient, name: e.target.value})}
                className="w-full bg-transparent border-b border-slate-300 focus:border-medical-500 outline-none py-1 text-lg font-medium placeholder-slate-300"
                placeholder="Nome completo..."
              />
            </div>
            <div className="col-span-2 print:col-span-2">
              <label className="block text-xs font-bold text-slate-500 uppercase">Idade</label>
              <input 
                type="text" 
                value={patient.age}
                onChange={(e) => setPatient({...patient, age: e.target.value})}
                className="w-full bg-transparent border-b border-slate-300 focus:border-medical-500 outline-none py-1"
                placeholder="00 anos"
              />
            </div>
            <div className="col-span-2 print:col-span-2">
              <label className="block text-xs font-bold text-slate-500 uppercase">Sexo</label>
              <select 
                value={patient.sex}
                onChange={(e) => setPatient({...patient, sex: e.target.value as any})}
                className="w-full bg-transparent border-b border-slate-300 focus:border-medical-500 outline-none py-1 appearance-none"
              >
                <option>Masculino</option>
                <option>Feminino</option>
                <option>Outro</option>
              </select>
            </div>
          </div>

          {/* Exam Selector (Hidden on Print if static text is preferred, but here we just show the title) */}
          <div className="mb-6">
             <div className="print:hidden mb-4">
                <label className="block text-sm font-medium text-slate-700 mb-1">Tipo de Exame</label>
                <select 
                  value={currentExam.type}
                  onChange={(e) => handleExamChange(e.target.value as ExamType)}
                  className="w-full p-2 border border-slate-300 rounded-md focus:ring-2 focus:ring-medical-500 outline-none"
                >
                  {Object.values(ExamType).map(t => (
                    <option key={t} value={t}>{t}</option>
                  ))}
                </select>
             </div>
             <h2 className="text-2xl font-bold text-center text-slate-800 uppercase border-b-2 border-slate-200 pb-2 mb-4">
               {currentExam.type}
             </h2>
          </div>

          {/* Exam Body */}
          <div className="space-y-6 text-justify leading-relaxed text-slate-800">
            
            {/* Technique */}
            <div>
              <h3 className="font-bold text-medical-700 uppercase text-sm mb-1">Equipamento e Técnica</h3>
              <textarea 
                value={currentExam.equipment + ' ' + currentExam.preparation}
                onChange={(e) => setCurrentExam({...currentExam, equipment: e.target.value})}
                className="w-full resize-none overflow-hidden bg-transparent outline-none focus:bg-yellow-50 transition p-1 rounded"
                rows={2}
              />
            </div>

            {/* Findings */}
            <div className="relative group">
              <div className="flex justify-between items-center mb-1">
                <div className="flex items-center gap-3">
                  <h3 className="font-bold text-medical-700 uppercase text-sm">Descrição dos Achados</h3>
                  
                  {/* Dictation Button */}
                  <button
                    onClick={toggleDictation}
                    className={`print:hidden flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-bold transition ${
                      isListening 
                        ? 'bg-red-100 text-red-600 animate-pulse ring-2 ring-red-400' 
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    }`}
                    title={isListening ? "Parar Ditado" : "Iniciar Ditado"}
                  >
                    {isListening ? <Mic className="w-3 h-3" /> : <MicOff className="w-3 h-3" />}
                    {isListening ? "Ouvindo..." : "Ditar"}
                  </button>
                </div>
                
                {/* AI Button */}
                <button 
                  onClick={handleRefineAI}
                  disabled={isRefining}
                  className="print:hidden text-xs bg-indigo-100 text-indigo-700 px-2 py-1 rounded hover:bg-indigo-200 flex items-center gap-1 transition"
                  title="Melhorar texto com Inteligência Artificial"
                >
                  <Sparkles className="w-3 h-3" />
                  {isRefining ? 'Refinando...' : 'Refinar com IA'}
                </button>
              </div>
              <textarea 
                value={currentExam.findings}
                onChange={(e) => setCurrentExam({...currentExam, findings: e.target.value})}
                className="w-full min-h-[150px] resize-y bg-transparent outline-none border border-transparent focus:border-slate-300 focus:bg-yellow-50 transition p-2 rounded"
                placeholder="Digite ou dite os achados do exame aqui..."
              />
            </div>

            {/* Conclusion */}
            <div>
              <h3 className="font-bold text-medical-700 uppercase text-sm mb-1">Conclusão</h3>
              <textarea 
                value={currentExam.conclusion}
                onChange={(e) => setCurrentExam({...currentExam, conclusion: e.target.value})}
                className="w-full font-bold resize-none bg-transparent outline-none focus:bg-yellow-50 transition p-1 rounded"
                rows={2}
              />
            </div>
          </div>

          {/* Signature */}
          <div className="mt-16 flex justify-center">
            <div className="text-center border-t border-slate-400 px-12 pt-2">
              <p className="font-bold text-slate-900">{doctor.name}</p>
              <p className="text-sm text-slate-600">CRM {doctor.crm} | RQE {doctor.rqe}</p>
            </div>
          </div>

          {/* Attachments Section */}
          <div className="mt-8 page-break-inside-avoid">
            <h3 className="font-bold text-slate-400 uppercase text-xs border-b border-slate-200 mb-4 pb-1">Imagens do Exame</h3>
            
            {/* Image Grid */}
            <div className="grid grid-cols-2 gap-4">
              {mediaItems.filter(m => m.type === 'image').map((item, index) => (
                <div key={item.id} className="relative aspect-video bg-black rounded overflow-hidden border border-slate-200 print:border-none">
                  <img src={item.url} alt={`Captura ${index + 1}`} className="w-full h-full object-contain" />
                  <button 
                    onClick={() => handleDeleteMedia(item.id)}
                    className="absolute top-2 right-2 bg-red-500 text-white p-1 rounded-full opacity-0 hover:opacity-100 transition print:hidden"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>

            {/* Video / QR Code Section */}
            {youtubeLink && (
              <div className="mt-6 flex items-center gap-6 border-t border-slate-200 pt-6">
                <div className="w-32 h-32 bg-white p-1 border border-slate-200">
                  <img 
                    src={`https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent(youtubeLink)}`} 
                    alt="QR Code do Vídeo" 
                    className="w-full h-full"
                  />
                </div>
                <div>
                  <h4 className="font-bold text-slate-800 flex items-center gap-2">
                    <Youtube className="w-5 h-5 text-red-600" />
                    Vídeo do Exame Disponível
                  </h4>
                  <p className="text-sm text-slate-600 max-w-sm mt-1">
                    Aponte a câmera do seu celular para o QR Code ao lado para assistir ao vídeo completo do exame armazenado em nuvem segura.
                  </p>
                  <p className="text-xs text-slate-400 mt-2 font-mono">{youtubeLink}</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* RIGHT PANEL: Capture Interface (Hidden on Print) */}
      <div className="w-full md:w-1/2 lg:w-2/5 bg-slate-900 p-4 flex flex-col gap-4 print:hidden h-screen md:sticky md:top-0">
        <h2 className="text-white font-bold text-lg flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse"></div>
          Captura em Tempo Real
        </h2>
        
        {/* The Camera Component */}
        <div className="flex-1 min-h-[400px]">
          <MediaCapture 
            onMediaCaptured={handleMediaCaptured}
            onVideoUrlReady={(url) => {
               // When video is stopped, we assume it's ready for "upload"
               console.log("Video ready", url);
            }}
          />
        </div>

        {/* Media Management / Upload */}
        <div className="bg-slate-800 rounded-lg p-4">
          <h3 className="text-slate-300 text-sm font-bold uppercase mb-3">Gerenciar Gravação</h3>
          
          <div className="flex flex-col gap-3">
            {mediaItems.some(m => m.type === 'video') ? (
              <div className="flex items-center justify-between bg-slate-700 p-3 rounded">
                <div className="flex items-center gap-3 text-white">
                  <Youtube className="w-6 h-6 text-red-500" />
                  <span className="text-sm">Vídeo Gravado ({mediaItems.filter(m => m.type === 'video').length})</span>
                </div>
                
                {!youtubeLink ? (
                  <button 
                    onClick={simulateYoutubeUpload}
                    disabled={isUploading}
                    className="bg-blue-600 hover:bg-blue-500 text-white px-3 py-1.5 rounded text-sm font-medium flex items-center gap-2 transition disabled:opacity-50"
                  >
                    {isUploading ? (
                      <>Processing...</>
                    ) : (
                      <>
                        <Upload className="w-4 h-4" />
                        Gerar Link/QR
                      </>
                    )}
                  </button>
                ) : (
                  <span className="text-green-400 text-sm font-bold flex items-center gap-1">
                    Link Gerado ✓
                  </span>
                )}
              </div>
            ) : (
              <p className="text-slate-500 text-sm italic">Nenhum vídeo gravado ainda.</p>
            )}
          </div>
        </div>
        
        {/* Mini Gallery of recent snapshots */}
        <div className="bg-slate-800 rounded-lg p-4 overflow-hidden">
             <h3 className="text-slate-300 text-sm font-bold uppercase mb-3">Fotos ({mediaItems.filter(m => m.type === 'image').length})</h3>
             <div className="flex gap-2 overflow-x-auto pb-2 custom-scrollbar">
                {mediaItems.filter(m => m.type === 'image').map((item) => (
                  <div key={item.id} className="w-24 h-24 flex-shrink-0 relative group">
                    <img src={item.url} className="w-full h-full object-cover rounded border border-slate-600" />
                    <button 
                      onClick={() => handleDeleteMedia(item.id)}
                      className="absolute inset-0 bg-black/50 hidden group-hover:flex items-center justify-center text-white"
                    >
                      <Trash2 className="w-5 h-5" />
                    </button>
                  </div>
                ))}
             </div>
        </div>

      </div>
    </div>
  );
}

export default App;