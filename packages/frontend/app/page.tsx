export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-24">
      <div className="z-10 w-full max-w-5xl items-center justify-between font-mono text-sm">
        <h1 className="text-4xl font-bold mb-8 text-center">
          Welcome to Fedify Showcase
        </h1>
        <p className="text-center text-gray-600 dark:text-gray-400 mb-8">
          A federated social platform powered by ActivityPub
        </p>
        <div className="flex gap-4 justify-center">
          <a
            href="/auth/signin"
            className="rounded-lg bg-blue-600 px-4 py-2 text-white hover:bg-blue-700 transition-colors"
          >
            Sign In
          </a>
          <a
            href="/auth/signup"
            className="rounded-lg border border-gray-300 px-4 py-2 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
          >
            Sign Up
          </a>
          <a
            href="/timeline"
            className="rounded-lg border border-gray-300 px-4 py-2 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
          >
            Public Timeline
          </a>
        </div>
      </div>
    </main>
  )
}