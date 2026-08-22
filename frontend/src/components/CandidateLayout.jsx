// Copied from MpkvCandidate — exact same component
import Navbar from './Navbar'

export default function CandidateLayout({ children }) {
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col font-sans">
      <Navbar />
      <main className="flex-1">{children}</main>
    </div>
  )
}
