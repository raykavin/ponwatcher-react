import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";

const FormPage = ({ onSubmit }) => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    slot: "",
    card: "",
    olt: "",
  });
  const [isAnimating, setIsAnimating] = useState(false);

  // Add subtle hover animation when component mounts
  useEffect(() => {
    setIsAnimating(true);
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    // Validate required fields
    if (!formData.slot || !formData.card || !formData.olt) {
      alert("Por favor, preencha todos os campos obrigatórios.");
      return;
    }

    onSubmit(formData);
    navigate("/status");
  };

  // Dados mockados para o dropdown
  const oltOptions = [
    { value: "", label: "SELECIONE UMA OLT" },
    { value: "1", label: "10.100.2.1" },
    { value: "2", label: "10.100.2.2" },
    { value: "3", label: "10.100.2.3" },
    { value: "4", label: "10.100.2.4" },
    { value: "5", label: "10.100.2.5" },
    { value: "6", label: "10.100.2.6" },
  ];

  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-4 sm:p-6 lg:p-8 bg-gray-900">
      <div
        className={`bg-gray-800 p-4 sm:p-6 lg:p-8 rounded-lg border border-cyan-400 shadow-lg shadow-cyan-400/20 w-full max-w-[90%] sm:max-w-sm md:max-w-md lg:max-w-lg xl:max-w-xl transform transition-transform duration-700 ${
          isAnimating
            ? "translate-y-0 opacity-100"
            : "-translate-y-10 opacity-0"
        }`}
      >
        {/* Header Section */}
        <div className="flex flex-col items-start gap-2 sm:gap-3 mb-4 sm:mb-6">
          <img
            src="/assets/images/logo.svg"
            alt="Logo"
            className="w-48 sm:w-56 md:w-64 object-contain"
          />
          <hr className="border-1 w-full border-cyan-400" />
          <div className="flex w-full justify-between items-center">
            <div className="flex flex-col">
              <h1 className="text-lg sm:text-xl lg:text-2xl font-bold text-cyan-400 tracking-wider">
                PON Watcher
              </h1>
              <p className="text-xs sm:text-sm text-gray-400 mt-1">
                Monitoramento Óptico Inteligente
              </p>
            </div>
            <img
              src="/assets/images/fiber-icon.svg"
              alt="Fiber Icon"
              className="w-12 sm:w-14 md:w-16 object-contain"
            />
          </div>
          <hr className="border-1 w-full border-cyan-400" />
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-6">
          {/* OLT Dropdown */}
          <div className="space-y-2">
            <label className="block text-cyan-400 tracking-wide text-sm sm:text-base">
              OLT: <span className="text-red-400">*</span>
            </label>
            <select
              name="olt"
              value={formData.olt}
              onChange={handleChange}
              className="w-full bg-gray-700 border-2 border-cyan-600 rounded-md p-2 sm:p-3 text-cyan-100 text-sm sm:text-base focus:outline-none focus:ring-2 focus:ring-cyan-400 focus:border-transparent transition-all duration-300 appearance-none cursor-pointer"
              required
            >
              {oltOptions.map((option) => (
                <option
                  key={option.value}
                  value={option.value}
                  className="bg-gray-700 text-cyan-100"
                >
                  {option.label}
                </option>
              ))}
            </select>
          </div>

          {/* Form Fields Grid - Responsive */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-3">
            {/* SHELF */}
            <div className="space-y-2">
              <label className="block text-cyan-400 tracking-wide text-xs sm:text-sm">
                SHELF:
              </label>
              <input
                readOnly
                type="text"
                value="NA"
                className="w-full bg-gray-700 border-2 border-cyan-600 rounded-md p-2 sm:p-3 text-cyan-100 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-cyan-400 focus:border-transparent transition-all duration-300"
              />
            </div>

            {/* CHASSIS */}
            <div className="space-y-2">
              <label className="block text-cyan-400 tracking-wide text-xs sm:text-sm">
                CHASSIS:
              </label>
              <input
                readOnly
                type="text"
                value="NA"
                className="w-full bg-gray-700 border-2 border-cyan-600 rounded-md p-2 sm:p-3 text-cyan-100 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-cyan-400 focus:border-transparent transition-all duration-300"
              />
            </div>

            {/* SLOT */}
            <div className="space-y-2">
              <label className="block text-cyan-400 tracking-wide text-xs sm:text-sm">
                SLOT: <span className="text-red-400">*</span>
              </label>
              <input
                type="text"
                name="slot"
                value={formData.slot}
                onChange={handleChange}
                className="w-full bg-gray-700 border-2 border-cyan-600 rounded-md p-2 sm:p-3 text-cyan-100 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-cyan-400 focus:border-transparent transition-all duration-300"
                required
                placeholder="Ex: 3"
              />
            </div>

            {/* PON */}
            <div className="space-y-2">
              <label className="block text-cyan-400 tracking-wide text-xs sm:text-sm">
                PON: <span className="text-red-400">*</span>
              </label>
              <input
                type="text"
                name="card"
                value={formData.card}
                onChange={handleChange}
                className="w-full bg-gray-700 border-2 border-cyan-600 rounded-md p-2 sm:p-3 text-cyan-100 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-cyan-400 focus:border-transparent transition-all duration-300"
                required
                placeholder="Ex: 4"
              />
            </div>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            className="w-full bg-cyan-700 hover:bg-cyan-600 text-white font-bold py-2 sm:py-3 px-4 rounded-md transition-all duration-300 border border-cyan-400 hover:shadow-lg hover:shadow-cyan-400/50 text-sm sm:text-base"
          >
            Continuar
          </button>
        </form>
      </div>

      {/* Decorative tech elements - Visible on all screens */}
      <div className="absolute top-6 left-6 sm:top-10 sm:left-10 w-12 sm:w-16 md:w-20 h-1 bg-cyan-400 opacity-70"></div>
      <div className="absolute bottom-6 right-6 sm:bottom-10 sm:right-10 w-12 sm:w-16 md:w-20 h-1 bg-cyan-400 opacity-70"></div>
      <div className="absolute top-12 right-12 sm:top-20 sm:right-20 w-1 h-12 sm:h-16 md:h-20 bg-cyan-400 opacity-70"></div>
      <div className="absolute bottom-12 left-12 sm:bottom-20 sm:left-20 w-1 h-12 sm:h-16 md:h-20 bg-cyan-400 opacity-70"></div>
    </div>
  );
};

export default FormPage;
