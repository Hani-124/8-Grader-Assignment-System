import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";

function LoginPage() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [storedUsernames, setStoredUsernames] = useState([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const saved = JSON.parse(localStorage.getItem("savedUsernames") || "[]");
    setStoredUsernames(saved);
  }, []);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (username === "ADMIN" && password === "admin") {
      const updated = [username, ...storedUsernames.filter((u) => u !== username)];
      localStorage.setItem("savedUsernames", JSON.stringify(updated));
      setStoredUsernames(updated);
      navigate("/upload");
    } else {
      alert("Invalid credentials!");
    }
  };

  return (
    <div className="min-h-screen w-screen relative bg-white overflow-hidden flex items-center justify-center px-4 font-poppins">
      {/* Background Gradient Blur */}
      <div className="absolute inset-0 w-full h-full">
        <div className="absolute left-[-20%] top-0 w-[60%] h-full bg-gradient-to-br from-blue-700 via-blue-500 to-transparent blur-[100px]" />
      </div>

      <div className="relative z-10 w-full max-w-7xl px-4 flex flex-col lg:flex-row items-center justify-between gap-6">
        {/* Left Intro */}
        <div className="flex-1 text-left hidden lg:block font-poppins">
          <h1 className="text-4xl font-extrabold text-white drop-shadow mb-4">
            Welcome to GraderMatch 
            <br/><br/>
          </h1>
          <p className="text-white text-lg leading-relaxed drop-shadow max-w-md">
            An intelligent assignment system that automatically matches the best student graders
            to the right courses based on skills, background, and preferences.
          </p>
        </div>

        {/* Login Form */}
        <div className="flex-1 flex justify-center">
          <div className="w-full max-w-sm p-10 bg-white/90 backdrop-blur-sm rounded-xl shadow-xl">
            <h1 className="text-2xl font-bold text-center text-black mb-6">Log In</h1>

            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Username */}
              <div className="relative">
                <input
                  type="text"
                  placeholder="USERNAME"
                  value={username}
                  onChange={(e) => setUsername(e.target.value.toUpperCase())}
                  onFocus={() => setShowDropdown(true)}
                  onBlur={() => setTimeout(() => setShowDropdown(false), 100)}
                  className="w-full px-3 py-2 border-2 border-blue-300 text-black text-base font-medium bg-transparent
                             placeholder-blue-400 placeholder:text-sm placeholder:font-light
                             focus:ring-2 focus:ring-blue-400 focus:outline-none 
                             shadow-sm rounded-md uppercase"
                />
                {showDropdown && storedUsernames.length > 0 && (
                  <div className="absolute top-full mt-1 w-full bg-white border border-blue-200 shadow-md rounded-md z-20">
                    {storedUsernames.map((name, idx) => (
                      <div
                        key={idx}
                        onMouseDown={() => setUsername(name.toUpperCase())}
                        className="px-3 py-2 hover:bg-blue-100 cursor-pointer text-sm text-blue-600"
                      >
                        {name}
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Password */}
              <div className="relative">
                <input
                  type="password"
                  placeholder="PASSWORD"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-3 py-2 border-2 border-blue-300 text-black text-base font-medium bg-transparent
                             placeholder-blue-400 placeholder:text-sm placeholder:font-light
                             focus:ring-2 focus:ring-blue-400 focus:outline-none 
                             shadow-sm rounded-md"
                />
              </div>

              {/* Login Button */}
              <div className="flex justify-center">
                <button
                  type="submit"
                  className="w-full px-2 py-2 text-white bg-gradient-to-r from-blue-700 to-indigo-500 
                             font-medium hover:brightness-170 active:brightness-90 active:scale-[0.98]
                             transition-all duration-150 ease-in-out
                             shadow-md border border-blue-500 rounded-md"
                >
                  log in
                </button>
              </div>
            </form>

            {/* Forgot Password */}
            <div className="flex justify-end mt-2">
              <a href="#" className="text-blue-400 text-sm hover:underline">
                Forgot password?
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default LoginPage;
