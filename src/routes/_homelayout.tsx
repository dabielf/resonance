import { createFileRoute } from '@tanstack/react-router'
import { Link, Outlet } from '@tanstack/react-router'
import { SignedIn, SignedOut, SignInButton, UserButton } from '@clerk/clerk-react';
import { ModeToggle } from '@/components/mode-toggle'

export const Route = createFileRoute('/_homelayout')({
  component: RouteComponent,
})

function RouteComponent() {
  return (
    <>
        <div className="p-2 flex justify-between items-center">
          <div className="flex gap-2">
            <Link to="/" className="[&.active]:font-bold">
              Home
            </Link>{' '}
            <Link to="/about" className="[&.active]:font-bold">
              About
            </Link>
            <Link to="/contact" className="[&.active]:font-bold">
              Contact
            </Link>
            <Link to="/app" className="[&.active]:font-bold">
              App
            </Link>
            <Link to="/app/yolo" className="[&.active]:font-bold">
              Yolo
            </Link>
          </div>
          <div className="flex gap-2">
          <SignedOut>
            <SignInButton forceRedirectUrl={"/app/yolo"} mode='modal' />
          </SignedOut>
          <SignedIn>
            <UserButton />
          </SignedIn>
           <ModeToggle />
          </div>
        </div>
        <div className="p-2">
          <Outlet />
        </div>
    </>)
}
