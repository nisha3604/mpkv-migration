/**
 * Maps old ASP.NET URLs from Menu_MasterLinks to new React routes.
 * Used by dynamic navbars (CandidateNavbar, CollegeLayout, AdminLayout).
 *
 * Keys are lowercase fragments of the old URL for loose matching.
 * Order matters — more specific entries first.
 */
const URL_MAP = [
  // ── Candidate ─────────────────────────────────────────────────────────────
  { old: 'candidate/personal.aspx',                         to: '/candidate/personal'           },
  { old: 'candidate/address.aspx',                          to: '/candidate/address'            },
  { old: 'candidate/categoryandotherreservation.aspx',       to: '/candidate/category'           },
  { old: 'candidate/qualification.aspx',                    to: '/candidate/qualification'      },
  { old: 'candidate/sportsdetails.aspx',                    to: '/candidate/sports'             },
  { old: 'candidate/shortlistoptions.aspx',                 to: '/candidate/shortlist'          },
  { old: 'candidate/setpreferences.aspx',                   to: '/candidate/preferences'        },
  { old: 'candidate/uploadphotoandsign.aspx',               to: '/candidate/photo-sign'         },
  { old: 'candidate/uploadrequireddocuments.aspx',          to: '/candidate/documents'          },
  { old: 'candidate/payapplicationfee.aspx',                to: '/candidate/fee'                },
  { old: 'candidate/applicationformsummary.aspx',           to: '/candidate/summary'            },
  { old: 'candidate/changepassword.aspx',                   to: '/candidate/change-password'    },
  { old: 'candidate/changemobilemail.aspx',                 to: '/candidate/change-mobile-email'},
  { old: 'candidate/changesecurityquestion.aspx',           to: '/candidate/change-security-question' },
  { old: 'fee/paymenthistory.aspx',                         to: '/candidate/payment-history'    },

  // ── Admission / Allotment (candidate) ─────────────────────────────────────
  { old: 'admission/checkallotmentstatus.aspx',             to: '/admission/allotment-status'   },
  { old: 'admission/allotmentsummary.aspx',                 to: '/admission/allotment-summary'  },
  { old: 'admission/paycategoryconversionfee.aspx',         to: '/admission/pay-category-fee'   },

  // ── Application Form — lock flow ──────────────────────────────────────────
  { old: 'unlock',                                          to: '/candidate/unlock-form'        },
  { old: 'applicationform.aspx',                            to: '/candidate/application-form'   },

  // ── College ───────────────────────────────────────────────────────────────
  { old: 'admission/checkallotmentstatus',                  to: '/college/admission/allotment-status'   },
  { old: 'flag=confirmadmission',                           to: '/college/admission/confirm'            },
  { old: 'flag=canceladmission',                            to: '/college/admission/cancel'             },
  { old: 'flag=printadmissionletter',                       to: '/college/admission/admission-letter'   },
  { old: 'flag=printadmissioncancellationletter',           to: '/college/admission/cancellation-letter'},
  { old: 'flag=printadmissionrejectionletter',              to: '/college/admission/rejection-letter'   },
  { old: 'reports/allotmentreportbycourse.aspx',            to: '/college/reports/allotment'            },
  { old: 'reports/compositeadmissionreportbycourse.aspx',   to: '/college/reports/composite'            },
  { old: 'reports/candidateseligibleforcounselling.aspx',   to: '/college/reports/eligible'             },
  { old: 'college/collegesummary.aspx',                     to: '/college/summary'                      },
  { old: 'flag=offerseat',                                  to: '/college/spot-round/offer-seat'        },

  // ── College Miscellaneous ──────────────────────────────────────────────────
  // Change password/security reuse candidate pages
  { old: 'administration/editprofile.aspx',                 to: '/college/misc/update-profile'          },

  // ── Admin ──────────────────────────────────────────────────────────────────
  { old: 'college/collegelist.aspx',                        to: '/admin/college/list'                   },
  { old: 'college/getcollegepassword.aspx',                 to: '/admin/college/passwords'              },
  { old: 'college/resetcollegepassword.aspx',               to: '/admin/college/reset-password'         },
  { old: 'admin/searchcandidate.aspx',                      to: '/admin/candidate/search'               },
  { old: 'flag=resetcandidatepassword',                     to: '/admin/candidate/reset-password'       },
  { old: 'flag=checkpaymenthistory',                        to: '/admin/candidate/payment-history'      },
  { old: 'flag=printapplicationform',                       to: '/admin/candidate/print-application'    },
  { old: 'administration/managenotifications.aspx',         to: '/admin/notifications'              },
  { old: 'administration/manageactivitystatus.aspx',        to: '/admin/activity-status'                },
  { old: 'administration/manageadmissionschedule.aspx',     to: '/admin/admission-schedule'             },
  { old: 'administration/manageprojectconfiguration.aspx',  to: '/admin/config'                         },
  { old: 'administration/managereports.aspx',               to: '/admin/reports'                        },
  { old: 'administration/manageusers.aspx',                 to: '/admin/users'                          },
  { old: 'menu/menuhome.aspx',                              to: '/admin/menu'                           },  { old: 'administration/resetapplicationvariables.aspx',   to: '/admin/reset-variables'                },
  { old: 'administration/manageevc.aspx',                   to: '/admin/evc'                            },
  { old: 'college/editcollegedetails.aspx',                 to: '/admin/college/add'                    },

  // ── Admin Admission (same as college but from admin role) ─────────────────
  { old: 'reports/allotmentreportbycollege.aspx',           to: '/college/reports/allotment'            },
  { old: 'reports/compositeadmissionreportbycollege.aspx',  to: '/college/reports/composite'            },
]

/**
 * Converts an old ASP.NET URL to a React route.
 * Falls back to '#' for unmapped or external (http) URLs.
 *
 * @param {string} oldUrl - LinkURL from Menu_MasterLinks
 * @returns {string} React route path or original URL for external links
 */
export function mapUrl(oldUrl) {
  if (!oldUrl || oldUrl === '#') return '#'

  // External URLs — keep as-is
  if (oldUrl.startsWith('http://') || oldUrl.startsWith('https://')) return oldUrl

  const lower = oldUrl.toLowerCase()

  // Find first matching entry (most-specific first due to map order)
  const match = URL_MAP.find(entry => lower.includes(entry.old.toLowerCase()))
  if (match) return match.to

  // Unknown — return '#' so nav doesn't break
  return '#'
}

/**
 * Checks if a menu item is a group header (dropdown, no actual navigation).
 * LinkURL is '#' for all group items.
 */
export function isGroupItem(linkUrl) {
  return !linkUrl || linkUrl === '#'
}
