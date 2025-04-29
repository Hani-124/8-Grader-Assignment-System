import React, { useState, useEffect, useRef } from "react";
import * as XLSX from "xlsx";
import { BASE_API_URL } from "./constants";

function ManualEditPage() {
  const [data, setData] = useState([]);
  const [sortOrder, setSortOrder] = useState("default");
  const [editPopup, setEditPopup] = useState(false);
  const [currentRow, setCurrentRow] = useState({});
  const [currentRowIndex, setCurrentRowIndex] = useState(null);
  const [downloadMenuOpen, setDownloadMenuOpen] = useState(false);
  const downloadMenuRef = useRef(null);

  useEffect(() => {
    fetch(`${BASE_API_URL}/api/match-results/`, {
      headers: {
        Accept: "application/json",
        "ngrok-skip-browser-warning": "true",
      },
    })
      .then((res) => res.json())
      .then((result) => {
        setData(result.data || []);
      })
      .catch((err) => console.error("❌ Error loading match data:", err));
  }, []);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (downloadMenuRef.current && !downloadMenuRef.current.contains(event.target)) {
        setDownloadMenuOpen(false);
      }
    };
    if (downloadMenuOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    } else {
      document.removeEventListener("mousedown", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [downloadMenuOpen]);

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
    <div className="flex flex-col items-center min-h-screen w-screen bg-white p-6">
      {/* Title */}
      <div className="w-full max-w-6xl flex justify-between items-center mb-6">
        <div className="border-l-4 border-blue-600 pl-4">
          <h1 className="text-4xl font-extrabold text-gray-800 leading-snug tracking-tight">
            Manual Edit
          </h1>
          <p className="text-gray-500 text-sm mt-1">
            View and edit assigned grader matches manually.
          </p>
        </div>
        <div className="relative z-50" ref={downloadMenuRef}>
          <button
            onClick={() => setDownloadMenuOpen(!downloadMenuOpen)}
            className="px-6 py-1.5 bg-blue-700 text-white font-semibold rounded-sm shadow hover:bg-blue-800"
          >
            Download ▼
          </button>
          {downloadMenuOpen && (
            <div className="absolute top-full right-0 mt-2 bg-white border border-gray-300 shadow-lg rounded-md z-50">
              <button className="block w-full text-left px-4 py-2 hover:bg-gray-100 text-sm font-medium" onClick={downloadCSV}>
                Download CSV
              </button>
              <button className="block w-full text-left px-4 py-2 hover:bg-gray-100 text-sm font-medium" onClick={downloadXLSX}>
                Download XLSX
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Dropdown */}
      <div className="w-full max-w-6xl flex justify-start mb-8">
        <select
          className="px-3 py-2 border border-gray-300 rounded-md bg-white"
          onChange={(e) => setSortOrder(e.target.value)}
        >
          <option value="default">List order</option>
          <option value="professor">Professor Alphabetical Order</option>
          <option value="course">Course # Numerical Order</option>
          <option value="grader">Grader Major Alphabetical Order</option>
        </select>
      </div>

      {/* Table */}
      <div className="bg-white shadow-xl rounded-2xl border border-gray-300 w-full max-w-[1150px] h-[700px] overflow-auto p-4">
        <table className="w-full text-sm text-gray-700">
          <thead>
            <tr className="bg-gray-200 text-gray-700 text-sm font-semibold">
              {["Course Number", "Section", "Professor Name", "Assigned Grader", "Grader Major", "Grader Email", "Justification", "Edit"].map((header, index) => (
                <th
                  key={header}
                  className={`px-6 py-3 border-b border-gray-300 text-left ${
                    index === 0 ? "rounded-tl-lg" : ""
                  } ${index === 7 ? "rounded-tr-lg sticky right-0 bg-gray-200" : ""}`}
                >
                  {header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {sortedData().length > 0 ? (
              sortedData().map((row, index) => (
                <tr key={index} className="border-b border-gray-200 hover:bg-gray-100 transition">
                  <td className="px-6 py-4 whitespace-nowrap">{row.course_number}</td>
                  <td className="px-6 py-4 whitespace-nowrap">{row.section}</td>
                  <td className="px-6 py-4 whitespace-nowrap">{row.professor_name}</td>
                  <td className="px-6 py-4 whitespace-nowrap">{row.assigned_grader}</td>
                  <td className="px-6 py-4 whitespace-nowrap">{row.grader_major}</td>
                  <td className="px-6 py-4 whitespace-nowrap">{row.grader_email}</td>
                  <td className="px-6 py-4 whitespace-nowrap">{row.justification}</td>
                  <td className="px-6 py-4 whitespace-nowrap sticky right-0 bg-white text-center">
                    <button
                      onClick={() => openEditPopup(row, index)}
                      className="text-blue-500 hover:text-blue-700 font-bold"
                    >
                      ✏️
                    </button>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={8} className="px-6 py-20 text-center text-gray-400 font-medium">
                  No results found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Edit Popup */}
      {editPopup && (
        <div className="fixed inset-0 flex justify-center items-center bg-black bg-opacity-50 z-50">
          <div className="bg-gradient-to-br from-blue-100 to-white p-8 rounded shadow-2xl w-[700px] relative">
            <button
              onClick={() => setEditPopup(false)}
              className="absolute top-3 right-3 text-gray-400 hover:text-gray-700"
            >
              ✖️
            </button>
            <h2 className="text-2xl font-bold mb-6 text-center text-blue-700">Edit Row</h2>
            <div className="grid grid-cols-2 gap-x-8 gap-y-6">
              <Field name="professor_name" label="Professor Name" currentRow={currentRow} disabled />
              <Field name="course_number" label="Course #" currentRow={currentRow} disabled />
              <Field name="section" label="Section" currentRow={currentRow} disabled />
              <Field name="assigned_grader" label="Grader Name" currentRow={currentRow} handleInputChange={handleInputChange} />
              <Field name="grader_major" label="Grader Major" currentRow={currentRow} handleInputChange={handleInputChange} />
              <div className="col-span-2">
                <Field name="grader_email" label="Grader Email" currentRow={currentRow} handleInputChange={handleInputChange} wide />
              </div>
              <div className="flex flex-col col-span-2">
                <label className="text-blue-900">Justification:</label>
                <textarea
                  className="border px-3 py-2 rounded h-32 w-full"
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

const Field = ({ name, label, currentRow, handleInputChange, wide, disabled }) => (
  <div className={`flex items-center ${wide ? "col-span-2" : ""}`}>
    <label className="text-blue-900 font-semibold w-40">{label || name}:</label>
    <input
      className="border px-3 py-1 rounded flex-1 bg-gray-100 text-gray-700"
      type="text"
      name={name}
      value={currentRow[name] || ""}
      onChange={handleInputChange}
      disabled={disabled}
    />
  </div>
);

export default ManualEditPage;
