import { useLocation } from "react-router-dom";
import { useEffect } from "react";

const NotFound = () => {
  const location = useLocation();

  useEffect(() => {
    console.error("404 Error: User attempted to access non-existent route:", location.pathname);
  }, [location.pathname]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-b from-[#014f35] via-[#1a7d52] to-[#d4f1e8]">
      <div className="text-center">
        <h1 className="mb-4 text-4xl font-bold text-white drop-shadow-lg">404</h1>
        <p className="mb-4 text-xl text-white/90">Oops! Page not found</p>
        <a href="/" className="inline-block px-6 py-2 bg-white text-[#014f35] rounded-lg font-semibold hover:bg-white/90 transition-colors duration-150 shadow-lg">
          Return to Home
        </a>
      </div>
    </div>
  );
};

export default NotFound;
