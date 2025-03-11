import { useState, useRef } from "react";
import { useNavigate } from "react-router-dom";

function UploadPage() {
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [uploadingFiles, setUploadingFiles] = useState([]);
  const [progress, setProgress] = useState({});
  const fileInputRef = useRef(null);
  const navigate = useNavigate();

  const allowedFormats = [".xlsx", ".csv", ".pdf"];

  // Handle file selection (Drag & Drop or Browse)
  const handleFiles = (files) => {
    const newFiles = Array.from(files).filter(file =>
      allowedFormats.some(format => file.name.toLowerCase().endsWith(format))
    );

    if (selectedFiles.length + newFiles.length > 3) {
      alert("You can only upload exactly 3 files.");
      return;
    }

    if (newFiles.length > 0) {
      setSelectedFiles(prev => [...prev, ...newFiles]);
    } else {
      alert("Invalid file format. Please upload Excel, CSV, or PDF files.");
    }
  };

  // Handle file upload
  const handleUpload = async () => {
    if (selectedFiles.length !== 3) {
      alert("You must upload exactly 3 files.");
      return;
    }

    setUploadingFiles([...selectedFiles]);
    setSelectedFiles([]);

    for (const file of uploadingFiles) {
      const formData = new FormData();
      formData.append("file", file);

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

    setUploadingFiles([]);
    navigate("/display");
  };

  // Remove selected file
  const removeFile = (fileName) => {
    setSelectedFiles(selectedFiles.filter(file => file.name !== fileName));
  };

  return (
    <div className="flex justify-center items-center min-h-screen w-screen bg-gradient-to-b from-blue-700 to-white">
      {/* Centered Upload Box with Spacing */}
      <div className="w-full max-w-lg bg-white p-10 shadow-lg rounded-lg flex flex-col items-center">
        <h2 className="text-3xl font-semibold text-blue-700 mb-6 text-center">Upload Files</h2>

        {/* Drag & Drop Upload Area */}
        <div
          className="w-full p-6 border-2 border-dashed border-blue-500 bg-blue-50 flex flex-col items-center justify-center cursor-pointer hover:bg-blue-100 transition mb-6"
          onDragOver={(e) => {
            e.preventDefault();
            e.stopPropagation();
            e.dataTransfer.dropEffect = "copy"; 
          }}
          onDrop={(e) => {
            e.preventDefault();
            e.stopPropagation();
            if (e.dataTransfer.files.length > 0) {
              handleFiles(e.dataTransfer.files);
            }
          }}
          onClick={() => fileInputRef.current?.click()}
        >
          <p className="text-gray-700 font-medium text-lg">
            Drag & drop files or <span className="text-red-600 font-semibold cursor-pointer">Browse</span>
          </p>
          <p className="text-sm text-gray-500">Supported formats: Excel, CSV, PDF</p>
          <input
            ref={fileInputRef}
            type="file"
            multiple
            className="hidden"
            onChange={(e) => handleFiles(e.target.files)}
          />
        </div>

        {/* Uploading Progress */}
        {uploadingFiles.length > 0 && (
          <div className="mt-4 w-full">
            <p className="text-gray-700 mb-2">Uploading - {uploadingFiles.length} files</p>
            {uploadingFiles.map((file, index) => (
              <div key={index} className="flex items-center gap-2 bg-blue-100 p-2 mb-2">
                <span className="text-sm text-gray-800">{file.name}</span>
                <div className="w-full h-2 bg-blue-300">
                  <div className="h-2 bg-blue-600" style={{ width: `${progress[file.name] || 0}%` }}></div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Uploaded Files List */}
        {selectedFiles.length > 0 && (
          <div className="mt-4 w-full">
            <p className="text-gray-700 font-medium">Uploaded Files</p>
            {selectedFiles.map((file, index) => (
              <div key={index} className="flex justify-between items-center bg-blue-50 p-3 mb-2 border border-blue-300">
                <span className="text-sm text-gray-800">{file.name}</span>
                <button
                  onClick={() => removeFile(file.name)}
                  className="text-blue-600 hover:text-red-600 text-lg"
                >
                  ✖
                </button>
              </div>
            ))}
          </div>
        )}

        {/* Upload Button (Squared Edges & Only Enabled with 3 Files) */}
        <button
          onClick={handleUpload}
          className={`mt-6 px-6 py-4 w-full bg-gradient-to-r from-blue-700 to-indigo-500 text-white text-lg font-semibold border border-gray-400 hover:brightness-110 transition-all ${
            selectedFiles.length === 3 ? "" : "opacity-50 cursor-not-allowed"
          }`}
          disabled={selectedFiles.length !== 3}
        >
          UPLOAD FILES
        </button>
      </div>
    </div>
  );
}

export default UploadPage;
