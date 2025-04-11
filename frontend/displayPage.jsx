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
        const res = await fetch(`${BASE_API_URL}/api/match-results/`, {
          headers: {
            Accept: "application/json",
            "ngrok-skip-browser-warning": "true",
          },
        });

        const result = await res.json();
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
    if (filter === "grader-to-course") return ["course_number", "assigned_grader"];
    if (filter === "grader-to-professor") return ["professor_name", "assigned_grader"];
    if (filter === "graders-only") return ["assigned_grader"];
    return ["course_number", "professor_name", "assigned_grader", "grader_major"];
  }, [filter]);

  const downloadFile = (format) => {
    const worksheet = XLSX.utils.json_to_sheet(filteredData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Sheet1");
    XLSX.writeFile(workbook, `${fileName || "match_results"}.${format}`);
    setShowDownloadPopup(null);
    setFileName("");
  };

  return (
    <div className="flex flex-col items-start min-h-screen w-screen bg-gradient-to-b from-blue-300 to-white p-6">
      <p className="text-2xl font-semibold text-blue-800 mb-4 ml-16">📊 MATCH RESULTS</p>

      <div className="flex w-5/6 gap-12 ml-16">
        <div className="w-4/5">
          <div className="mb-4">
            <label className="text-sm font-medium text-gray-700 block mb-1">Filter</label>
            <select
              className="w-80 px-3 py-2 border border-gray-400 rounded-md bg-white text-black shadow-sm focus:ring-blue-500 focus:border-blue-500"
              onChange={(e) => setFilter(e.target.value)}
            >
              <option value="all">Display all results</option>
              <option value="grader-to-course">Display grader to course only</option>
              <option value="grader-to-professor">Display grader to professor only</option>
              <option value="graders-only">List all graders only</option>
            </select>
          </div>

          <div className="bg-white shadow-lg rounded-lg border border-gray-300 w-full">
            <div className="overflow-y-auto max-h-96">
              <table className="w-full text-left border-collapse">
                <thead className="sticky top-0 bg-gray-300">
                  <tr>
                    {columns.map((col, index) => (
                      <th key={index} className="px-4 py-2 border">{col}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {filteredData.length > 0 ? (
                    filteredData.map((row, index) => (
                      <tr key={index} className="border hover:bg-gray-100">
                        {columns.map((col, colIndex) => (
                          <td key={colIndex} className="px-4 py-2 border">{row[col]}</td>
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
          </div>
        </div>

        <div className="flex flex-col gap-6 w-1/4 mt-[80px]">
          <button
            className="w-full py-2 border border-gray-400 bg-white text-gray-800 font-semibold shadow hover:bg-gray-200 transition"
            onClick={() => navigate("/manual-edit")}
          >
            EDIT TABLE
          </button>

          <button
            className="w-full py-2 bg-gradient-to-r from-blue-700 to-indigo-500 text-white font-semibold shadow hover:brightness-110 transition mt-8"
            onClick={() => setShowDownloadPopup("csv")}
          >
            DOWNLOAD CSV
          </button>

          <button
            className="w-full py-2 bg-gradient-to-r from-blue-700 to-indigo-500 text-white font-semibold shadow hover:brightness-110"
            onClick={() => setShowDownloadPopup("xlsx")}
          >
            DOWNLOAD XLSX
          </button>
        </div>
      </div>

      {showDownloadPopup && (
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
