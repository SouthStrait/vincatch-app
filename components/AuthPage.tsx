
import React, { useState } from 'react';

interface AuthPageProps {
  onLogin: (email: string, password: string) => Promise<void>;
  onSignUp: (email: string, password: string) => Promise<void>;
}

const AuthPage: React.FC<AuthPageProps> = ({ onLogin, onSignUp }) => {
  const [isLoginView, setIsLoginView] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    
    if (!email.includes('@') || password.length < 6) {
        setError("Please enter a valid email and a password of at least 6 characters.");
        return;
    }
    
    setIsLoading(true);
    try {
      if (isLoginView) {
        await onLogin(email, password);
      } else {
        await onSignUp(email, password);
      }
    } catch (err: any) {
      setError(err.message || 'An unexpected error occurred.');
    } finally {
        setIsLoading(false);
    }
  };

  const toggleView = () => {
    setIsLoginView(!isLoginView);
    setError(null);
    setEmail('');
    setPassword('');
  };

  const title = isLoginView ? 'Welcome Back' : 'Create Your Account';
  const subTitle = isLoginView ? 'Sign in to access your garage' : 'Sign up to start creating vehicle profiles';
  const buttonText = isLoginView ? 'Login' : 'Sign Up';
  const toggleText = isLoginView ? "Don't have an account?" : "Already have an account?";
  const toggleLinkText = isLoginView ? 'Sign Up' : 'Login';

  return (
    <div className="flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8 animate-fade-in">
        <div className="w-full max-w-md space-y-8 bg-gray-900 p-8 rounded-xl shadow-2xl border border-gray-800">
            <div>
                <h2 className="mt-6 text-center text-3xl font-bold tracking-tight text-white">
                    {title}
                </h2>
                <p className="mt-2 text-center text-sm text-neutral-400">
                    {subTitle}
                </p>
            </div>
            <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
                <div className="rounded-md shadow-sm -space-y-px">
                    <div>
                        <label htmlFor="email-address" className="sr-only">Email address</label>
                        <input
                            id="email-address"
                            name="email"
                            type="email"
                            autoComplete="email"
                            required
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            className="relative block w-full appearance-none rounded-t-md border border-gray-700 bg-gray-950 px-3 py-2 text-neutral-200 placeholder-gray-500 focus:z-10 focus:border-orange-500 focus:outline-none focus:ring-orange-500 sm:text-sm"
                            placeholder="Email address"
                        />
                    </div>
                    <div>
                        <label htmlFor="password" className="sr-only">Password</label>
                        <input
                            id="password"
                            name="password"
                            type="password"
                            autoComplete={isLoginView ? "current-password" : "new-password"}
                            required
                            minLength={6}
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            className="relative block w-full appearance-none rounded-b-md border border-gray-700 bg-gray-950 px-3 py-2 text-neutral-200 placeholder-gray-500 focus:z-10 focus:border-orange-500 focus:outline-none focus:ring-orange-500 sm:text-sm"
                            placeholder="Password"
                        />
                    </div>
                </div>

                {error && (
                    <div className="bg-rose-900/50 border border-rose-700 text-rose-200 px-3 py-2 rounded-md text-sm">
                        {error}
                    </div>
                )}


                <div>
                    <button
                        type="submit"
                        disabled={isLoading}
                        className="group relative flex w-full justify-center rounded-md border border-transparent bg-orange-600 py-2 px-4 text-sm font-medium text-white hover:bg-orange-700 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:ring-offset-2 focus:ring-offset-gray-900 disabled:bg-gray-700 disabled:cursor-not-allowed"
                    >
                        {isLoading ? (
                             <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                              </svg>
                        ) : (
                            buttonText
                        )}
                    </button>
                </div>
            </form>
            <p className="mt-2 text-center text-sm text-neutral-400">
                {toggleText}
                <button onClick={toggleView} className="ml-1 font-medium text-orange-400 hover:text-orange-300">
                    {toggleLinkText}
                </button>
            </p>
        </div>
    </div>
  );
};

export default AuthPage;