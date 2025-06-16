'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { gsap } from 'gsap';

import useAuthStore from '@/store/authStore';
import authService from '@/services/authService';

export default function LandingPage() {
  // Authentication states
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [registerUsername, setRegisterUsername] = useState('');
  const [registerEmail, setRegisterEmail] = useState('');
  const [registerPassword, setRegisterPassword] = useState('');
  const [registerConfirmPassword, setRegisterConfirmPassword] = useState('');
  const [registerProfileImage, setRegisterProfileImage] = useState(null); 

  // Password reset states
  const [forgotPasswordEmail, setForgotPasswordEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmNewPassword, setConfirmNewPassword] = useState('');
  const [passwordChangeToken, setPasswordChangeToken] = useState('');

  // UI state for current view: 'login', 'register', 'forgotPassword', 'verifyOtp', 'resetPassword'
  const [currentView, setCurrentView] = useState('login');
  const [isLoading, setIsLoading] = useState(false);

  const router = useRouter(); 
  const setAuth = useAuthStore((state) => state.setAuth);
  const { isAuthenticated, loading: authLoading } = useAuthStore();

  const titleRef = useRef(null);
  const subtitleRef = useRef(null);
  const cardRef = useRef(null);
  const backgroundRef = useRef(null);
  const formContentRef = useRef(null);

  // GSAP animations for initial component load
  useEffect(() => {
    const tl = gsap.timeline();

    tl.to(backgroundRef.current, {
      backgroundPosition: "200% 0%",
      duration: 20,
      ease: "none",
      repeat: -1,
      yoyo: true
    });

    tl.fromTo(titleRef.current, { y: -50, opacity: 0 }, { y: 0, opacity: 1, duration: 1.2, ease: 'power3.out' }, "<0.2")
      .fromTo(subtitleRef.current, { y: 50, opacity: 0 }, { y: 0, opacity: 1, duration: 1.2, delay: 0.3, ease: 'power3.out' }, "<0.2")
      .fromTo(cardRef.current, { opacity: 0, scale: 0.9, rotationY: 20 }, { opacity: 1, scale: 1, rotationY: 0, duration: 1.2, ease: 'back.out(1.4)' }, "<0.5");

    if (cardRef.current) {
      tl.fromTo(gsap.utils.toArray(cardRef.current.querySelectorAll('.card-footer-btn')), { opacity: 0, y: 20 }, { opacity: 1, y: 0, duration: 0.6, stagger: 0.2, ease: 'power2.out' }, "<0.5");
    }
    
    return () => tl.kill();
  }, []);

  // GSAP animation for form content transition when switching views
  useEffect(() => {
    if (formContentRef.current) {
      gsap.fromTo(
        formContentRef.current,
        { opacity: 0, y: 20 },
        { opacity: 1, y: 0, duration: 0.5, ease: 'power2.out' }
      );
    }
  }, [currentView]);

  // Redirect logic based on authentication status and loading state
  useEffect(() => {
    if (!authLoading && isAuthenticated) {
      router.replace('/home');
    }
  }, [isAuthenticated, authLoading, router]);

  // Handle Login Form Submission
  const handleLogin = async (e) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const { token, user } = await authService.login(loginEmail, loginPassword);
      setAuth(token, user);
      toast.success('Login successful! Redirecting to home...', {
        position: "top-right", autoClose: 2000, hideProgressBar: false, closeOnClick: true, pauseOnHover: true, draggable: true, progress: undefined,
      });
    } catch (error) {
      toast.error(error.message || 'Login failed. Please try again.', {
        position: "top-right", autoClose: 3000, hideProgressBar: false, closeOnClick: true, pauseOnHover: true, draggable: true, progress: undefined,
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Handle Register Form Submission
  const handleRegister = async (e) => {
    e.preventDefault();
    if (registerPassword !== registerConfirmPassword) {
      toast.error('Passwords do not match!', { position: "top-right", autoClose: 3000 });
      return;
    }
    setIsLoading(true);

    try {
      const { token, user } = await authService.register(
        registerUsername,
        registerEmail,
        registerPassword,
        registerProfileImage
      );
      setAuth(token, user);
      toast.success('Registration successful! Redirecting to home...', {
        position: "top-right", autoClose: 2000, hideProgressBar: false, closeOnClick: true, pauseOnHover: true, draggable: true, progress: undefined,
      });
    } catch (error) {
      toast.error(error.message || 'Registration failed. Please try again.', {
        position: "top-right", autoClose: 3000, hideProgressBar: false, closeOnClick: true, pauseOnHover: true, draggable: true, progress: undefined,
      });
    } finally {
      setIsLoading(false);
      setRegisterProfileImage(null);
      const fileInput = document.getElementById('profile-image');
      if (fileInput) {
        fileInput.value = '';
      }
    }
  };

  // Handle Forgot Password (send OTP)
  const handleForgotPassword = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      await authService.forgotPassword(forgotPasswordEmail);
      toast.success('OTP sent to your email!', { position: "top-right", autoClose: 3000 });
      setCurrentView('verifyOtp'); // Move to OTP verification step
    } catch (error) {
      toast.error(error.message || 'Failed to send OTP.', { position: "top-right", autoClose: 3000 });
    } finally {
      setIsLoading(false);
    }
  };

  // Handle OTP Verification
  const handleVerifyOtp = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      const { passwordChangeToken: receivedToken } = await authService.verifyOtp(forgotPasswordEmail, otp);
      setPasswordChangeToken(receivedToken); // Store the token
      toast.success('OTP verified successfully! You can now set your new password.', { position: "top-right", autoClose: 3000 });
      setCurrentView('resetPassword'); // Move to reset password step
    } catch (error) {
      toast.error(error.message || 'Invalid or expired OTP.', { position: "top-right", autoClose: 3000 });
    } finally {
      setIsLoading(false);
    }
  };

  // Handle Reset Password
  const handleResetPassword = async (e) => {
    e.preventDefault();
    if (newPassword !== confirmNewPassword) {
      toast.error('New passwords do not match!', { position: "top-right", autoClose: 3000 });
      return;
    }
    setIsLoading(true);
    try {
      await authService.resetPassword(newPassword, passwordChangeToken);
      toast.success('Password reset successfully! Please log in with your new password.', { position: "top-right", autoClose: 5000 });
      setCurrentView('login'); // Go back to login
      // Clear password reset states
      setForgotPasswordEmail('');
      setOtp('');
      setNewPassword('');
      setConfirmNewPassword('');
      setPasswordChangeToken('');
    } catch (error) {
      toast.error(error.message || 'Failed to reset password.', { position: "top-right", autoClose: 3000 });
    } finally {
      setIsLoading(false);
    }
  };


  if (authLoading) {
    return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-500 via-purple-600 to-indigo-700">
            <svg className="animate-spin h-10 w-10 text-white" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
        </div>
    );
  }

  return (
    <div
      ref={backgroundRef}
      className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-blue-500 via-purple-600 to-indigo-700 bg-[length:200%_200%] font-sans text-gray-800 relative overflow-hidden"
    >
      <div className="absolute inset-0 bg-black opacity-10 z-0"></div> 

      <style jsx>{`
        @keyframes gradientShift {
          0% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
          100% { background-position: 0% 50%; }
        }
      `}</style>

      <div className="container mx-auto flex flex-col lg:flex-row items-center justify-around gap-12 max-w-7xl z-10 relative">
        <div className="text-center lg:text-left text-white max-w-xl mb-8 lg:mb-0 px-4 md:px-0">
          <h1 ref={titleRef} className="text-5xl md:text-6xl lg:text-7xl font-extrabold mb-4 leading-tight drop-shadow-lg">
            ConnectHear
          </h1>
          <p ref={subtitleRef} className="text-2xl md:text-3xl lg:text-4xl font-light opacity-90 drop-shadow-md">
            Your Ultimate Polling Platform
          </p>
          <p className="mt-6 md:mt-8 text-base md:text-lg lg:text-xl opacity-90 leading-relaxed">
            Dive into public opinion! Create, share, and vote on engaging polls with instant, real-time results.
            Be heard, discover insights, and connect through collective choices.
          </p>
        </div>

        <Card
          ref={cardRef}
          className="w-full max-w-sm sm:max-w-md shadow-3xl rounded-3xl p-6 sm:p-8 bg-white/95 backdrop-blur-md transform hover:scale-[1.02] transition-transform duration-500 ease-out border border-blue-200 ring-4 ring-blue-300/30 ring-inset"
        >
          <CardHeader className="text-center pb-4 sm:pb-6">
            <CardTitle className="text-3xl sm:text-4xl font-bold text-gray-900 leading-tight">
              {currentView === 'login' && 'Welcome Back!'}
              {currentView === 'register' && 'Join ConnectHear'}
              {currentView === 'forgotPassword' && 'Forgot Password?'}
              {currentView === 'verifyOtp' && 'Verify OTP'}
              {currentView === 'resetPassword' && 'Reset Password'}
            </CardTitle>
            <CardDescription className="text-base sm:text-lg text-gray-600 mt-2">
              {currentView === 'login' && 'Sign in to your account.'}
              {currentView === 'register' && 'Create your new account.'}
              {currentView === 'forgotPassword' && 'Enter your email to receive a password reset OTP.'}
              {currentView === 'verifyOtp' && 'Enter the OTP sent to your email.'}
              {currentView === 'resetPassword' && 'Set your new password.'}
            </CardDescription>
          </CardHeader>
          <CardContent ref={formContentRef}>
            {/* Login Form */}
            {currentView === 'login' && (
              <form onSubmit={handleLogin} className="space-y-5 sm:space-y-6">
                <div>
                  <label htmlFor="login-email" className="block text-sm font-medium text-gray-700 mb-1 sm:mb-2">
                    Email Address
                  </label>
                  <Input
                    id="login-email"
                    type="email"
                    placeholder="you@example.com"
                    value={loginEmail}
                    onChange={(e) => setLoginEmail(e.target.value)}
                    required
                    className="rounded-xl p-3 sm:p-3.5 text-base sm:text-lg focus:ring-blue-500 focus:border-blue-500 transition duration-300 transform focus:scale-[1.01]"
                  />
                </div>
                <div>
                  <label htmlFor="login-password" className="block text-sm font-medium text-gray-700 mb-1 sm:mb-2">
                    Password
                  </label>
                  <Input
                    id="login-password"
                    type="password"
                    placeholder="********"
                    value={loginPassword}
                    onChange={(e) => setLoginPassword(e.target.value)}
                    required
                    className="rounded-xl p-3 sm:p-3.5 text-base sm:text-lg focus:ring-blue-500 focus:border-blue-500 transition duration-300 transform focus:scale-[1.01]"
                  />
                </div>
                <Button
                  type="submit"
                  className="w-full bg-gradient-to-r from-blue-600 to-purple-700 hover:from-blue-700 hover:to-purple-800 text-white py-3 sm:py-3.5 rounded-xl text-lg sm:text-xl font-semibold shadow-lg transition duration-300 ease-in-out transform hover:-translate-y-1 hover:shadow-xl focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <svg className="animate-spin h-5 w-5 sm:h-6 sm:w-6 text-white mx-auto" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                  ) : (
                    'Login'
                  )}
                </Button>
                <div className="text-center mt-3 sm:mt-4">
                    <Button
                        variant="link"
                        className="text-blue-600 hover:text-blue-800 text-base sm:text-lg"
                        onClick={() => setCurrentView('forgotPassword')}
                        type="button" // Important to prevent form submission
                    >
                        Forgot Password?
                    </Button>
                </div>
              </form>
            )}

            {/* Register Form */}
            {currentView === 'register' && (
              <form onSubmit={handleRegister} className="space-y-5 sm:space-y-6">
                <div>
                  <label htmlFor="register-username" className="block text-sm font-medium text-gray-700 mb-1 sm:mb-2">
                    Username
                  </label>
                  <Input
                    id="register-username"
                    type="text"
                    placeholder="Your Username"
                    value={registerUsername}
                    onChange={(e) => setRegisterUsername(e.target.value)}
                    required
                    className="rounded-xl p-3 sm:p-3.5 text-base sm:text-lg focus:ring-blue-500 focus:border-blue-500 transition duration-300 transform focus:scale-[1.01]"
                  />
                </div>
                <div>
                  <label htmlFor="register-email" className="block text-sm font-medium text-gray-700 mb-1 sm:mb-2">
                    Email Address
                  </label>
                  <Input
                    id="register-email"
                    type="email"
                    placeholder="you@example.com"
                    value={registerEmail}
                    onChange={(e) => setRegisterEmail(e.target.value)}
                    required
                    className="rounded-xl p-3 sm:p-3.5 text-base sm:text-lg focus:ring-blue-500 focus:border-blue-500 transition duration-300 transform focus:scale-[1.01]"
                  />
                </div>
                <div>
                  <label htmlFor="register-password" className="block text-sm font-medium text-gray-700 mb-1 sm:mb-2">
                    Password
                  </label>
                  <Input
                    id="register-password"
                    type="password"
                    placeholder="********"
                    value={registerPassword}
                    onChange={(e) => setRegisterPassword(e.target.value)}
                    required
                    className="rounded-xl p-3 sm:p-3.5 text-base sm:text-lg focus:ring-blue-500 focus:border-blue-500 transition duration-300 transform focus:scale-[1.01]"
                  />
                </div>
                <div>
                  <label htmlFor="register-confirm-password" className="block text-sm font-medium text-gray-700 mb-1 sm:mb-2">
                    Confirm Password
                  </label>
                  <Input
                    id="register-confirm-password"
                    type="password"
                    placeholder="********"
                    value={registerConfirmPassword}
                    onChange={(e) => setRegisterConfirmPassword(e.target.value)}
                    required
                    className="rounded-xl p-3 sm:p-3.5 text-base sm:text-lg focus:ring-blue-500 focus:border-blue-500 transition duration-300 transform focus:scale-[1.01]"
                  />
                </div>
                <div>
                  <label htmlFor="profile-image" className="block text-sm font-medium text-gray-700 mb-1 sm:mb-2">
                    Profile Image (Optional)
                  </label>
                  <Input
                    id="profile-image"
                    type="file"
                    accept="image/*"
                    onChange={(e) => setRegisterProfileImage(e.target.files[0])}
                    className="rounded-xl p-3 sm:p-3.5 text-base sm:text-lg focus:ring-blue-500 focus:border-blue-500 transition duration-300 transform focus:scale-[1.01] file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-violet-50 file:text-violet-700 hover:file:bg-violet-100"
                  />
                </div>
                <Button
                  type="submit"
                  className="w-full bg-gradient-to-r from-green-500 to-teal-600 hover:from-green-600 hover:to-teal-700 text-white py-3 sm:py-3.5 rounded-xl text-lg sm:text-xl font-semibold shadow-lg transition duration-300 ease-in-out transform hover:-translate-y-1 hover:shadow-xl focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <svg className="animate-spin h-5 w-5 sm:h-6 sm:w-6 text-white mx-auto" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                  ) : (
                    'Register'
                  )}
                </Button>
              </form>
            )}

            {/* Forgot Password (Email Input) Form */}
            {currentView === 'forgotPassword' && (
              <form onSubmit={handleForgotPassword} className="space-y-5 sm:space-y-6">
                <div>
                  <label htmlFor="forgot-email" className="block text-sm font-medium text-gray-700 mb-1 sm:mb-2">
                    Email Address
                  </label>
                  <Input
                    id="forgot-email"
                    type="email"
                    placeholder="you@example.com"
                    value={forgotPasswordEmail}
                    onChange={(e) => setForgotPasswordEmail(e.target.value)}
                    required
                    className="rounded-xl p-3 sm:p-3.5 text-base sm:text-lg focus:ring-blue-500 focus:border-blue-500 transition duration-300 transform focus:scale-[1.01]"
                  />
                </div>
                <Button
                  type="submit"
                  className="w-full bg-gradient-to-r from-orange-500 to-red-600 hover:from-orange-600 hover:to-red-700 text-white py-3 sm:py-3.5 rounded-xl text-lg sm:text-xl font-semibold shadow-lg transition duration-300 ease-in-out transform hover:-translate-y-1 hover:shadow-xl focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-orange-500"
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <svg className="animate-spin h-5 w-5 sm:h-6 sm:w-6 text-white mx-auto" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                  ) : (
                    'Send OTP'
                  )}
                </Button>
              </form>
            )}

            {/* Verify OTP Form */}
            {currentView === 'verifyOtp' && (
              <form onSubmit={handleVerifyOtp} className="space-y-5 sm:space-y-6">
                <div>
                  <label htmlFor="verify-otp" className="block text-sm font-medium text-gray-700 mb-1 sm:mb-2">
                    OTP
                  </label>
                  <Input
                    id="verify-otp"
                    type="text"
                    placeholder="Enter 6-digit OTP"
                    value={otp}
                    onChange={(e) => setOtp(e.target.value)}
                    required
                    maxLength={6}
                    className="rounded-xl p-3 sm:p-3.5 text-base sm:text-lg focus:ring-blue-500 focus:border-blue-500 transition duration-300 transform focus:scale-[1.01]"
                  />
                </div>
                <Button
                  type="submit"
                  className="w-full bg-gradient-to-r from-yellow-500 to-amber-600 hover:from-yellow-600 hover:to-amber-700 text-white py-3 sm:py-3.5 rounded-xl text-lg sm:text-xl font-semibold shadow-lg transition duration-300 ease-in-out transform hover:-translate-y-1 hover:shadow-xl focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-yellow-500"
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <svg className="animate-spin h-5 w-5 sm:h-6 sm:w-6 text-white mx-auto" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                  ) : (
                    'Verify OTP'
                  )}
                </Button>
              </form>
            )}

            {/* Reset Password Form */}
            {currentView === 'resetPassword' && (
              <form onSubmit={handleResetPassword} className="space-y-5 sm:space-y-6">
                <div>
                  <label htmlFor="new-password" className="block text-sm font-medium text-gray-700 mb-1 sm:mb-2">
                    New Password
                  </label>
                  <Input
                    id="new-password"
                    type="password"
                    placeholder="********"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    required
                    minLength={6}
                    className="rounded-xl p-3 sm:p-3.5 text-base sm:text-lg focus:ring-blue-500 focus:border-blue-500 transition duration-300 transform focus:scale-[1.01]"
                  />
                </div>
                <div>
                  <label htmlFor="confirm-new-password" className="block text-sm font-medium text-gray-700 mb-1 sm:mb-2">
                    Confirm New Password
                  </label>
                  <Input
                    id="confirm-new-password"
                    type="password"
                    placeholder="********"
                    value={confirmNewPassword}
                    onChange={(e) => setConfirmNewPassword(e.target.value)}
                    required
                    minLength={6}
                    className="rounded-xl p-3 sm:p-3.5 text-base sm:text-lg focus:ring-blue-500 focus:border-blue-500 transition duration-300 transform focus:scale-[1.01]"
                  />
                </div>
                <Button
                  type="submit"
                  className="w-full bg-gradient-to-r from-purple-600 to-indigo-700 hover:from-purple-700 hover:to-indigo-800 text-white py-3 sm:py-3.5 rounded-xl text-lg sm:text-xl font-semibold shadow-lg transition duration-300 ease-in-out transform hover:-translate-y-1 hover:shadow-xl focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500"
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <svg className="animate-spin h-5 w-5 sm:h-6 sm:w-6 text-white mx-auto" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                  ) : (
                    'Reset Password'
                  )}
                </Button>
              </form>
            )}
          </CardContent>
          <CardFooter className="flex flex-col gap-3 sm:gap-4 mt-4 sm:mt-6">
            {/* Conditional buttons for navigation between views */}
            {(currentView === 'login' || currentView === 'register') ? (
              <>
                {currentView === 'login' ? (
                  <Button
                    variant="outline"
                    className="w-full border-blue-500 text-blue-600 hover:bg-blue-50 hover:text-blue-700 py-3 sm:py-3.5 rounded-xl text-base sm:text-lg font-semibold transition duration-300 ease-in-out card-footer-btn focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                    onClick={() => setCurrentView('register')}
                  >
                    Create New Account
                  </Button>
                ) : (
                  <Button
                    variant="outline"
                    className="w-full border-purple-500 text-purple-600 hover:bg-purple-50 hover:text-purple-700 py-3 sm:py-3.5 rounded-xl text-base sm:text-lg font-semibold transition duration-300 ease-in-out card-footer-btn focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500"
                    onClick={() => setCurrentView('login')}
                  >
                    Back to Login
                  </Button>
                )}
                {/* Always show "Continue as Guest" */}
                <Link href="/home" className="w-full card-footer-btn">
                  <Button
                    variant="ghost"
                    className="w-full text-gray-700 hover:bg-gray-100 py-3 sm:py-3.5 rounded-xl text-base sm:text-lg font-semibold transition duration-300 ease-in-out focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-300"
                  >
                    Continue as Guest
                  </Button>
                </Link>
              </>
            ) : (
                // Back button for password reset flow
                <Button
                    variant="outline"
                    className="w-full border-gray-400 text-gray-600 hover:bg-gray-100 hover:text-gray-700 py-3 sm:py-3.5 rounded-xl text-base sm:text-lg font-semibold transition duration-300 ease-in-out card-footer-btn focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-300"
                    onClick={() => {
                        if (currentView === 'verifyOtp') setCurrentView('forgotPassword');
                        else if (currentView === 'resetPassword') setCurrentView('verifyOtp');
                        else setCurrentView('login'); // Default back to login
                    }}
                >
                    Back
                </Button>
            )}
          </CardFooter>
        </Card>
      </div>
      <ToastContainer />
    </div>
  );
}