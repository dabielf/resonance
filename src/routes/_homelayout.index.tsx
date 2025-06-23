import { createFileRoute } from '@tanstack/react-router'
import { Button } from "@/components/ui/button"
import { useState } from 'react'

export const Route = createFileRoute('/_homelayout/')({
  component: Index,
})

function Index() {
     const [name, setName] = useState('unknown')
     const [agent, setAgent] = useState('unknown')
  return (
    <div>
      <h3>Welcome Home!</h3>
      <Button
          onClick={() => {
            fetch('/api')
              .then((res) => res.json() as Promise<{ data: string }>)
              .then((data) => setName(data.data))
          }}
          aria-label='get name'
        >
          Name from API is: {name}
        </Button>
        <Button
          onClick={() => {
            fetch('/api/agent')
              .then((res) => res.json() as Promise<{ data: string }>)
              .then((data) => setAgent(data.data))
          }}
          aria-label='get agent'
        >
          Agents available: {agent}
        </Button>
    </div>
  )
}
