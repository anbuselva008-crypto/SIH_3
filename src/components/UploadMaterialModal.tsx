import { useState, useRef, type DragEvent, type ChangeEvent } from 'react';
import {
  X,
  Upload,
  FileText,
  CheckCircle2,
  AlertCircle,
  Sparkles,
  ArrowRight,
  Shield,
  Layers
} from 'lucide-react';
import type { LearningMaterial, Quiz } from '../types/index.ts';
import { uploadLearningMaterial, generateQuizFromMaterial } from '../services/api.ts';

interface UploadMaterialModalProps {
  learnerId: number;
  learningResourceId?: number;
  resourceTitle?: string;
  onClose: () => void;
  onMaterialUploaded?: (material: LearningMaterial) => void;
  onQuizGenerated?: (quiz: Quiz) => void;
}

export default function UploadMaterialModal({
  learnerId,
  learningResourceId,
  resourceTitle,
  onClose,
  onMaterialUploaded,
  onQuizGenerated,
}: UploadMaterialModalProps) {
  const [dragActive, setDragActive] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [uploadedMaterial, setUploadedMaterial] = useState<LearningMaterial | null>(null);
  const [sectionCount, setSectionCount] = useState<number>(0);

  // Quick generation from uploaded document
  const [questionCount, setQuestionCount] = useState<5 | 10 | 15>(10);
  const [isGeneratingQuiz, setIsGeneratingQuiz] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDrag = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      validateAndSetFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      validateAndSetFile(e.target.files[0]);
    }
  };

  const validateAndSetFile = (file: File) => {
    setUploadError(null);
    const ext = file.name.split('.').pop()?.toLowerCase() || '';
    if (!['pdf', 'pptx', 'docx', 'txt'].includes(ext)) {
      setUploadError(`Unsupported format ".${ext}". Allowed: PDF, PPTX, DOCX, TXT.`);
      return;
    }
    const MAX_SIZE = 15 * 1024 * 1024;
    if (file.size > MAX_SIZE) {
      setUploadError(`File is too large (${(file.size / 1024 / 1024).toFixed(1)}MB). Limit is 15MB.`);
      return;
    }
    setSelectedFile(file);
  };

  const handleUpload = async () => {
    if (!selectedFile) return;
    setIsUploading(true);
    setUploadError(null);

    try {
      const res = await uploadLearningMaterial(selectedFile, learnerId, learningResourceId);
      setUploadedMaterial(res.material);
      setSectionCount(res.chunk_count || res.material.page_or_section_count || 1);
      if (onMaterialUploaded) {
        onMaterialUploaded(res.material);
      }
    } catch (err: any) {
      console.error('Upload failed:', err);
      setUploadError(err.message || 'Failed to process and index learning material.');
    } finally {
      setIsUploading(false);
    }
  };

  const handleGenerateQuizNow = async () => {
    if (!uploadedMaterial) return;
    setIsGeneratingQuiz(true);
    setUploadError(null);

    try {
      const quiz = await generateQuizFromMaterial(uploadedMaterial.id, questionCount, learnerId);
      if (onQuizGenerated) {
        onQuizGenerated(quiz);
      }
      onClose();
    } catch (err: any) {
      console.error('Quiz generation failed:', err);
      setUploadError(err.message || 'Failed to generate quiz. Please try again.');
    } finally {
      setIsGeneratingQuiz(false);
    }
  };

  return (
    <div
      id="upload-material-modal"
      className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
    >
      <div className="bg-white rounded-xl shadow-2xl max-w-xl w-full overflow-hidden border border-slate-200 animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="bg-slate-900 text-white p-5 border-b border-slate-800 flex items-start justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="px-2 py-0.5 rounded text-xs font-bold bg-blue-500/20 text-blue-300 border border-blue-400/30">
                Learning Material Intelligence
              </span>
              {resourceTitle && (
                <span className="px-2 py-0.5 rounded text-xs text-slate-300 bg-slate-800 border border-slate-700 truncate max-w-[200px]">
                  Course: {resourceTitle}
                </span>
              )}
            </div>
            <h3 className="text-lg font-bold text-white">
              Upload Official Learning Document
            </h3>
          </div>
          <button
            onClick={onClose}
            className="text-white/70 hover:text-white p-1 rounded-lg hover:bg-white/10 transition-colors cursor-pointer"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 space-y-5">
          {uploadError && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-lg text-rose-800 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
              <span>{uploadError}</span>
            </div>
          )}

          {!uploadedMaterial ? (
            /* Upload Zone */
            <div className="space-y-4">
              <div
                onDragEnter={handleDrag}
                onDragLeave={handleDrag}
                onDragOver={handleDrag}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
                className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-colors ${
                  dragActive
                    ? 'border-blue-500 bg-blue-50/50'
                    : 'border-slate-300 hover:border-blue-400 bg-slate-50/50 hover:bg-blue-50/20'
                }`}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".pdf,.pptx,.docx,.txt,application/pdf,application/vnd.openxmlformats-officedocument.presentationml.presentation,application/vnd.openxmlformats-officedocument.wordprocessingml.document,text/plain"
                  onChange={handleFileChange}
                  className="hidden"
                />

                <div className="flex flex-col items-center justify-center space-y-2">
                  <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center text-blue-700">
                    <Upload className="w-6 h-6" />
                  </div>
                  <p className="text-sm font-semibold text-slate-800">
                    {selectedFile ? selectedFile.name : 'Click to select or drag and drop document'}
                  </p>
                  <p className="text-xs text-slate-500">
                    Supported Formats: PDF, PPTX, DOCX, TXT (Max 15MB)
                  </p>
                </div>
              </div>

              {/* Selected File Details */}
              {selectedFile && (
                <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg flex items-center justify-between">
                  <div className="flex items-center gap-2 text-xs">
                    <FileText className="w-4 h-4 text-blue-600" />
                    <div>
                      <p className="font-semibold text-slate-900 truncate max-w-xs">{selectedFile.name}</p>
                      <p className="text-slate-500">{(selectedFile.size / 1024).toFixed(0)} KB</p>
                    </div>
                  </div>
                  <button
                    onClick={() => setSelectedFile(null)}
                    className="text-xs text-rose-600 hover:text-rose-800 font-semibold cursor-pointer"
                  >
                    Remove
                  </button>
                </div>
              )}

              {/* Security Safeguard Callout */}
              <div className="flex items-start gap-2 p-3 rounded-lg bg-blue-50/60 border border-blue-100 text-xs text-blue-900">
                <Shield className="w-4 h-4 text-blue-700 shrink-0 mt-0.5" />
                <span>
                  <strong>Official MoSPI Document Security:</strong> Files are parsed strictly in-memory on the backend pipeline. All generated practice quizzes are strictly grounded in the document text.
                </span>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 rounded-lg border border-slate-300 text-slate-700 hover:bg-slate-100 text-xs font-semibold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleUpload}
                  disabled={!selectedFile || isUploading}
                  className="px-5 py-2 rounded-lg bg-blue-700 hover:bg-blue-800 disabled:bg-slate-300 text-white text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer shadow-xs"
                >
                  {isUploading ? (
                    <>
                      <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      Parsing & Indexing...
                    </>
                  ) : (
                    <>
                      <Upload className="w-3.5 h-3.5" />
                      Process & Index Material
                    </>
                  )}
                </button>
              </div>
            </div>
          ) : (
            /* Upload Success & Instant Quiz Generation Option */
            <div className="space-y-5 animate-in fade-in">
              <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-900 flex items-start gap-3">
                <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
                <div className="space-y-1 text-xs">
                  <p className="font-bold text-emerald-950 text-sm">
                    Material Processed & Indexed Successfully!
                  </p>
                  <p className="text-emerald-800">
                    File: <strong>{uploadedMaterial.original_filename}</strong> ({uploadedMaterial.file_type.toUpperCase()})
                  </p>
                  <p className="text-emerald-700 flex items-center gap-1.5 mt-1">
                    <Layers className="w-3.5 h-3.5" />
                    <span>{sectionCount} sections / pages extracted and indexed.</span>
                  </p>
                </div>
              </div>

              {/* Generate AI Quiz Section */}
              <div className="border border-slate-200 rounded-xl p-4 bg-slate-50/70 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-amber-500" />
                    <span className="text-xs font-bold text-slate-900">
                      Generate Practice Quiz from this Document
                    </span>
                  </div>
                  <span className="text-xs text-slate-500 font-medium">
                    Grounded with Groq
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <span className="text-xs text-slate-600">Question Count:</span>
                  {[5, 10, 15].map((count) => (
                    <button
                      key={count}
                      type="button"
                      onClick={() => setQuestionCount(count as 5 | 10 | 15)}
                      className={`px-2.5 py-1 rounded text-xs font-bold cursor-pointer transition-colors ${
                        questionCount === count
                          ? 'bg-blue-700 text-white'
                          : 'bg-white text-slate-700 border border-slate-300 hover:bg-slate-100'
                      }`}
                    >
                      {count} Questions
                    </button>
                  ))}
                </div>

                <button
                  type="button"
                  onClick={handleGenerateQuizNow}
                  disabled={isGeneratingQuiz}
                  className="w-full mt-2 py-2.5 px-4 rounded-lg bg-gradient-to-r from-blue-700 to-indigo-700 hover:from-blue-800 hover:to-indigo-800 disabled:opacity-50 text-white text-xs font-bold flex items-center justify-center gap-2 cursor-pointer shadow-xs transition-colors"
                >
                  {isGeneratingQuiz ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      Generating Grounded Questions with Groq...
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-4 h-4 text-amber-300" />
                      Generate AI Practice Quiz Now
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>
              </div>

              <div className="flex justify-end pt-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 rounded-lg border border-slate-300 text-slate-700 hover:bg-slate-100 text-xs font-semibold cursor-pointer"
                >
                  Done
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
