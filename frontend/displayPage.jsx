import React, { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import * as XLSX from "xlsx";

function DisplayPage() {
  const [data, setData] = useState([]);
  const [filter, setFilter] = useState("all");
  const navigate = useNavigate();

  // Load the Excel file
  useEffect(() => {
    fetch("/courses_assignment_final_reasoned.xlsx")
      .then((response) => response.blob())
      .then((blob) => {
        const reader = new FileReader();
        reader.onload = (e) => {
          const workbook = XLSX.read(e.target.result, { type: "binary" });
          const sheetName = workbook.SheetNames[0];
          const sheet = workbook.Sheets[sheetName];
          const jsonData = XLSX.utils.sheet_to_json(sheet);
          setData(jsonData);
        };
        reader.readAsBinaryString(blob);
      })
      .catch((error) => console.error("Error loading Excel file:", error));
  }, []);

  // Filter logic
  const filteredData = useMemo(() => {
    return data.filter((row) => {
      if (filter === "all") return true;
      if (filter === "grader-to-course") return row["Course Number"] && row["Assigned Grader"];
      if (filter === "grader-to-professor") return row["Professor Name"] && row["Assigned Grader"];
      if (filter === "graders-only") return row["Assigned Grader"];
      return true;
    });
  }, [data, filter]);

  // Define visible columns based on the selected filter
  const columns = useMemo(() => {
    if (filter === "all") {
      return ["Course Number", "Professor Name", "Assigned Grader", "Grader Major"];
    } else if (filter === "grader-to-course") {
      return ["Course Number", "Assigned Grader"];
    } else if (filter === "grader-to-professor") {
      return ["Professor Name", "Assigned Grader"];
    } else if (filter === "graders-only") {
      return ["Assigned Grader"];
    }
    return [];
  }, [filter]);

  return (
    <div className="flex flex-col items-start min-h-screen w-screen bg-gradient-to-b from-blue-300 to-white p-6">
      {/* Header (Moved to the left) */}
      <p className="text-2xl font-semibold text-blue-800 mb-4 ml-16">DOWNLOAD RESULT</p>

      <div className="flex w-5/6 gap-12 ml-16">
        {/* Left Side: Filter + Table */}
        <div className="w-4/5">
          {/* Filter Section */}
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

          {/* Table Display in Box (Wider Table) */}
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

        {/* Right Side: Buttons */}
        <div className="flex flex-col gap-6 w-1/4 mt-[80px]">  
        {/* Edit Table Button */}
        <button className="w-full py-2 border border-gray-400 bg-white text-gray-800 font-semibold shadow hover:bg-gray-200 transition"
        onClick={() => navigate("/manual-edit")}
        >
            EDIT TABLE
        </button>

        {/* Download CSV */}
        <button className="w-full py-2 bg-gradient-to-r from-blue-700 to-indigo-500 text-white font-semibold shadow hover:brightness-110 transition mt-8">
            DOWNLOAD CSV
        </button>

        {/* Download XLSX */}
        <button className="w-full py-2 bg-gradient-to-r from-blue-700 to-indigo-500 text-white font-semibold shadow hover:brightness-110 ">
            DOWNLOAD XLSX
        </button>
        </div>
      </div>
    </div>
  );
}

export default DisplayPage;
