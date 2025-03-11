import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import LoginPage from "./loginPage";
import UploadPage from "./uploadPage";
import DisplayPage from "./displayPage";
import ManualEditPage from "./manualEditPage"; 
function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<LoginPage />} />
        <Route path="/upload" element={<UploadPage />} />
        <Route path="/display" element={<DisplayPage />} />
        <Route path="/manual-edit" element={<ManualEditPage />} />
      </Routes>
    </Router>
  );
}

export default App;
