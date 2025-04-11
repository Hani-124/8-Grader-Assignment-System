import React, { useState, useEffect } from "react";
import * as XLSX from "xlsx";
import { BASE_API_URL } from "./constants";

function ManualEditPage() {
  const [data, setData] = useState([]);
  const [sortOrder, setSortOrder] = useState("default");
  const [editPopup, setEditPopup] = useState(false);
  const [currentRow, setCurrentRow] = useState({});
  const [currentRowIndex, setCurrentRowIndex] = useState(null);
  const [downloadMenuOpen, setDownloadMenuOpen] = useState(false);

  useEffect(() => {
    fetch(`${BASE_API_URL}/api/match-results/`, {
      headers: {
        Accept: "application/json",
        "ngrok-skip-browser-warning": "true",
      },
    })
      .then((res) => res.json())
      .then((result) => {
        console.log("📦 Match Results From Backend:", result.data);
        setData(result.data || []);
      })
      .catch((err) => console.error("❌ Error loading match data:", err));
  }, []);

  const sortedData = () => {
    const sorter = {
      professor: (a, b) => a.professor_name?.localeCompare(b.professor_name),
      course: (a, b) => a.course_number?.localeCompare(b.course_number),
      grader: (a, b) => a.grader_major?.localeCompare(b.grader_major),
    };
    return sortOrder !== "default" ? [...data].sort(sorter[sortOrder]) : data;
  };

  const openEditPopup = (row, index) => {
    setCurrentRow({ ...row });
    setCurrentRowIndex(index);
    setEditPopup(true);
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setCurrentRow((prev) => ({ ...prev, [name]: value }));
  };

  const downloadCSV = () => {
    const worksheet = XLSX.utils.json_to_sheet(data);
    const csvOutput = XLSX.utils.sheet_to_csv(worksheet);
    const blob = new Blob([csvOutput], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.setAttribute("download", "manual_edit_result.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const downloadXLSX = () => {
    const worksheet = XLSX.utils.json_to_sheet(data);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Sheet1");
    XLSX.writeFile(workbook, "manual_edit_result.xlsx");
  };

  const saveChanges = async () => {
    try {
      const res = await fetch(`${BASE_API_URL}/api/update-grader-data/`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "ngrok-skip-browser-warning": "true",
        },
        body: JSON.stringify({ data: [currentRow] }),
      });

      const result = await res.json();
      if (res.ok) {
        const updated = [...data];
        updated[currentRowIndex] = currentRow;
        setData(updated);
        alert(result.message || "Changes saved.");
      } else {
        alert("Save failed.");
        console.error(result);
      }
    } catch (err) {
      alert("Failed to save changes.");
      console.error(err);
    }

    setEditPopup(false);
  };

  return (
    <div className="flex flex-col items-center min-h-screen w-screen bg-gradient-to-b from-blue-300 to-white p-6">
      <div className="flex justify-between items-center w-full max-w-6xl px-6 mb-4">
        <div className="flex items-center gap-4">
          <h1 className="text-2xl font-bold text-blue-900">MANUAL EDIT</h1>
          <select
            className="px-3 py-2 border border-gray-400 rounded-md bg-white"
            onChange={(e) => setSortOrder(e.target.value)}
          >
            <option value="default">List order</option>
            <option value="professor">Professor Alphabetical Order</option>
            <option value="course">Course # Numerical Order</option>
            <option value="grader">Grader Major Alphabetical Order</option>
          </select>
        </div>

        <div className="relative z-50">
          <button
            onClick={() => setDownloadMenuOpen(!downloadMenuOpen)}
            className="px-4 py-2 bg-blue-700 text-white font-semibold rounded-md shadow hover:bg-blue-800"
          >
            Download ▼
          </button>
          {downloadMenuOpen && (
            <div className="absolute right-0 bg-white border shadow-lg rounded-md z-50">
              <button className="block px-4 py-2 hover:bg-gray-100" onClick={downloadCSV}>
                Download CSV
              </button>
              <button className="block px-4 py-2 hover:bg-gray-100" onClick={downloadXLSX}>
                Download XLSX
              </button>
            </div>
          )}
        </div>
      </div>

      <div className="bg-white shadow-lg rounded-lg border border-gray-300 w-full max-w-[1030px] h-[500px] overflow-auto p-4">
        <table className="w-full">
          <thead className="bg-gray-300 sticky top-0">
            <tr>
              {["Course Number", "Professor Name", "Assigned Grader", "Grader Major", "Grader Email", "Justification", "Edit"].map((header) => (
                <th key={header} className="border px-4 py-2">{header}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {sortedData().map((row, index) => (
              <tr key={index} className="border">
                <td className="border px-4 py-2">{row.course_number}</td>
                <td className="border px-4 py-2">{row.professor_name}</td>
                <td className="border px-4 py-2">{row.assigned_grader}</td>
                <td className="border px-4 py-2">{row.grader_major}</td>
                <td className="border px-4 py-2">{row.grader_email}</td>
                <td className="border px-4 py-2">{row.justification}</td>
                <td className="border px-4 py-2 text-center">
                  <button onClick={() => openEditPopup(row, index)} className="text-blue-500 font-bold">✏️</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {editPopup && (
        <div className="fixed inset-0 flex justify-center items-center" style={{ backgroundColor: "rgba(255, 255, 255, 0.4)" }}>
          <div className="bg-gradient-to-br from-blue-100 to-white p-8 rounded shadow-2xl w-[700px] relative">
            <button
              onClick={() => setEditPopup(false)}
              className="absolute top-3 left-3 border border-gray-500 rounded p-1 text-gray-600 hover:text-gray-900"
            >
              ✖️
            </button>
            <div className="grid grid-cols-2 gap-x-8 gap-y-6">
            <div className="flex items-center">
                <label className="text-blue-900 font-semibold w-40">Professor Name:</label>
                <input
                  className="border px-3 py-1 rounded flex-1 bg-gray-100 text-gray-700 cursor-not-allowed"
                  type="text"
                  name="professor_name"
                  value={currentRow["professor_name"] || ""}
                  disabled
                />
              </div>
              <div className="flex items-center">
                <label className="text-blue-900 font-semibold w-40">Course #:</label>
                <input
                  className="border px-3 py-1 rounded flex-1 bg-gray-100 text-gray-700 cursor-not-allowed"
                  type="text"
                  name="course_number"
                  value={currentRow["course_number"] || ""}
                  disabled
                />
              </div>
              <Field name="assigned_grader" label="Grader Name" currentRow={currentRow} handleInputChange={handleInputChange} />
              <Field name="grader_major" label="Grader Major" currentRow={currentRow} handleInputChange={handleInputChange} />
              <div className="col-span-2">
                <Field name="grader_email" label="Grader Email" currentRow={currentRow} handleInputChange={handleInputChange} wide />
              </div>
              <div className="flex flex-col col-span-2">
                <label className="text-blue-900">Justification:</label>
                <textarea
                  className="border px-3 py-2 rounded h-32"
                  name="justification"
                  value={currentRow["justification"] || ""}
                  onChange={handleInputChange}
                />
              </div>
            </div>
            <div className="flex justify-center mt-6">
              <button
                onClick={saveChanges}
                className="bg-blue-900 text-white px-6 py-2 rounded hover:bg-blue-700 transition"
              >
                Save Changes
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

const Field = ({ name, label, currentRow, handleInputChange, wide }) => (
  <div className={`flex items-center ${wide ? "w-full" : ""}`}>
    <label className="text-blue-900 font-semibold w-40">{label || name}:</label>
    <input
      className="border px-3 py-1 rounded flex-1"
      type="text"
      name={name}
      value={currentRow[name] || ""}
      onChange={handleInputChange}
    />
  </div>
);

export default ManualEditPage;
