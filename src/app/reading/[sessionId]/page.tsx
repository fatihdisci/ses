// Phase 3: Results page — mystical reading + care advice + paywall
export default function ReadingPage({
  params,
}: {
  params: { sessionId: string }
}) {
  return (
    <main>
      <p>Session: {params.sessionId}</p>
    </main>
  )
}
