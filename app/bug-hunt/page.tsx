
// Bug hunt creation is now only available at /admin/bug-hunts for admins.
// This page can be used for bug hunt info, listing, or redirect.

export default function BugHuntPage() {
  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="max-w-md p-8 rounded-lg shadow bg-card">
        <h2 className="text-2xl font-bold mb-4 text-center">Bug Hunt Section</h2>
        <p className="text-muted-foreground text-center">Bug hunt creation is only available to admins at <b>/admin/bug-hunts</b>.</p>
      </div>
    </div>
  )
}
