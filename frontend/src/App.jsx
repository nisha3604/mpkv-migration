import { Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider } from './context/AuthContext'
import ProtectedRoute   from './components/ProtectedRoute'
import PublicLayout     from './components/PublicLayout'
import CandidateLayout  from './components/CandidateLayout'
import CollegeLayout    from './components/CollegeLayout'

// ── Common pages ──────────────────────────────────────────────────────────────
import Home             from './pages/common/Home'
import Login            from './pages/common/Login'
import Registration     from './pages/common/Registration'
import RegistrationInfo from './pages/common/RegistrationInfo'
import ForgotLoginId    from './pages/common/ForgotLoginId'
import ForgotPassword   from './pages/common/ForgotPassword'
import ResetPassword    from './pages/common/ResetPassword'
import Unauthorized     from './pages/common/Unauthorized'
import NotFound         from './pages/common/NotFound'

// ── Candidate pages (UserTypeID = 91) ─────────────────────────────────────────
import CandidateDashboard  from './pages/candidate/Dashboard'
import Personal            from './pages/candidate/Personal'
import Address             from './pages/candidate/Address'
import Category            from './pages/candidate/Category'
import Qualification       from './pages/candidate/Qualification'
import Sports              from './pages/candidate/Sports'
import Shortlist           from './pages/candidate/Shortlist'
import SetPreferences      from './pages/candidate/SetPreferences'
import PhotoSign           from './pages/candidate/PhotoSign'
import Documents           from './pages/candidate/Documents'
import Fee                 from './pages/candidate/Fee'
import PaymentSuccess      from './pages/candidate/PaymentSuccess'
import PaymentFailed       from './pages/candidate/PaymentFailed'

// ── College pages (UserTypeID = 61) ───────────────────────────────────────────
import CollegeDashboard    from './pages/college/Dashboard'
import CollegeSummary      from './pages/college/Summary'
import CollegeEdit         from './pages/college/EditDetails'

// ── Admin pages (UserTypeID = 11 / 12) ────────────────────────────────────────
import AdminDashboard          from './pages/admin/Dashboard'
import AdminCollegeList        from './pages/admin/CollegeList'
import AdminCollegePasswords   from './pages/admin/CollegePasswords'
import AdminResetPassword      from './pages/admin/ResetCollegePassword'

// Admin also reuses college summary + edit with a collegeId query param
// (same component, role-checked inside the component)

// ── Coming-soon placeholder ───────────────────────────────────────────────────
function ComingSoon({ title }) {
  return (
    <div className="min-h-[50vh] flex items-center justify-center">
      <div className="text-center">
        <div className="w-14 h-14 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <i className="fas fa-tools text-emerald-600 text-xl" />
        </div>
        <h2 className="text-xl font-bold text-gray-700 mb-2">{title}</h2>
        <p className="text-gray-400 text-sm">This page is coming soon.</p>
      </div>
    </div>
  )
}

export default function App() {
  return (
    <AuthProvider>
      <Routes>

        {/* ── Public routes (no auth required) ──────────────────────────── */}
        <Route path="/"               element={<Home />} />
        <Route path="/login"          element={<Login />} />
        <Route path="/register"       element={<Registration />} />
        <Route path="/register/info"  element={<RegistrationInfo />} />
        <Route path="/forgot-login-id"   element={<ForgotLoginId />} />
        <Route path="/forgot-password"   element={<ForgotPassword />} />
        <Route path="/reset-password"    element={<ResetPassword />} />
        <Route path="/unauthorized"   element={<Unauthorized />} />

        {/* Public static pages */}
        <Route path="/search-college" element={<PublicLayout><ComingSoon title="Search Colleges" /></PublicLayout>} />
        <Route path="/allotment"      element={<PublicLayout><ComingSoon title="Allotment List" /></PublicLayout>} />
        <Route path="/about"          element={<PublicLayout><ComingSoon title="About Us" /></PublicLayout>} />
        <Route path="/terms"          element={<PublicLayout><ComingSoon title="Terms & Conditions" /></PublicLayout>} />
        <Route path="/privacy"        element={<PublicLayout><ComingSoon title="Privacy Policy" /></PublicLayout>} />
        <Route path="/refund"         element={<PublicLayout><ComingSoon title="Refund & Cancellation" /></PublicLayout>} />
        <Route path="/disclaimer"     element={<PublicLayout><ComingSoon title="Disclaimer" /></PublicLayout>} />

        {/* Payment gateway callbacks — no auth, no layout (browser redirect from gateway) */}
        <Route path="/payment-success" element={<PaymentSuccess />} />
        <Route path="/payment-failed"  element={<PaymentFailed />} />

        {/* ── Candidate routes (UserTypeID = 91) ────────────────────────── */}
        <Route path="/candidate/dashboard"
          element={<ProtectedRoute allowedRoles={[91]}><CandidateLayout><CandidateDashboard /></CandidateLayout></ProtectedRoute>} />
        <Route path="/candidate/personal"
          element={<ProtectedRoute allowedRoles={[91]}><CandidateLayout><Personal /></CandidateLayout></ProtectedRoute>} />
        <Route path="/candidate/address"
          element={<ProtectedRoute allowedRoles={[91]}><CandidateLayout><Address /></CandidateLayout></ProtectedRoute>} />
        <Route path="/candidate/category"
          element={<ProtectedRoute allowedRoles={[91]}><CandidateLayout><Category /></CandidateLayout></ProtectedRoute>} />
        <Route path="/candidate/qualification"
          element={<ProtectedRoute allowedRoles={[91]}><CandidateLayout><Qualification /></CandidateLayout></ProtectedRoute>} />
        <Route path="/candidate/sports"
          element={<ProtectedRoute allowedRoles={[91]}><CandidateLayout><Sports /></CandidateLayout></ProtectedRoute>} />
        <Route path="/candidate/shortlist"
          element={<ProtectedRoute allowedRoles={[91]}><CandidateLayout><Shortlist /></CandidateLayout></ProtectedRoute>} />
        <Route path="/candidate/preferences"
          element={<ProtectedRoute allowedRoles={[91]}><CandidateLayout><SetPreferences /></CandidateLayout></ProtectedRoute>} />
        <Route path="/candidate/photo-sign"
          element={<ProtectedRoute allowedRoles={[91]}><CandidateLayout><PhotoSign /></CandidateLayout></ProtectedRoute>} />
        <Route path="/candidate/documents"
          element={<ProtectedRoute allowedRoles={[91]}><CandidateLayout><Documents /></CandidateLayout></ProtectedRoute>} />
        <Route path="/candidate/fee"
          element={<ProtectedRoute allowedRoles={[91]}><CandidateLayout><Fee /></CandidateLayout></ProtectedRoute>} />
        <Route path="/candidate/summary"
          element={<ProtectedRoute allowedRoles={[91]}><CandidateLayout><ComingSoon title="Application Summary" /></CandidateLayout></ProtectedRoute>} />

        {/* ── College routes (UserTypeID = 61) ──────────────────────────── */}
        <Route path="/college/dashboard"
          element={<ProtectedRoute allowedRoles={[61]}><CollegeLayout><CollegeDashboard /></CollegeLayout></ProtectedRoute>} />
        <Route path="/college/summary"
          element={<ProtectedRoute allowedRoles={[61]}><CollegeLayout><CollegeSummary /></CollegeLayout></ProtectedRoute>} />
        <Route path="/college/edit"
          element={<ProtectedRoute allowedRoles={[61]}><CollegeLayout><CollegeEdit /></CollegeLayout></ProtectedRoute>} />

        {/* ── Admin routes (UserTypeID = 11 or 12) ──────────────────────── */}
        <Route path="/admin/dashboard"
          element={<ProtectedRoute allowedRoles={[11,12]}><CollegeLayout><AdminDashboard /></CollegeLayout></ProtectedRoute>} />
        <Route path="/admin/college/list"
          element={<ProtectedRoute allowedRoles={[11,12]}><CollegeLayout><AdminCollegeList /></CollegeLayout></ProtectedRoute>} />
        {/* Admin college summary — same component as college summary, accepts ?collegeId= */}
        <Route path="/admin/college/summary"
          element={<ProtectedRoute allowedRoles={[11,12]}><CollegeLayout><CollegeSummary /></CollegeLayout></ProtectedRoute>} />
        {/* Admin college edit — same component as college edit, accepts ?collegeId= */}
        <Route path="/admin/college/edit"
          element={<ProtectedRoute allowedRoles={[11,12]}><CollegeLayout><CollegeEdit /></CollegeLayout></ProtectedRoute>} />
        <Route path="/admin/college/passwords"
          element={<ProtectedRoute allowedRoles={[11,12]}><CollegeLayout><AdminCollegePasswords /></CollegeLayout></ProtectedRoute>} />
        <Route path="/admin/college/reset-password"
          element={<ProtectedRoute allowedRoles={[11,12]}><CollegeLayout><AdminResetPassword /></CollegeLayout></ProtectedRoute>} />

        {/* 404 fallback */}
        <Route path="*" element={<NotFound />} />

      </Routes>
    </AuthProvider>
  )
}
