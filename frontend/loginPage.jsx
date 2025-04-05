import { useState } from "react";
import { useNavigate } from "react-router-dom";

function LoginPage() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const navigate = useNavigate();

  const handleSubmit = (e) => {
    e.preventDefault();
    if (username === "admin" && password === "admin") {
      navigate("/upload");
    } else {
      alert("Invalid credentials!");
    }
  };

  return (
    <div className="flex items-center justify-end min-h-screen w-screen relative bg-white pr-32">
      {/* Background Gradient */}
      <div className="absolute inset-0 bg-gradient-to-br from-blue-700 via-blue-500 to-transparent 
                      w-1/2 h-full blur-[90px] left-[-10%]"></div>

      {/* Login Form */}
      <div className="relative z-10 w-full max-w-sm p-10 bg-opacity-90">
        {/* Title */}
        <h1 className="text-2xl font-semibold text-center text-blue-700 mb-6">
          Log In
        </h1>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="relative">
            <input
              type="text"
              placeholder="USERNAME"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full px-2 py-2 border-2 border-blue-500 text-blue-700 bg-transparent 
                         focus:ring-2 focus:ring-blue-500 focus:outline-none 
                         placeholder-blue-500 uppercase shadow-sm box-border"
            />
          </div>
          <div className="relative">
            <input
              type="password"
              placeholder="PASSWORD"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-2 py-2 border-2 border-blue-500 text-blue-700 bg-transparent 
                         focus:ring-2 focus:ring-blue-500 focus:outline-none 
                         placeholder-blue-500 uppercase shadow-sm box-border"
            />
          </div>

          {/* Login Button */}
          <div className="flex justify-center">
            <button
              type="submit"
              className="w-full px-2 py-2 text-white bg-gradient-to-r from-blue-700 to-indigo-500 
                         font-semibold hover:brightness-110 transition duration-200 
                         shadow-md border border-blue-500 box-border"
            >
              LOGIN
            </button>
          </div>
        </form>

        {/* Forgot Password */}
        <div className="flex justify-end mt-2">
          <a href="#" className="text-blue-600 text-sm font-medium hover:underline">
            Forgot password?
          </a>
        </div>
      </div>
    </div>
  );
}

export default LoginPage;
