import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { BASE_API_URL } from "./constants";

function UploadPage() {
  const [files, setFiles] = useState({
    resume: null,
    candidates: null,
    courseInfo: null,
    courseLink: "",
  });

  const [uploadComplete, setUploadComplete] = useState(false);
  const [loadingState, setLoadingState] = useState({
    isActive: false,
    type: "",
    message: "",
    error: null,
  });

  const navigate = useNavigate();
  const allowedFormats = [".xlsx", ".csv", ".pdf", ".zip"];

  const handleFile = (fileList, type) => {
    const file = fileList[0];
    if (file && allowedFormats.some(ext => file.name.toLowerCase().endsWith(ext))) {
      setFiles(prev => ({ ...prev, [type]: file }));
    } else {
      alert("Invalid file format. Please upload Excel, CSV, PDF, or ZIP files.");
    }
  };

  const handleFileUpload = async () => {
    const formData = new FormData();
    Object.entries(files).forEach(([key, file]) => {
      if (file && key !== "courseLink") {
        formData.append(key, file);
      }
    });

    // ✅ 링크가 입력된 경우에만 추가
    if (files.courseLink?.trim()) {
      formData.append("courseLink", files.courseLink.trim());
    }

    try {
      setLoadingState({
        isActive: true,
        type: "upload",
        message: "Uploading files...",
        error: null,
      });

      const response = await fetch(`${BASE_API_URL}/api/process/`, {
        method: "POST",
        body: formData,
      });

      const result = await response.json();
      if (response.ok) {
        alert("Files uploaded successfully!");
        setUploadComplete(true);
        setLoadingState({ isActive: false, type: "", message: "", error: null });
      } else {
        throw new Error(result.error || "Upload failed.");
      }
    } catch (error) {
      setLoadingState({
        isActive: true,
        type: "upload",
        message: "Upload failed.",
        error: error.message,
      });
    }
  };

  const handleStartAssignment = async () => {
    try {
      setLoadingState({
        isActive: true,
        type: "assign",
        message: "Processing assignment...",
        error: null,
      });

      const response = await fetch(`${BASE_API_URL}/api/start-matching/`, {
        method: "POST",
      });

      const result = await response.json();
      if (response.ok) {
        setLoadingState({ isActive: false, type: "", message: "", error: null });
        navigate("/display");
      } else {
        throw new Error(result.error || "Processing failed.");
      }
    } catch (error) {
      setLoadingState({
        isActive: true,
        type: "assign",
        message: "Processing failed.",
        error: error.message,
      });
    }
  };

  const handleCancel = () => {
    setLoadingState({ isActive: false, type: "", message: "", error: null });
  };

  const handleContinueAnyway = () => {
    setLoadingState({ isActive: false, type: "", message: "", error: null });
    if (loadingState.type === "upload") {
      setUploadComplete(true);
    } else if (loadingState.type === "assign") {
      navigate("/display");
    }
  };

  return (
    
  <div className="relative w-screen min-h-screen bg-white overflow-hidden">
    {/* 아래쪽 보라색 배경 */}
    <div className="absolute bottom-0 w-full h-[140px] bg-[#3235da]"></div>

    {/* 가운데 Upload 카드 */}
    <div className="relative z-10 w-full flex items-center justify-center min-h-screen">
    <div className="w-full max-w-4xl bg-white p-10 flex flex-col gap-8 rounded-2xl shadow-2xl">
      {/* 타이틀 */}
        <div className="border-l-4 border-blue-600 pl-4">
          <h1 className="text-4xl font-extrabold text-gray-800 leading-snug tracking-tight">Upload File</h1>
          <p className="text-gray-500 text-sm mt-1">Submit resumes, candidate list, and course info.</p>
        </div>

        {/* 업로드 섹션들 */}
        {[{ label: "Upload Resumes", type: "resume", note: "Supported: ZIP of PDFs" }, { label: "Upload Candidates", type: "candidates", note: "Supported: Excel, CSV, PDF" }, { label: "Upload Course Professors", type: "courseInfo", note: "Supported: Excel, CSV, PDF" }].map(({ label, type, note }) => (
          <div key={type} className="flex flex-col w-full">
            <h2 className="text-left text-lg font-bold text-black mb-2">{label}</h2>
            <div
              className="bg-blue-100 backdrop-blur-md rounded-2xl shadow-lg p-7 w-full max-w-3xl z-10 flex flex-col items-center justify-center cursor-pointer hover:bg-white transition"
              onDragOver={(e) => e.preventDefault()}
              onDrop={(e) => { e.preventDefault(); handleFile(e.dataTransfer.files, type); }}
              onClick={() => document.getElementById(type).click()}
            >
              <p className="text-gray-700 font-medium text-md">
                Drag & drop file or <span className="text-red-700 font-semibold">Browse</span>
              </p>
              <p className="text-sm text-gray-500">{note}</p>
              <input
                id={type}
                type="file"
                className="hidden"
                onChange={(e) => handleFile(e.target.files, type)}
              />
            </div>
            {files[type] && (
              <p className="text-md mt-2 text-green-800 font-medium">{files[type].name} selected</p>
            )}
            
          </div>
        ))}
        {/* Optional Course Info Link */}
        <div className="flex flex-col w-full">
          <h2 className="text-left text-lg font-semibold text-black mb-2">
            Course Info URL (Optional)
          </h2>
          <input
            type="text"
            placeholder="https://example.com/course-data"
            value={files.courseLink}
            onChange={(e) => setFiles(prev => ({ ...prev, courseLink: e.target.value }))}
            className="bg-white/30 backdrop-blur-md rounded-2xl shadow-lg p-3 w-full max-w-3xl z-10 text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <p className="text-sm text-gray-500 mt-1">
            Paste a link to course information page.
          </p>
        </div>

        {/* 버튼 영역 */}
        <div className="flex justify-center gap-6">
          <button
            onClick={handleFileUpload}
            disabled={!Object.values(files).slice(0, 3).every(Boolean) || loadingState.isActive}
            className={`px-6 py-2 text-sm font-medium rounded-md shadow ${
              (!Object.values(files).slice(0, 3).every(Boolean) || loadingState.isActive)
                ? "bg-black opacity-50 cursor-not-allowed text-white"
                : "bg-black hover:bg-gray-700 text-white"
            }`}          >
            Upload Files
          </button>

          {uploadComplete && (
            <button
              onClick={handleStartAssignment}
              disabled={loadingState.isActive}
              className="px-6 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-medium rounded-md shadow"
            >
              Start Assignment
            </button>
          )}
        </div>
      </div>

      {/* 로딩 오버레이 */}
      {loadingState.isActive && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg shadow-xl flex flex-col items-center gap-4 w-80">
            <div className="relative w-12 h-12">
              <div className="absolute inset-0 rounded-full border-4 border-blue-300 border-t-blue-600 animate-spin"></div>
              <div className="absolute inset-2 rounded-full bg-white"></div>
            </div>
            <p className="text-black font-semibold text-center">{loadingState.message}</p>
            <button onClick={handleCancel} className="px-4 py-1.5 bg-gray-300 hover:bg-gray-400 rounded-sm text-black text-xs font-semibold">Cancel</button>
            {loadingState.error && (
              <div className="text-red-600 text-sm text-center px-2 flex flex-col items-center gap-1">
                <div className="flex items-center gap-1">
                  <span>⚠️</span>
                  <span>{loadingState.error}</span>
                </div>
                <div className="flex gap-10 mt-3">
                  <button onClick={handleContinueAnyway} className="px-4 py-1.5 bg-indigo-500 hover:bg-indigo-600 rounded-sm text-white text-xs font-semibold">Continue Anyway</button>
                  
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
    </div>
  );
}

export default UploadPage;