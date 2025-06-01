import { Link } from 'wouter';
import { FaGithub, FaTwitter } from 'react-icons/fa';

export function Footer() {
  return (
    <footer className="bg-white">
      <div className="max-w-7xl mx-auto py-12 px-4 overflow-hidden sm:px-6 lg:px-8">
        <nav className="-mx-5 -my-2 flex flex-wrap justify-center" aria-label="Footer">
          <div className="px-5 py-2">
            <Link href="/guidelines">
              <a className="text-base text-gray-500 hover:text-gray-900">
                Community Guidelines
              </a>
            </Link>
          </div>
          <div className="px-5 py-2">
            <Link href="/privacy">
              <a className="text-base text-gray-500 hover:text-gray-900">
                Privacy Policy
              </a>
            </Link>
          </div>
          <div className="px-5 py-2">
            <a href="https://github.com" className="text-base text-gray-500 hover:text-gray-900">
              GitHub
            </a>
          </div>
        </nav>
        <div className="mt-8 flex justify-center space-x-6">
          <a href="https://github.com" className="text-gray-400 hover:text-gray-500">
            <span className="sr-only">GitHub</span>
            <FaGithub className="h-6 w-6" />
          </a>
          <a href="https://twitter.com" className="text-gray-400 hover:text-gray-500">
            <span className="sr-only">Twitter</span>
            <FaTwitter className="h-6 w-6" />
          </a>
        </div>
        <p className="mt-8 text-center text-base text-gray-400">
          &copy; {new Date().getFullYear()} Vibe Coding Community. All rights reserved.
        </p>
      </div>
    </footer>
  );
}
