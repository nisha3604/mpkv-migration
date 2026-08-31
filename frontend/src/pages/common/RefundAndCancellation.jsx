import React from "react";

/**
 * RefundAndCancellationPolicy
 * React + Tailwind CSS equivalent of RefundAndCancellationPolicy.aspx
 * (content-only — header/nav/footer are provided by the shared MasterPage layout,
 * same as the original ASPX ContentPlaceHolder pattern)
 */
export default function RefundAndCancellationPolicy() {
  const clauses = [
    {
      title: "Cancellation",
      text: "This is not applicable, as payment once done towards registration is non-refundable and hence cannot be cancelled.",
    },
    {
      title: "Returns",
      text: "This is not applicable, as payment once done towards registration is non-refundable and hence cannot be cancelled.",
    },
    {
      title: "Refund for Duplicate Payment",
      text: (
        <>
          If in any case, the payment towards a unique registration gets
          deducted more than once, in such cases the amount will be refunded
          automatically within 7 working days without requiring any action at
          your end. In case of any delay, the user may reach out to our
          customer support team at{" "}
          <span className="font-bold text-slate-800">
            noreply.mpkv@gmail.com / 7066951951
          </span>
          . And the refund will be initiated after proper scrutiny of the
          transaction done by the user.
        </>
      ),
    },
  ];

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-12">
      <div className="bg-white rounded-2xl shadow-[0_0_0_1px_rgba(15,23,42,0.05),0_4px_6px_-1px_rgba(15,23,42,0.05)] overflow-hidden border border-slate-200">

        {/* Card Header */}
        <div className="bg-gradient-to-r from-emerald-600 to-emerald-500 px-6 sm:px-8 py-4 flex items-center gap-3">
          <i className="fa-solid fa-money-bill-transfer text-white text-lg" aria-hidden="true" />
          <h1 className="text-white font-bold text-base sm:text-lg tracking-wide">
            Cancellation, Returns &amp; Refund Policy
          </h1>
        </div>

        {/* Card Body */}
        <div className="p-6 sm:p-8 space-y-6">
          <p className="text-sm sm:text-[15px] text-slate-700 leading-relaxed text-justify">
            We value your trust. We understand that there may be situations
            where you need to cancel a transaction or request a refund. This
            policy outlines our guidelines for Cancellation, Returns &amp;
            Refund to ensure transparency and compliance.
          </p>

          <div>
            <p className="text-sm sm:text-[15px] font-bold text-slate-800 mb-3">
              Terms &amp; Conditions of Service :
            </p>

            <ol className="space-y-4">
              {clauses.map((clause, index) => (
                <li key={clause.title} className="flex gap-3">
                  <span className="flex-shrink-0 w-6 h-6 rounded-full bg-emerald-50 border border-emerald-100 text-emerald-700 text-xs font-bold flex items-center justify-center mt-0.5">
                    {index + 1}
                  </span>
                  <p className="text-sm sm:text-[15px] text-slate-700 leading-relaxed text-justify">
                    <span className="font-bold text-slate-800">{clause.title} : </span>
                    {clause.text}
                  </p>
                </li>
              ))}
            </ol>
          </div>

          {/* Contact Us Note */}
          <div className="flex items-start gap-3 bg-amber-50 border border-amber-200 rounded-xl p-4">
            <i className="fa-solid fa-circle-info text-amber-500 mt-0.5" aria-hidden="true" />
            <p className="text-xs sm:text-sm text-amber-700 leading-relaxed">
              <span className="font-bold">Contact Us :</span> If you have any
              questions or concerns regarding our Cancellation / Return /
              Refund Status or Transaction Status please reach out to our
              customer support team at{" "}
              <a
                href="mailto:noreply.mpkv@gmail.com"
                className="font-bold underline decoration-amber-400 hover:text-amber-800"
              >
                noreply.mpkv@gmail.com
              </a>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}