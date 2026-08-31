import React from "react";

/**
 * TermsAndConditions
 * React + Tailwind CSS equivalent of TermsAndConditions.aspx
 * (content-only — header/nav/footer are provided by the shared MasterPage layout,
 * same as the original ASPX ContentPlaceHolder pattern)
 */
export default function TermsAndConditions() {
  const terms = [
    {
      title: "Acceptance",
      text: "By visiting the site or using any services, you agree to these terms and conditions. If you do not agree, you may not use the site or its services.",
    },
    {
      title: "Applicability",
      text: "These terms apply to all users, including browsers, vendors, customers, merchants, and content contributors.",
    },
    {
      title: "Changes",
      text: "MPKV may update or change the Terms of Service at any time. Users are responsible for reviewing the terms regularly. Continued use of the site signifies acceptance of these changes.",
    },
    {
      title: "Additional Terms",
      text: "Any new features or tools added to the website will also be subject to these terms.",
    },
    {
      title: "Review and Acceptance",
      text: "Users must read and accept the Terms of Service before accessing or using the website, wherever applicable.",
    },
  ];

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-12">
      <div className="bg-white rounded-2xl shadow-[0_0_0_1px_rgba(15,23,42,0.05),0_4px_6px_-1px_rgba(15,23,42,0.05)] overflow-hidden border border-slate-200">

        {/* Card Header */}
        <div className="bg-gradient-to-r from-emerald-600 to-emerald-500 px-6 sm:px-8 py-4 flex items-center gap-3">
          <i className="fa-solid fa-file-contract text-white text-lg" aria-hidden="true" />
          <h1 className="text-white font-bold text-base sm:text-lg tracking-wide">
            Overview of Mahatma Phule Krishi Vidyapeeth (MPKV)
          </h1>
        </div>

        {/* Card Body */}
        <div className="p-6 sm:p-8 space-y-6">
          <p className="text-sm sm:text-[15px] text-slate-700 leading-relaxed text-justify">
            Mahatma Phule Krishi Vidyapeeth (MPKV) operates this website, which provides
            admission related information, tools, and services. The terms &ldquo;we&rdquo;,
            &ldquo;us&rdquo;, and &ldquo;our&rdquo; refer to MPKV. By accessing the site or
            using its services, you agree to the terms and conditions set forth in these
            Terms &amp; Conditions of Service.
          </p>

          <div>
            <p className="text-sm sm:text-[15px] font-bold text-slate-800 mb-3">
              Terms &amp; Conditions of Service :
            </p>

            <ol className="space-y-4">
              {terms.map((term, index) => (
                <li key={term.title} className="flex gap-3">
                  <span className="flex-shrink-0 w-6 h-6 rounded-full bg-emerald-50 border border-emerald-100 text-emerald-700 text-xs font-bold flex items-center justify-center mt-0.5">
                    {index + 1}
                  </span>
                  <p className="text-sm sm:text-[15px] text-slate-700 leading-relaxed text-justify">
                    <span className="font-bold text-slate-800">{term.title} : </span>
                    {term.text}
                  </p>
                </li>
              ))}
            </ol>
          </div>
        </div>
      </div>
    </div>
  );
}