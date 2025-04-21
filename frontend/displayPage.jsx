import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import * as XLSX from "xlsx";
import { BASE_API_URL } from "./constants";

function DisplayPage() {
  const [data, setData] = useState([]);
  const [filter, setFilter] = useState("all");
  const [showDownloadPopup, setShowDownloadPopup] = useState(null);
  const [fileName, setFileName] = useState("");
  const navigate = useNavigate();

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await fetch(`${BASE_API_URL}/api/match-results/`, {
          method: "GET",
          headers: {
            Accept: "application/json",
            "ngrok-skip-browser-warning": "true",
          },
        });

        if (!response.ok) {
          const errorText = await response.text();
          throw new Error(errorText);
        }

        const result = await response.json();
        setData(result.data || []);
      } catch (err) {
        console.error("❌ Could not fetch match results:", err);
      }
    };

    fetchData();
  }, []);

  const filteredData = useMemo(() => {
    return data.filter((row) => {
      if (filter === "grader-to-course") return row.course_number && row.assigned_grader;
      if (filter === "grader-to-professor") return row.professor_name && row.assigned_grader;
      if (filter === "graders-only") return row.assigned_grader;
      return true;
    });
  }, [data, filter]);

  const columns = useMemo(() => {
    if (filter === "grader-to-course") return ["course_number", "assigned_grader", "justification"];
    if (filter === "grader-to-professor") return ["professor_name", "assigned_grader", "justification"];
    if (filter === "graders-only") return ["assigned_grader", "justification"];
    return [
      "course_number",
      "section",
      "professor_name",
      "assigned_grader",
      "grader_major",
      "grader_email",
      "justification"
    ];
  }, [filter]);

  const columnHeaders = {
    course_number: "Course Number",
    section: "Section",
    professor_name: "Professor Name",
    assigned_grader: "Assigned Grader",
    grader_major: "Grader Major",
    grader_email: "Grader Email",
    justification: "Reasoning",
  };

  const downloadFile = (format) => {
    const worksheet = XLSX.utils.json_to_sheet(filteredData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Sheet1");
    XLSX.writeFile(workbook, `${fileName || "match_results"}.${format}`);
    setShowDownloadPopup(null);
    setFileName("");
  };

  return (
    <div className="flex flex-col items-center min-h-screen w-screen bg-gradient-to-b from-blue-300 to-white p-6">
      <div className="flex justify-between items-center w-full max-w-6xl px-6 mb-4">
        <div className="flex items-center gap-4">
          <h1 className="text-2xl font-bold text-blue-900">MATCH RESULTS</h1>
          <select
            className="px-3 py-2 border border-gray-400 rounded-md bg-white"
            onChange={(e) => setFilter(e.target.value)}
          >
            <option value="all">Display all results</option>
            <option value="grader-to-course">Display grader to course only</option>
            <option value="grader-to-professor">Display grader to professor only</option>
            <option value="graders-only">List all graders only</option>
          </select>
        </div>

        <div className="flex items-center gap-4">
          <button
            className="px-4 py-2 bg-gray-100 border border-gray-400 rounded shadow hover:bg-gray-200"
            onClick={() => navigate("/manual-edit")}
          >
            Edit Table
          </button>
          <button
            onClick={() => setShowDownloadPopup("menu")}
            className="px-4 py-2 bg-blue-700 text-white font-semibold rounded-md shadow hover:bg-blue-800"
          >
            Download ▼
          </button>
          {showDownloadPopup === "menu" && (
            <div className="absolute right-0 bg-white border shadow-lg rounded-md z-50">
              <button className="block px-4 py-2 hover:bg-gray-100" onClick={() => downloadFile("csv")}>Download CSV</button>
              <button className="block px-4 py-2 hover:bg-gray-100" onClick={() => downloadFile("xlsx")}>Download XLSX</button>
            </div>
          )}
        </div>
      </div>

      <div className="bg-white shadow-lg rounded-lg border border-gray-300 w-full max-w-[1030px] h-[500px] overflow-auto p-4">
        <table className="w-full">
          <thead className="bg-gray-300 sticky top-0">
            <tr>
              {columns.map((col, index) => (
                <th key={index} className="px-4 py-2 border whitespace-nowrap">
                  {columnHeaders[col] || col}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filteredData.length > 0 ? (
              filteredData.map((row, index) => (
                <tr key={index} className="border hover:bg-gray-100">
                  {columns.map((col, colIndex) => (
                    <td key={colIndex} className="px-4 py-2 border whitespace-nowrap">
                      {row[col]}
                    </td>
                  ))}
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={columns.length} className="px-4 py-2 text-center text-gray-500">
                  No results found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {showDownloadPopup && showDownloadPopup !== "menu" && (
        <div className="fixed inset-0 flex justify-center items-center bg-black bg-opacity-20">
          <div className="bg-white p-6 rounded shadow-lg">
            <h2 className="mb-4">Save result file as:</h2>
            <div className="mb-4">
              <input
                type="text"
                className="border px-2 py-1"
                placeholder="File Name"
                value={fileName}
                onChange={(e) => setFileName(e.target.value)}
              />
              .{showDownloadPopup}
            </div>
            <div className="flex gap-2 justify-end">
              <button
                className="bg-gray-300 px-4 py-2"
                onClick={() => setShowDownloadPopup(null)}
              >
                Cancel
              </button>
              <button
                className="bg-blue-700 text-white px-4 py-2"
                onClick={() => downloadFile(showDownloadPopup)}
              >
                Download
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default DisplayPage;