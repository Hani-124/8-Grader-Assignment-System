import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { BASE_API_URL } from "./constants";

function UploadPage() {
  const [files, setFiles] = useState({
    resume: null,
    candidates: null,
    courseInfo: null,
  });
  const [uploadComplete, setUploadComplete] = useState(false); // ✅ flag to control "Start Assignment"
  const [fileUploadInProgress, setFileUploadInProgress] = useState(false);
  const navigate = useNavigate();
  const allowedFormats = [".xlsx", ".csv", ".pdf", ".zip"];

  const handleFile = (fileList, type) => {
    const file = fileList[0];
    if (file && allowedFormats.some(ext => file.name.toLowerCase().endsWith(ext))) {
      setFiles(prev => ({ ...prev, [type]: file }));
    } else {
      alert("Invalid file format. Please upload Excel, CSV, or PDF files.");
    }
  };

  const handleFileUpload = async () => {
    const formData = new FormData();
    Object.entries(files).forEach(([key, file]) => {
      if (file) formData.append(key, file);
    });

    try {
      setFileUploadInProgress(true);
      const response = await fetch(`${BASE_API_URL}/api/process/`, {
        method: "POST",
        body: formData,
      });

      const result = await response.json();
      if (response.ok) {
        alert("Files uploaded successfully!");
        setUploadComplete(true); // ✅ enable "Start Assignment"
      } else {
        alert("Upload failed: " + result.error);
      }
    } catch (error) {
      console.error("Upload failed:", error);
      alert("Error uploading files.");
    } finally {
      setFileUploadInProgress(false);
    }
  };

  const handleStartAssignment = async () => {
    try {
      const response = await fetch(`${BASE_API_URL}/api/start-matching/`, {
        method: "POST",
      });

      const result = await response.json();
      if (response.ok) {
        navigate("/display");
      } else {
        alert("Processing failed: " + result.error);
      }
    } catch (error) {
      console.error("Processing failed:", error);
      alert("Error starting assignment.");
    }
  };

  return (
    <div className="flex flex-col justify-center items-center min-h-screen w-screen bg-gradient-to-b from-blue-700 to-white gap-4 p-8">
      {/* File Upload Cards */}
      <div className="flex flex-row justify-center items-start gap-4">
        {[
          { label: "Upload Resumes", type: "resume" },
          { label: "Upload Candidates", type: "candidates" },
          { label: "Upload Course Professors", type: "courseInfo" },
        ].map(({ label, type }) => (
          <div
            key={type}
            className="w-full max-w-sm bg-white p-6 shadow-lg rounded-lg flex flex-col items-center"
          >
            <h2 className="text-xl font-semibold text-blue-700 mb-2 text-center">
              {label}
            </h2>
            <div
              className="w-full p-6 border-2 border-dashed border-blue-500 bg-blue-50 flex flex-col items-center justify-center cursor-pointer hover:bg-blue-100 transition"
              onDragOver={(e) => e.preventDefault()}
              onDrop={(e) => {
                e.preventDefault();
                handleFile(e.dataTransfer.files, type);
              }}
              onClick={() => document.getElementById(type).click()}
            >
              <p className="text-gray-700 font-medium text-lg">
                Drag & drop file or <span className="text-red-600 font-semibold">Browse</span>
              </p>
              <p className="text-sm text-gray-500">Supported: Excel, CSV, PDF</p>
              <input
                id={type}
                type="file"
                className="hidden"
                onChange={(e) => handleFile(e.target.files, type)}
              />
            </div>
            {files[type] && (
              <p className="text-sm mt-2 text-green-600">{files[type].name} selected</p>
            )}
          </div>
        ))}
      </div>
  
      {/* Upload Button */}
      <button
        onClick={handleFileUpload}
        disabled={!Object.values(files).every(Boolean) || fileUploadInProgress}
        className={`mt-6 px-6 py-4 w-full max-w-xl bg-blue-700 text-white font-semibold ${
          (!Object.values(files).every(Boolean) || fileUploadInProgress) && "opacity-50 cursor-not-allowed"
        }`}
      >
        {fileUploadInProgress ? "Uploading..." : "Upload Files"}
      </button>
  
      {/* Start Assignment Button */}
      {uploadComplete && (
        <button
          onClick={handleStartAssignment}
          className="mt-4 px-6 py-4 w-full max-w-xl bg-green-600 text-white font-semibold hover:bg-green-700 transition-all"
        >
          ✅ Start Assignment
        </button>
      )}
    </div>
  );

}
export default UploadPage;
