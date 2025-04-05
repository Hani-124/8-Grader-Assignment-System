import React, { useState, useEffect } from "react";
import * as XLSX from "xlsx";
import { utils, writeFile } from "xlsx";


function ManualEditPage() {
  const [data, setData] = useState([]);
  const [sortOrder, setSortOrder] = useState("default");
  const [editPopup, setEditPopup] = useState(false);
  const [currentRow, setCurrentRow] = useState({});
  const [currentRowIndex, setCurrentRowIndex] = useState(null);
  const [downloadMenuOpen, setDownloadMenuOpen] = useState(false);

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

  const openEditPopup = (row, index) => {
    setCurrentRow({ ...row });
    setCurrentRowIndex(index);
    setEditPopup(true);
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setCurrentRow(prevRow => ({ ...prevRow, [name]: value }));
  };

  const downloadCSV = () => {
    const worksheet = utils.json_to_sheet(data);
    const csvOutput = utils.sheet_to_csv(worksheet);
    const blob = new Blob([csvOutput], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', 'data.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };
  
  const downloadXLSX = () => {
    const worksheet = utils.json_to_sheet(data);
    const workbook = utils.book_new();
    utils.book_append_sheet(workbook, worksheet, "Sheet1");
    writeFile(workbook, "data.xlsx");
  };
  
  return (
    <div className="flex flex-col items-center min-h-screen w-screen bg-gradient-to-b from-blue-300 to-white p-6">
      {/* Header Section with Dropdown and Download Button */}
      <div className="flex justify-between items-center w-full max-w-6xl px-6 mb-4">
        <div className="flex items-center gap-4">
          <h1 className="text-2xl font-bold text-blue-900">MANUAL EDIT</h1>
          <select
            className="px-3 py-2 border border-gray-400 rounded-md bg-white text-black shadow-sm"
            onChange={(e) => setSortOrder(e.target.value)}
          >
            <option value="default">List order</option>
            <option value="professor">Professor Alphabetical Order</option>
            <option value="course">Course # Numerical Order</option>
            <option value="grader">Grader Major Alphabetical Order</option>
          </select>
        </div>

        {/* Save and Download Button */}
        <div className="relative z-50">
          <button 
            onClick={() => setDownloadMenuOpen(!downloadMenuOpen)} 
            className="px-4 py-2 bg-blue-700 text-white font-semibold rounded-md shadow hover:bg-blue-800"
          >
           Save and Download ▼
          </button>
          {downloadMenuOpen && (
            <div className="absolute right-0 bg-white border shadow-lg rounded-md z-50">
              <button 
                className="block px-4 py-2 hover:bg-gray-100"
                onClick={downloadCSV}
              >
                Download CSV
              </button>
              <button 
                className="block px-4 py-2 hover:bg-gray-100"
                onClick={downloadXLSX}
              >
                Download XLSX
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Table */}
      <div className="bg-white shadow-lg rounded-lg border border-gray-300 w-full max-w-[1030px] h-[500px] overflow-auto p-4">
        <table className="w-full">
          <thead className="bg-gray-300 sticky top-0">
            <tr>
              {["Course Number", "Professor Name", "Assigned Grader", "Grader Major", "Grader Email", "Justification", "Edit"].map(header => (
                <th key={header} className="border px-4 py-2">{header}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {sortedData().map((row, index) => (
              <tr key={index} className="border">
                <td className="border px-4 py-2">{row["Course Number"]}</td>
                <td className="border px-4 py-2">{row["Professor Name"]}</td>
                <td className="border px-4 py-2">{row["Assigned Grader"]}</td>
                <td className="border px-4 py-2">{row["Grader Major"]}</td>
                <td className="border px-4 py-2">{row["Grader Email"]}</td>
                <td className="border px-4 py-2">{row["Justification"]}</td>
                <td className="border px-4 py-2 text-center">
                  <button onClick={() => openEditPopup(row, index)} className="text-blue-500 font-bold">✏️</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Edit Popup */}
      {editPopup && (
        <div className="fixed inset-0 flex justify-center items-center" style={{ backgroundColor: "rgba(0, 0, 0, 0.2)" }}>
          <div className="bg-gradient-to-br from-blue-200 to-white p-8 rounded shadow-2xl w-[700px] relative">
            <button onClick={() => setEditPopup(false)} className="absolute top-3 left-3 bg-transparent border border-gray-500 rounded p-1 text-gray-600 hover:text-gray-900">✖️</button>
            <div className="grid grid-cols-2 gap-x-8 gap-y-6">
              <Field name="Professor Name" currentRow={currentRow} handleInputChange={handleInputChange}/>
              <Field name="Course Number" label="Course #" currentRow={currentRow} handleInputChange={handleInputChange}/>
              <Field name="Assigned Grader" label="Grader Name" currentRow={currentRow} handleInputChange={handleInputChange}/>
              <Field name="Grader Major" currentRow={currentRow} handleInputChange={handleInputChange}/>
              <div className="col-span-2">
                <Field name="Grader Email" currentRow={currentRow} handleInputChange={handleInputChange} wide/>
              </div>
              <div className="flex flex-col col-span-2">
                <label className="text-blue-900">Justification:</label>
                <textarea className="border px-3 py-2 rounded h-32" name="Justification" value={currentRow["Justification"]} onChange={handleInputChange}/>
              </div>
            </div>
            <div className="flex justify-center mt-6">
              <button
                onClick={() => {
                  setData(prevData => prevData.map((item, idx) => (idx === currentRowIndex ? { ...currentRow } : item)));
                  setEditPopup(false);
                }}
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

// helper component for fields
const Field = ({ name, label, currentRow, handleInputChange, wide }) => (
  <div className={`flex items-center ${wide && 'w-full'}`}>
    <label className="text-blue-900 font-semibold w-40">{label || name}:</label>
    <input className="border px-3 py-1 rounded flex-1" type="text" name={name} value={currentRow[name]} onChange={handleInputChange}/>
  </div>
);

export default ManualEditPage;
