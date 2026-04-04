import { ReadingExperience } from '@/components/reading/ReadingExperience'

// Phase 3: Results page — mystical reading + care advice + paywall
export default async function ReadingPage({
  params,
}: {
  params: Promise<{ sessionId: string }>
}) {
  const { sessionId } = await params

  return (
    <main className="mx-auto w-full max-w-4xl px-4 pb-16 pt-10 md:px-6 md:pt-14">
      <ReadingExperience sessionId={sessionId} />
    </main>
  )
}
