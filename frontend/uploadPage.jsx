import { useState } from "react";
import { useNavigate } from "react-router-dom";

function UploadPage() {
  const [files, setFiles] = useState({
    resume: null,
    candidates: null,
    courseInfo: null,
  });
  const [downloadLinks, setDownloadLinks] = useState([]);
  const navigate = useNavigate();

  const BASE_URL = "https://9bdb-2600-100c-a210-43e7-31f6-c900-badd-78f7.ngrok-free.app";
  const allowedFormats = [".xlsx", ".csv", ".pdf"];

  const handleFile = (fileList, type) => {
    const file = fileList[0];
    if (
      file &&
      allowedFormats.some((format) =>
        file.name.toLowerCase().endsWith(format)
      )
    ) {
      setFiles((prev) => ({ ...prev, [type]: file }));
    } else {
      alert("Invalid file format. Please upload Excel, CSV, or PDF files.");
    }
  };

  const handleUpload = async () => {
    console.log("UPLOAD button clicked ✅");

    const newLinks = [];

    for (const [key, file] of Object.entries(files)) {
      if (!file) continue;

      const formData = new FormData();
      formData.append("file", file);
      formData.append("type", key);

      try {
        const response = await fetch(`${BASE_URL}/api/upload/`, {
          method: "POST",
          body: formData,
        });

        const result = await response.json();
        console.log("📦 Response from backend:", result);

        if (response.ok && result.download_url) {
          const fullLink = `${BASE_URL}${result.download_url}`;
          newLinks.push({ name: file.name, link: fullLink });
        } else {
          console.error("❌ Upload failed or no download_url:", result);
        }
      } catch (error) {
        console.error(`❌ Upload error for ${file.name}:`, error);
      }
    }

    console.log("✅ Final collected download links:", newLinks);

    if (newLinks.length > 0) {
      setDownloadLinks(newLinks);
      navigate("/display"); // or comment this out if display page isn't ready yet
    } else {
      alert("No files were uploaded. Please try again.");
    }
  };

  return (
    <div className="flex flex-col justify-center items-center min-h-screen w-screen bg-gradient-to-b from-blue-700 to-white gap-4 p-8">
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
                Drag & drop file or{" "}
                <span className="text-red-600 font-semibold">Browse</span>
              </p>
              <p className="text-sm text-gray-500">
                Supported formats: Excel, CSV, PDF
              </p>
              <input
                id={type}
                type="file"
                className="hidden"
                onChange={(e) => handleFile(e.target.files, type)}
              />
            </div>
            {files[type] && (
              <p className="text-sm mt-2 text-green-600">
                {files[type].name} selected
              </p>
            )}
          </div>
        ))}
      </div>

      <button
        onClick={handleUpload}
        className={`mt-6 px-6 py-4 w-full max-w-xl bg-gradient-to-r from-blue-700 to-indigo-500 text-white text-lg font-semibold border border-gray-400 hover:brightness-110 transition-all ${
          !Object.values(files).some(Boolean) && "opacity-50 cursor-not-allowed"
        }`}
        disabled={!Object.values(files).some(Boolean)}
      >
        UPLOAD FILES
      </button>

      {downloadLinks.length > 0 && (
        <div className="mt-10 w-full max-w-2xl bg-white rounded p-6 shadow-md border border-blue-300">
          <h3 className="text-lg font-semibold text-blue-800 mb-4">
            📥 Download Links
          </h3>
          <ul className="list-disc pl-6 space-y-2">
            {downloadLinks.map((file, idx) => (
              <li key={idx}>
                <a
                  href={file.link}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-600 underline hover:text-blue-800"
                >
                  {file.name}
                </a>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

export default UploadPage;
