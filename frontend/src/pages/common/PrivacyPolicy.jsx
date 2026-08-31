import React from "react";

/**
 * PrivacyPolicy
 * React + Tailwind CSS equivalent of PrivacyPolicy.aspx
 * (content-only — header/nav/footer are provided by the shared MasterPage layout,
 * same as the original ASPX ContentPlaceHolder pattern)
 */
export default function PrivacyPolicy() {
  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-12">
      <div className="bg-white rounded-2xl shadow-[0_0_0_1px_rgba(15,23,42,0.05),0_4px_6px_-1px_rgba(15,23,42,0.05)] overflow-hidden border border-slate-200">

        {/* Card Header */}
        <div className="bg-gradient-to-r from-emerald-600 to-emerald-500 px-6 sm:px-8 py-4 flex items-center gap-3">
          <i className="fa-solid fa-user-shield text-white text-lg" aria-hidden="true" />
          <h1 className="text-white font-bold text-base sm:text-lg tracking-wide">
            Privacy Policy
          </h1>
        </div>

        {/* Card Body */}
        <div className="p-6 sm:p-8">
          <p className="text-sm sm:text-[15px] text-slate-700 leading-relaxed text-justify">
            MPKV Portal does not automatically capture any specific personal information
            from you, (like name, phone number or e-mail address), that allows us to
            identify you individually. If the MPKV Portal requests you to provide personal
            information, you will be informed for the particular purposes for which the
            information is gathered and adequate security measures will be taken to protect
            your personal information. We do not sell or share any personally identifiable
            information volunteered on the MPKV Portal site to any third party
            (public/private). Any information provided to this Portal will be protected
            from loss, misuse, unauthorized access or disclosure, alteration, or
            destruction. We gather certain information about the User, such as Internet
            Protocol (IP) addresses, domain name, browser type, operating system, the date
            and time of the visit and the pages visited. We make no attempt to link these
            addresses with the identity of individuals visiting our site unless an attempt
            to damage the site has been detected.
          </p>
        </div>
      </div>
    </div>
  );
}