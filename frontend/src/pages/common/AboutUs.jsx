import React from "react";

/**
 * AboutUs
 * React + Tailwind CSS equivalent of AboutUs.aspx
 * (content-only — header/nav/footer are provided by the shared MasterPage layout,
 * same as the original ASPX ContentPlaceHolder pattern)
 */
export default function AboutUs() {
  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-12">
      <div className="bg-white rounded-2xl shadow-[0_0_0_1px_rgba(15,23,42,0.05),0_4px_6px_-1px_rgba(15,23,42,0.05)] overflow-hidden border border-slate-200">

        {/* Card Header */}
        <div className="bg-gradient-to-r from-emerald-600 to-emerald-500 px-6 sm:px-8 py-4 flex items-center gap-3">
          <i className="fa-solid fa-landmark text-white text-lg" aria-hidden="true" />
          <h1 className="text-white font-bold text-base sm:text-lg tracking-wide">
            About Mahatma Phule Krishi Vidyapeeth (Agriculture University), Rahuri
          </h1>
        </div>

        {/* Card Body */}
        <div className="p-6 sm:p-8 space-y-4">
          <p className="text-sm sm:text-[15px] text-slate-700 leading-relaxed text-justify">
            The Mahatma Phule Krishi Vidyapeeth (MPKV), Rahuri is the premier
            Agricultural University in Maharashtra that renders services to
            the farmers through Education, Research and Extension Education.
            In pursuance of the Maharashtra Agricultural University (Krishi
            Vidyapeeth) Act 1967, initially, the Maharashtra Agricultural
            University (Krishi Vidyapeeth) was established for the entire
            Maharashtra State and started functioning in March, 1968 with its
            office at Mumbai.
          </p>

          <p className="text-sm sm:text-[15px] text-slate-700 leading-relaxed text-justify">
            The office was shifted to College of Agriculture, Pune in 1969.
            Later on in 1972, four agricultural universities were established
            in Maharashtra. Mahatma Phule Krishi Vidyapeeth, Rahuri is one of
            them established in 1969 for the western Maharashtra having
            jurisdiction spread over 10 districts viz. Jalgaon, Nandurbar,
            Dhule, Nashik, Ahilyanagar, Pune, Solapur, Satara, Sangli and
            Kolhapur. The University is named after the great social reformer
            &lsquo;Mahatma Jyotiba Phule&rsquo;.
          </p>
        </div>
      </div>
    </div>
  );
}