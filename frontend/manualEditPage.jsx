import React, { useState, useEffect, useRef } from "react";
import * as XLSX from "xlsx";

function ManualEditPage() {
  const [data, setData] = useState([]);
  const [sortOrder, setSortOrder] = useState("default");
  const [isDropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);

  // Load Excel file
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

  // Sorting function
  const sortedData = () => {
    if (sortOrder === "professor") {
      return [...data].sort((a, b) => a["Professor Name"].localeCompare(b["Professor Name"]));
    } else if (sortOrder === "course") {
      return [...data].sort((a, b) => a["Course Number"].localeCompare(b["Course Number"]));
    } else if (sortOrder === "grader") {
      return [...data].sort((a, b) => a["Grader Major"].localeCompare(b["Grader Major"]));
    }
    return data;
  };

  // Handle outside click for dropdown
  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div className="flex flex-col items-center min-h-screen w-screen bg-gradient-to-b from-blue-300 to-white p-6">
      
      {/* Header Section */}
      <div className="flex justify-between items-center w-full max-w-6xl px-6 mb-4">
        
        {/* Manual Edit Title & Dropdown */}
        <div className="flex items-center gap-4">
          <h1 className="text-2xl font-bold text-blue-900">MANUAL EDIT</h1>
          <select
            className="px-3 py-2 border border-gray-400 rounded-md bg-white text-black shadow-sm focus:ring-blue-500 focus:border-blue-500"
            onChange={(e) => setSortOrder(e.target.value)}
          >
            <option value="default">List order</option>
            <option value="professor">Professor Alphabetical Order</option>
            <option value="course">Course # Numerical Order</option>
            <option value="grader">Grader Major Alphabetical Order</option>
          </select>
        </div>

        {/* Save & Download Dropdown */}
        <div className="relative" ref={dropdownRef}>
          <button
            onClick={() => setDropdownOpen(!isDropdownOpen)}
            className="px-4 py-2 bg-blue-700 text-white font-semibold rounded-md shadow hover:bg-blue-800 flex items-center gap-2"
          >
            Save and Download ▼
          </button>

          {isDropdownOpen && (
            <div className="absolute right-0 mt-2 w-48 bg-white border border-gray-300 shadow-lg rounded-md z-10">
              <button className="block w-full px-4 py-2 text-left text-gray-700 hover:bg-gray-100">
                Download in CSV
              </button>
              <button className="block w-full px-4 py-2 text-left text-gray-700 hover:bg-gray-100">
                Download in XLSX
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Table Box */}
      <div className="bg-white shadow-lg rounded-lg border border-gray-300 w-full max-w-[1030px] h-[500px] p-4">
        <div className="overflow-x-auto overflow-y-auto h-full">
            <table className="w-full text-left border-collapse">
            <thead className="sticky top-0 bg-gray-300">
                <tr>
                <th className="px-4 py-2 border">Course #</th>
                <th className="px-4 py-2 border">Professor Name</th>
                <th className="px-4 py-2 border">Assigned Grader</th>
                <th className="px-4 py-2 border">Grader Major</th>
                <th className="px-4 py-2 border">Grader Email</th>
                <th className="px-4 py-2 border">Justification</th>
                </tr>
            </thead>
            <tbody>
                {sortedData().map((row, index) => (
                <tr key={index} className="border hover:bg-gray-100">
                    <td className="px-4 py-2 border">{row["Course Number"]}</td>
                    <td className="px-4 py-2 border">{row["Professor Name"]}</td>
                    <td className="px-4 py-2 border">{row["Assigned Grader"]}</td>
                    <td className="px-4 py-2 border">{row["Grader Major"]}</td>
                    <td className="px-4 py-2 border">{row["Grader Email"]}</td>
                    <td className="px-4 py-2 border">{row["Justification"]}</td>
                </tr>
                ))}
            </tbody>
            </table>
        </div>
    </div>
</div>
  );
}

export default ManualEditPage;
