import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import * as XLSX from "xlsx";
import { BASE_API_URL } from "./constants";

function DisplayPage() {
  const [data, setData] = useState([]);
  const [originalData, setOriginalData] = useState([]);
  const [filter, setFilter] = useState("all");
  const [sortOption, setSortOption] = useState("list");
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
        setOriginalData(result.data || []);
      } catch (err) {
        console.error("❌ Could not fetch match results:", err);
      }
    };
    fetchData();
  }, []);

  const filteredData = useMemo(() => {
    let filtered = data.filter((row) => {
      if (filter === "grader-to-course") return row.course_number && row.assigned_grader;
      if (filter === "grader-to-professor") return row.professor_name && row.assigned_grader;
      if (filter === "graders-only") return row.assigned_grader;
      return true;
    });

    if (sortOption === "professor") {
      filtered.sort((a, b) => a.professor_name?.localeCompare(b.professor_name));
    } else if (sortOption === "course") {
      filtered.sort((a, b) => a.course_number?.localeCompare(b.course_number));
    } else if (sortOption === "major") {
      filtered.sort((a, b) => a.grader_major?.localeCompare(b.grader_major));
    } else if (sortOption === "list") {
      filtered = [...originalData]; // 원본 순서
    }
    return filtered;
  }, [data, filter, sortOption, originalData]);

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
      "justification",
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

  const handleBackgroundClick = (e) => {
    if (showDownloadPopup && e.target.closest(".download-menu") === null) {
      setShowDownloadPopup(null);
    }
  };

  return (
    <div className="flex flex-col items-center min-h-screen w-screen bg-gray-100 p-6" onClick={handleBackgroundClick}>
      
      {/* 타이틀 + 버튼 */}
      <div className="w-full max-w-6xl flex justify-between items-center mb-6">
        <div className="border-l-4 border-blue-600 pl-4">
          <h1 className="text-4xl font-extrabold text-gray-800 leading-snug tracking-tight">
            Match Results
          </h1>
          <p className="text-gray-500 text-sm mt-1">
            View and download matched grader assignments.
          </p>
        </div>

        <div className="relative flex items-center gap-4">
          <button
            className="px-5 py-1.5 bg-gray-300 font-semibold border border-gray-300 rounded-3xl shadow hover:bg-gray-400"
            onClick={() => navigate("/manual-edit")}
          >
            Edit Table
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              setShowDownloadPopup((prev) => (prev === "menu" ? null : "menu"));
            }}
            className="px-5 py-1.5 bg-blue-700 text-white font-semibold rounded shadow hover:bg-blue-900"
          >
            Download ▼
          </button>

          {showDownloadPopup === "menu" && (
            <div className="absolute top-full right-0 mt-2 bg-white border border-gray-300 shadow-lg rounded-md z-50 download-menu">
              <button className="block w-full text-left px-4 py-2 hover:bg-gray-100 text-sm font-medium" onClick={() => downloadFile("csv")}>
                Download CSV
              </button>
              <button className="block w-full text-left px-4 py-2 hover:bg-gray-100 text-sm font-medium" onClick={() => downloadFile("xlsx")}>
                Download XLSX
              </button>
            </div>
          )}
        </div>
      </div>

      {/* 필터 + 정렬 드롭다운 */}
      <div className="w-full max-w-6xl flex flex-col sm:flex-row gap-4 mb-8">
        <select
          className="px-3 py-2 border border-gray-300 rounded-md bg-white"
          onChange={(e) => setFilter(e.target.value)}
        >
          <option value="all">Display all results</option>
          <option value="grader-to-course">Display grader to course only</option>
          <option value="grader-to-professor">Display grader to professor only</option>
          <option value="graders-only">List all graders only</option>
        </select>

        <select
          className="px-3 py-2 border border-gray-300 rounded-md bg-white"
          onChange={(e) => setSortOption(e.target.value)}
        >
          <option value="list">List order</option>
          <option value="professor">Professor Alphabetical Order</option>
          <option value="course">Course # Numerical Order</option>
          <option value="major">Grader Major Alphabetical Order</option>
        </select>
      </div>

      {/* 테이블 */}
      <div className="bg-white shadow-xl rounded-2xl border border-gray-300 w-full max-w-[1150px] h-[700px] overflow-auto p-4">
        <table className="w-full text-sm text-gray-700">
          <thead>
            <tr className="bg-gray-200 text-gray-700 text-sm font-semibold">
              {columns.map((col, index) => (
                <th
                  key={index}
                  className={`px-6 py-3 border-b border-gray-300 text-left ${
                    index === 0 ? "rounded-tl-lg" : ""
                  } ${
                    index === columns.length - 1 ? "rounded-tr-lg" : ""
                  }`}
                >
                  {columnHeaders[col] || col}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filteredData.length > 0 ? (
              filteredData.map((row, index) => (
                <tr key={index} className="border-b border-gray-200 hover:bg-gray-100 transition">
                  {columns.map((col, colIndex) => (
                    <td key={colIndex} className="px-6 py-4 whitespace-nowrap">
                      {row[col]}
                    </td>
                  ))}
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={columns.length} className="px-6 py-20 text-center text-gray-400 font-medium">
                  No results found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default DisplayPage;
