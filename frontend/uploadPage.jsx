import { useState } from "react";
import { useNavigate } from "react-router-dom";

function UploadPage() {
  const [files, setFiles] = useState({ resume: null, candidates: null, courseInfo: null });
  const navigate = useNavigate();

  const allowedFormats = [".xlsx", ".csv", ".pdf"];

  const handleFile = (fileList, type) => {
    const file = fileList[0];
    if (file && allowedFormats.some(format => file.name.toLowerCase().endsWith(format))) {
      setFiles(prev => ({ ...prev, [type]: file }));
    } else {
      alert("Invalid file format. Please upload Excel, CSV, or PDF files.");
    }
  };

  const handleUpload = async () => {
    for (const [key, file] of Object.entries(files)) {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("type", key);

      try {
        const response = await fetch("https://9cc7-2600-100c-a21b-abe-e5da-13dd-bc92-c966.ngrok-free.app/upload", {
          method: "POST",
          body: formData,
        });

        if (response.ok) {
          console.log(`${file.name} uploaded successfully`);
        } else {
          console.error(`Error uploading ${file.name}`);
        }
      } catch (error) {
        console.error(`Upload failed for ${file.name}:`, error);
      }
    }

    navigate("/display");
  };

  return (
    <div className="flex flex-col justify-center items-center min-h-screen w-screen bg-gradient-to-b from-blue-700 to-white gap-4">
      <div className="flex flex-row justify-center items-start gap-4">
        {[
          { label: "Upload Resumes", type: "resume" },
          { label: "Upload Candidates", type: "candidates" },
          { label: "Upload Course Professors", type: "courseInfo" },
        ].map(({ label, type }) => (
          <div key={type} className="w-full max-w-sm bg-white p-6 shadow-lg rounded-lg flex flex-col items-center">
            <h2 className="text-xl font-semibold text-blue-700 mb-2 text-center">{label}</h2>
            <div
              className="w-full p-6 border-2 border-dashed border-blue-500 bg-blue-50 flex flex-col items-center justify-center cursor-pointer hover:bg-blue-100 transition"
              onDragOver={(e) => {
                e.preventDefault();
                e.dataTransfer.dropEffect = "copy";
              }}
              onDrop={(e) => {
                e.preventDefault();
                handleFile(e.dataTransfer.files, type);
              }}
              onClick={() => document.getElementById(type).click()}
            >
              <p className="text-gray-700 font-medium text-lg">
                Drag & drop file or <span className="text-red-600 font-semibold">Browse</span>
              </p>
              <p className="text-sm text-gray-500">Supported formats: Excel, CSV, PDF</p>
              <input
                id={type}
                type="file"
                className="hidden"
                onChange={(e) => handleFile(e.target.files, type)}
              />
            </div>
            {files[type] && <p className="text-sm mt-2 text-green-600">{files[type].name} selected</p>}
          </div>
        ))}
      </div>
      <button
        onClick={handleUpload}
        className={`mt-6 px-6 py-4 w-full max-w-xl bg-gradient-to-r from-blue-700 to-indigo-500 text-white text-lg font-semibold border border-gray-400 hover:brightness-110 transition-all ${!(files.resume && files.candidates && files.courseInfo) && "opacity-50 cursor-not-allowed"}`}
        disabled={!(files.resume && files.candidates && files.courseInfo)}
      >
        UPLOAD FILES
      </button>
    </div>
  );
}

export default UploadPage;