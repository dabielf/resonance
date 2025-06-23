import { createFileRoute } from '@tanstack/react-router'
import { useUser, useAuth } from "@clerk/clerk-react"
import { Navigate } from "@tanstack/react-router"
import { useState } from 'react'
import { Button } from "@/components/ui/button"

export const Route = createFileRoute('/app/settings')({
  component: RouteComponent,
})

function RouteComponent() {
  const { isLoaded,user } = useUser()
  const { getToken } = useAuth()
  const [token, setToken] = useState<string | null>(null)

  if (!isLoaded) {
    return null;
  }

  if (isLoaded && !user) {
    return <Navigate to="/" />;
  }

  async function getUserToken() {
    const token = await getToken()
    console.log(token)
    setToken(token)
  }

  return (
  <div className="flex flex-col gap-2 overflow-auto">
    <Button onClick={() => getUserToken()}>Get Token</Button>
    <pre className='text-xs'>{token || "No token"}</pre>
    <pre className='text-xs text-wrap whitespace-pre-wrap'><code className="text-wrap">{JSON.stringify(user, null, 2)}</code></pre>
  </div>
  )
}
