import React from "react";

/**
 * Disclaimer
 * React + Tailwind CSS equivalent of Disclaimer.aspx
 * (content-only — header/nav/footer are provided by the shared MasterPage layout,
 * same as the original ASPX ContentPlaceHolder pattern)
 */
export default function Disclaimer() {
  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-12">
      <div className="bg-white rounded-2xl shadow-[0_0_0_1px_rgba(15,23,42,0.05),0_4px_6px_-1px_rgba(15,23,42,0.05)] overflow-hidden border border-slate-200">

        {/* Card Header */}
        <div className="bg-gradient-to-r from-emerald-600 to-emerald-500 px-6 sm:px-8 py-4 flex items-center gap-3">
          <i className="fa-solid fa-circle-exclamation text-white text-lg" aria-hidden="true" />
          <h1 className="text-white font-bold text-base sm:text-lg tracking-wide">
            Disclaimer
          </h1>
        </div>

        {/* Card Body */}
        <div className="p-6 sm:p-8">
          <p className="text-sm sm:text-[15px] text-slate-700 leading-relaxed text-justify">
            The information on this website does not warrant or assume any
            legal liability or responsibility for the accuracy, completeness
            or usefulness of any information. The information is for
            noncommercial purpose such as teaching, research and extension.
            By using our website, you agree to all disclaimers in terms of
            use governing this website.
          </p>
        </div>
      </div>
    </div>
  );
}