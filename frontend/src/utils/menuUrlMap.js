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
  { old: 'admin/printapplicationform.aspx',                 to: '/admin/candidates/print-application'   },
  { old: 'candidate/applicationform.aspx',                  to: '/candidate/application-form'   },

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
  { old: 'admin/searchcandidate.aspx',                      to: '/admin/candidates/search'              },
  { old: 'admin/changemobileemail.aspx',                    to: '/admin/candidates/change-mobile'       },
  { old: 'admin/changesecurityquestion.aspx',               to: '/admin/candidates/change-security'     },
  { old: 'admin/paymenthistory.aspx',                       to: '/admin/candidates/payment-history'     },
  { old: 'admin/printapplicationform.aspx',                 to: '/admin/candidates/print-application'   },
  { old: 'flag=resetcandidatepassword',                     to: '/admin/candidates/reset-password'      },
  { old: 'flag=checkpaymenthistory',                        to: '/admin/candidates/payment-history'     },
  { old: 'flag=printapplicationform',                       to: '/admin/candidates/print-application'   },
  { old: 'flag=changemobilemail',                           to: '/admin/candidates/change-mobile'       },
  { old: 'flag=changesecurityquestion',                     to: '/admin/candidates/change-security'     },
  // Direct CheckApplicationID.aspx flag mappings (more specific — must come before generic checkapplicationid)
  { old: 'checkapplicationid.aspx?flag=changemobilemail',   to: '/admin/candidates/change-mobile'       },
  { old: 'checkapplicationid.aspx?flag=changesecurityquestion', to: '/admin/candidates/change-security' },
  { old: 'checkapplicationid.aspx?flag=checkpaymenthistory',    to: '/admin/candidates/payment-history' },
  { old: 'checkapplicationid.aspx?flag=printapplicationform',   to: '/admin/candidates/print-application'},
  { old: 'checkapplicationid.aspx?flag=resetcandidatepassword', to: '/admin/candidates/reset-password'  },
  { old: 'administration/managenotifications.aspx',         to: '/admin/notifications'              },
  { old: 'administration/manageactivitystatus.aspx',        to: '/admin/activity-status'                },
  { old: 'administration/manageadmissionschedule.aspx',     to: '/admin/admission-schedule'             },
  { old: 'administration/manageusers.aspx',                 to: '/admin/users'                          },
  { old: 'administration/manageprojectconfiguration.aspx',  to: '/admin/config'                         },
  { old: 'administration/managereports.aspx',               to: '/admin/reports'                        },
  { old: 'administration/manageevc.aspx',                   to: '/admin/evc'                            },
  { old: 'administration/managesubevc.aspx',                to: '/admin/sub-evc'                        },
  { old: 'administration/managephase.aspx',                 to: '/admin/phases'                         },

  // ── EVerification ──────────────────────────────────────────────────────────
  { old: 'everification/candidatelistforeverification.aspx', to: '/everification/candidates'              },
  { old: 'everification/checkapplicationid.aspx',            to: '/everification/check'                   },
  { old: 'everification/everifydocuments.aspx',              to: '/everification/verify'                  },
  { old: 'dashboard/dashboardeverification.aspx',            to: '/everification/dashboard'               },

  // ── EVC Application Form menu (via Admin/CheckApplicationID.aspx flags) ───
  { old: 'flag=everification',                               to: '/everification/check'                   },
  { old: 'flag=checkdocumentverificationstatus',             to: '/everification/candidate-action/doc-status'     },
  // Note: admin/checkapplicationid.aspx is intentionally NOT mapped here
  // because the Flag= parameter determines the actual destination (mapped above)

  // ── EVC Reports ────────────────────────────────────────────────────────────
  { old: 'reports/candidateseligibleforeverification.aspx',  to: '/everification/reports/eligible'        },
  { old: 'reports/evcwisereport.aspx',                       to: '/everification/reports/evc-wise'        },
  { old: 'reports/evcwisecandidatelist.aspx',                to: '/everification/reports/evc-candidates'  },

  // ── EVC Miscellaneous ──────────────────────────────────────────────────────
  { old: 'administration/editprofile.aspx',                  to: '/college/misc/update-profile'           },
  // Note: candidate/changepassword → /candidate/change-password (already mapped above)
  // EVC reuses the same routes — allowed via role [41,42] on those routes

  // ── EVC Administration (UserTypeID 41 only) ────────────────────────────────
  { old: 'administration/managesubevc.aspx',                 to: '/everification/manage-sub-evc'          },
  { old: 'administration/subEVCdetails.aspx',                to: '/everification/manage-sub-evc'          },
  { old: 'menu/menuhome.aspx',                              to: '/admin/menu'                           },
  { old: 'administration/resetapplicationvariables.aspx',   to: '/admin/reset-variables'                },
  { old: 'admin/searchcandidate.aspx',                      to: '/admin/candidates/search'              },
  { old: 'admin/resetcandidatepassword.aspx',               to: '/admin/candidates/reset-password'      },
  { old: 'admin/checkdocumentverificationstatus.aspx',      to: '/admin/candidates/doc-status'          },
  // admin/checkapplicationid.aspx with no flag → search page (fallback only)
  // Note: flag-specific entries above handle Flag=ChangeMobileEMail etc.
  { old: 'admin/checkapplicationid.aspx',                   to: '/admin/candidates/search'              },
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

/**
 * EVC-specific URL map — overrides for EVC users (UserTypeID 41/42).
 * These URLs appear in the EVC navbar but must route to EVC-scoped pages
 * instead of candidate/admin pages.
 * Used only by EVerificationLayout.
 */
const EVC_URL_MAP = [
  // EVerification core pages
  { old: 'everification/candidatelistforeverification.aspx', to: '/everification/candidates'              },
  { old: 'everification/checkapplicationid.aspx',            to: '/everification/check'                   },
  { old: 'everification/everifydocuments.aspx',              to: '/everification/verify'                  },
  { old: 'dashboard/dashboardeverification.aspx',            to: '/everification/dashboard'               },
  { old: 'flag=everification',                               to: '/everification/check'                   },

  // Application Form menu flags → EVC candidate-action pages
  { old: 'flag=printapplicationform',                        to: '/everification/candidate-action'        },
  { old: 'flag=changemobilemail',                            to: '/everification/candidate-action'        },
  { old: 'flag=changesecurityquestion',                      to: '/everification/candidate-action'        },
  { old: 'flag=resetcandidatepassword',                      to: '/everification/candidate-action'        },
  { old: 'flag=checkdocumentverificationstatus',             to: '/everification/candidate-action/doc-status' },
  { old: 'admin/checkapplicationid.aspx',                    to: '/everification/candidate-action'        },
  { old: 'admin/searchcandidate.aspx',                       to: '/everification/candidate-action'        },

  // Reports
  { old: 'reports/candidateseligibleforeverification.aspx',  to: '/everification/reports/eligible'        },
  { old: 'reports/evcwisereport.aspx',                       to: '/everification/reports/evc-wise'        },
  { old: 'reports/evcwisecandidatelist.aspx',                to: '/everification/reports/evc-candidates'  },

  // Miscellaneous — EVC-scoped routes with EVerificationLayout
  { old: 'candidate/changepassword.aspx',                    to: '/everification/misc/change-password'    },
  { old: 'candidate/changesecurityquestion.aspx',            to: '/everification/misc/change-security-question' },
  { old: 'administration/editprofile.aspx',                  to: '/everification/misc/update-profile'     },
  { old: 'administration/editUserprofile.aspx',              to: '/everification/misc/update-profile'     },

  // Administration (UserTypeID 41 only)
  { old: 'administration/managesubevc.aspx',                 to: '/everification/manage-sub-evc'          },
  { old: 'administration/subEVCdetails.aspx',                to: '/everification/manage-sub-evc'          },
]

/**
 * EVC-specific URL mapper — use this in EVerificationLayout instead of mapUrl().
 * Checks EVC_URL_MAP first, then falls back to the general URL_MAP.
 */
export function mapUrlForEVC(oldUrl) {
  if (!oldUrl || oldUrl === '#') return '#'
  if (oldUrl.startsWith('http://') || oldUrl.startsWith('https://')) return oldUrl

  const lower = oldUrl.toLowerCase()

  // Check EVC-specific map first (longest match wins)
  const sortedEvc = [...EVC_URL_MAP].sort((a, b) => b.old.length - a.old.length)
  const evcMatch = sortedEvc.find(entry => lower.includes(entry.old.toLowerCase()))
  if (evcMatch) return evcMatch.to

  // Fall back to general map (longest match wins)
  const sorted = [...URL_MAP].sort((a, b) => b.old.length - a.old.length)
  const match = sorted.find(entry => lower.includes(entry.old.toLowerCase()))
  if (match) return match.to

  return '#'
}
