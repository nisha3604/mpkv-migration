import CandidateNavbar from './CandidateNavbar'
import SiteFooter      from './SiteFooter'

/**
 * CandidateLayout — wraps all candidate pages.
 * Uses CandidateNavbar (header + dark navbar) and shared SiteFooter.
 */
export default function CandidateLayout({ children }) {
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col font-sans">
      <CandidateNavbar />
      <main className="flex-1">{children}</main>
      <SiteFooter />
    </div>
  )
}
