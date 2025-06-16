
'use client';

import React, { useEffect, useState, useCallback } from 'react';
import useAuthStore from '@/store/authStore';
import { useRouter } from 'next/navigation';
import Sidebar from '@/components/Sidebar/Sidebar';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { UserIcon, MailIcon, ImageIcon, Loader2, KeyRound, ArrowRight, CheckCircle2, RotateCcw, X } from 'lucide-react';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import axios from 'axios';


const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://connecthearpolling.vercel.app/api/auth';

const authService = {
  updateProfile: async (token, userData, profileImageFile = null, clearProfileImage = false) => {
    try {
      const formData = new FormData();
      if (userData.username !== undefined) formData.append('username', userData.username);
      if (userData.email !== undefined) formData.append('email', userData.email);
      if (profileImageFile) formData.append('profileImage', profileImageFile);
      if (clearProfileImage) formData.append('clearProfileImage', 'true');

      const response = await axios.put(`${API_URL}/profile`, formData, {
        headers: {
          'x-auth-token': token,
          'Content-Type': 'multipart/form-data',
        },
      });
      return response.data.data;
    } catch (error) {
      const errorMessage = error.response?.data?.message || error.message || 'Failed to update profile.';
      throw new Error(errorMessage);
    }
  },

  forgotPassword: async (email) => {
    try {
      const response = await axios.post(`${API_URL}/forgotpassword`, { email });
      return response.data;
    } catch (error) {
      const errorMessage = error.response?.data?.message || error.message || 'Failed to send password reset email.';
      throw new Error(errorMessage);
    }
  },

  verifyOtp: async (email, otp) => {
    try {
      const response = await axios.post(`${API_URL}/verify-otp`, { email, otp });
      return response.data;
    } catch (error) {
      const errorMessage = error.response?.data?.message || error.message || 'OTP verification failed.';
      throw new Error(errorMessage);
    }
  },

  resetPassword: async (password, passwordChangeToken) => {
    try {
      const response = await axios.put(`${API_URL}/resetpassword`, { password, passwordChangeToken });
      return response.data;
    } catch (error) {
      const errorMessage = error.response?.data?.message || error.message || 'Password reset failed.';
      throw new Error(errorMessage);
    }
  },
};


function ChangePasswordModal({ isOpen, onClose }) {
  const [step, setStep] = useState('request_otp');
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordChangeToken, setPasswordChangeToken] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleRequestOtp = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      await authService.forgotPassword(email);
      toast.success("OTP sent to your email!");
      setStep('verify_otp');
    } catch (error) {
      toast.error(error.message || "Failed to send OTP.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerifyOtp = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      const response = await authService.verifyOtp(email, otp);
      setPasswordChangeToken(response.passwordChangeToken);
      toast.success("OTP verified. You can now set your new password.");
      setStep('reset_password');
    } catch (error) {
      toast.error(error.message || "OTP verification failed.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleResetPassword = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    if (password !== confirmPassword) {
      toast.error("Passwords do not match.");
      setIsLoading(false);
      return;
    }
    if (password.length < 6) {
      toast.error("Password must be at least 6 characters long.");
      setIsLoading(false);
      return;
    }

    try {
      const response = await authService.resetPassword(password, passwordChangeToken);
      useAuthStore.getState().setAuth(response.token, response.user);
      toast.success("Password changed successfully!");
      setStep('success');
    } catch (error) {
      toast.error(error.message || "Failed to reset password.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleResetModalState = () => {
    setStep('request_otp');
    setEmail('');
    setOtp('');
    setPassword('');
    setConfirmPassword('');
    setPasswordChangeToken('');
    onClose();
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[480px] p-8 bg-white rounded-xl shadow-xl">
        <DialogHeader className="pb-6">
          <div className="flex items-center justify-center mb-4">
            <div className="bg-blue-100 p-3 rounded-full">
              <KeyRound className="h-6 w-6 text-blue-600" />
            </div>
          </div>
          <DialogTitle className="text-2xl font-bold text-center text-gray-800">
            {step === 'request_otp' && 'Request Password Reset'}
            {step === 'verify_otp' && 'Verify Your Identity'}
            {step === 'reset_password' && 'Set New Password'}
            {step === 'success' && 'Password Changed!'}
          </DialogTitle>
        </DialogHeader>

        <div className="mt-6 space-y-4">
          {step === 'request_otp' && (
            <form onSubmit={handleRequestOtp} className="space-y-4">
              <p className="text-sm text-gray-600 text-center">
                Enter your email to receive a verification code
              </p>
              <div>
                <Label htmlFor="email_otp" className="text-sm font-medium text-gray-700 mb-1">Email</Label>
                <Input
                  id="email_otp"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="your.email@example.com"
                  required
                  className="text-sm"
                />
              </div>
              <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <MailIcon className="h-4 w-4 mr-2" />}
                Send Verification Code
              </Button>
            </form>
          )}

          {step === 'verify_otp' && (
            <form onSubmit={handleVerifyOtp} className="space-y-4">
              <p className="text-sm text-gray-600 text-center">
                We sent a code to <span className="font-medium text-blue-600">{email}</span>
              </p>
              <div>
                <Label htmlFor="otp" className="text-sm font-medium text-gray-700 mb-1">Verification Code</Label>
                <Input
                  id="otp"
                  type="text"
                  value={otp}
                  onChange={(e) => setOtp(e.target.value)}
                  placeholder="Enter 6-digit code"
                  maxLength="6"
                  required
                  className="text-center tracking-widest text-sm"
                />
              </div>
              <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <CheckCircle2 className="h-4 w-4 mr-2" />}
                Verify Code
              </Button>
              <Button type="button" variant="link" onClick={() => setStep('request_otp')} className="w-full text-sm">
                <RotateCcw className="h-3 w-3 mr-2" /> Resend Code
              </Button>
            </form>
          )}

          {step === 'reset_password' && (
            <form onSubmit={handleResetPassword} className="space-y-4">
              <p className="text-sm text-gray-600 text-center">
                Create a new secure password
              </p>
              <div>
                <Label htmlFor="new-password" className="text-sm font-medium text-gray-700 mb-1">New Password</Label>
                <Input
                  id="new-password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Minimum 6 characters"
                  required
                  className="text-sm"
                />
              </div>
              <div>
                <Label htmlFor="confirm-password" className="text-sm font-medium text-gray-700 mb-1">Confirm Password</Label>
                <Input
                  id="confirm-password"
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Re-enter new password"
                  required
                  className="text-sm"
                />
              </div>
              <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <KeyRound className="h-4 w-4 mr-2" />}
                Reset Password
              </Button>
            </form>
          )}

          {step === 'success' && (
            <div className="text-center space-y-4 py-4">
              <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-green-100">
                <CheckCircle2 className="h-6 w-6 text-green-600" />
              </div>
              <h3 className="text-lg font-medium text-gray-900">Password Updated!</h3>
              <p className="text-sm text-gray-600">
                Your password has been changed successfully.
              </p>
              <Button onClick={handleResetModalState} className="w-full mt-4">
                Continue to Profile
              </Button>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

export default function ProfilePage() {
  const { isAuthenticated, loading: authLoading, initializeAuth, user, setAuth } = useAuthStore();
  const router = useRouter();

  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [profileImageFile, setProfileImageFile] = useState(null);
  const [profileImagePreview, setProfileImagePreview] = useState('');
  const [clearProfileImage, setClearProfileImage] = useState(false);
  const [isSavingProfile, setIsSavingProfile] = useState(false);
  const [isChangePasswordModalOpen, setIsChangePasswordModalOpen] = useState(false);

  useEffect(() => {
    if (user) {
      setUsername(user.username || '');
      setEmail(user.email || '');
      setProfileImagePreview(user.profileImage?.url || '');
    }
  }, [user]);

  useEffect(() => {
    if (authLoading) {
      initializeAuth();
    }
  }, [authLoading, initializeAuth]);

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.replace('/home');
      toast.info("Please log in to view your profile.");
    }
  }, [isAuthenticated, authLoading, router]);

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setProfileImageFile(file);
      setProfileImagePreview(URL.createObjectURL(file));
      setClearProfileImage(false);
    }
  };

  const handleClearImage = () => {
    setProfileImageFile(null);
    setProfileImagePreview('');
    setClearProfileImage(true);
  };

  const _getToken = useCallback(() => {
    const { token } = useAuthStore.getState();
    return token;
  }, []);

  const handleProfileSubmit = async (e) => {
    e.preventDefault();
    setIsSavingProfile(true);
    const token = _getToken();

    if (!token) {
      toast.error('Authentication required. Please log in again.');
      setIsSavingProfile(false);
      return;
    }

    try {
      const updatedUser = await authService.updateProfile(
        token,
        { username, email },
        profileImageFile,
        clearProfileImage
      );
      setAuth(token, updatedUser);
      toast.success("Profile updated successfully!");
      setProfileImageFile(null);
      setClearProfileImage(false);
    } catch (error) {
      toast.error(error.message || "Failed to update profile.");
    } finally {
      setIsSavingProfile(false);
    }
  };

  const isProfileFormDirty =
    username !== (user?.username || '') ||
    email !== (user?.email || '') ||
    profileImageFile !== null ||
    clearProfileImage !== false;

  const handleCancelProfileEdit = () => {
    setUsername(user?.username || '');
    setEmail(user?.email || '');
    setProfileImageFile(null);
    setProfileImagePreview(user?.profileImage?.url || '');
    setClearProfileImage(false);
  };

  const handleOpenChangePasswordModal = () => setIsChangePasswordModalOpen(true);
  const handleCloseChangePasswordModal = () => {
    setIsChangePasswordModalOpen(false);
    initializeAuth();
  };

  if (authLoading || !isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-gray-500" />
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-gray-50">
      <Sidebar />
      <div className="flex-1 flex flex-col p-4 md:p-8 ">
        <div className="max-w-9xl mx-auto w-full space-y-6">
    
          <div className="flex items-center justify-between">
            <h1 className="text-2xl md:text-3xl font-bold text-gray-800">Profile Settings</h1>
            <div className="flex gap-2">
              {isProfileFormDirty && (
                <Button
                  variant="outline"
                  onClick={handleCancelProfileEdit}
                  className="hidden sm:inline-flex"
                >
                  Cancel
                </Button>
              )}
              <Button
                onClick={handleOpenChangePasswordModal}
                variant="outline"
                className="flex items-center gap-2"
              >
                <KeyRound className="h-4 w-4" />
                <span>Change Password</span>
              </Button>
            </div>
          </div>

      
          <Card className="overflow-hidden">
            <CardHeader className="border-b bg-gray-50 p-6">
              <CardTitle className="text-xl">Personal Information</CardTitle>
              <CardDescription>
                Update your profile details and photo
              </CardDescription>
            </CardHeader>
            <CardContent className="p-6">
              <form onSubmit={handleProfileSubmit} className="space-y-6">
          
                <div className="flex flex-col items-center gap-6 sm:flex-row sm:items-start">
                  <div className="relative group">
                    <div className="h-24 w-24 rounded-full overflow-hidden border-2 border-gray-200">
                      {profileImagePreview ? (
                        <img
                          src={profileImagePreview}
                          alt="Profile"
                          className="w-full h-full object-cover"
                          onError={(e) => { e.target.onerror = null; e.target.src="https://placehold.co/96x96/E5E7EB/6B7280?text=User"; }}
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center bg-gray-100 text-gray-400">
                          <UserIcon className="h-12 w-12" />
                        </div>
                      )}
                    </div>
                    {profileImagePreview && (
                      <button
                        type="button"
                        onClick={handleClearImage}
                        className="absolute -top-2 -right-2 bg-white rounded-full p-1 shadow-md hover:bg-red-50 transition-colors"
                        title="Remove photo"
                      >
                        <X className="h-4 w-4 text-red-500" />
                      </button>
                    )}
                  </div>
                  <div className="flex flex-col gap-2 flex-1">
                    <Label htmlFor="profileImage" className="text-sm font-medium">
                      Profile Photo
                    </Label>
                    <div className="flex gap-2">
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => document.getElementById('profileImage').click()}
                        className="flex items-center gap-2"
                      >
                        <ImageIcon className="h-4 w-4" />
                        <span>{profileImagePreview ? 'Change' : 'Upload'}</span>
                      </Button>
                      <Input
                        id="profileImage"
                        type="file"
                        accept="image/*"
                        onChange={handleImageChange}
                        className="hidden"
                      />
                      {profileImagePreview && (
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={handleClearImage}
                          className="text-red-500 hover:text-red-600"
                        >
                          Remove
                        </Button>
                      )}
                    </div>
                    <p className="text-xs text-gray-500">
                      JPG, GIF or PNG. Max size of 2MB
                    </p>
                  </div>
                </div>


                <div className="grid gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="username">Username</Label>
                    <Input
                      id="username"
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      placeholder="Enter your username"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="email">Email</Label>
                    <Input
                      id="email"
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="Enter your email"
                      required
                    />
                  </div>
                </div>


                <div className="flex justify-end pt-4">
                  <Button
                    type="submit"
                    disabled={isSavingProfile || !isProfileFormDirty}
                    className="min-w-[120px]"
                  >
                    {isSavingProfile ? (
                      <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    ) : null}
                    {isSavingProfile ? 'Saving...' : 'Save Changes'}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>

       
          <Card>
            <CardHeader className="border-b bg-gray-50 p-6">
              <CardTitle className="text-xl">Security</CardTitle>
              <CardDescription>
                Manage your account security settings
              </CardDescription>
            </CardHeader>
            <CardContent className="p-6">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <h3 className="font-medium">Password</h3>
                  <p className="text-sm text-gray-600">
                    Last changed {new Date().toLocaleDateString()}
                  </p>
                </div>
                <Button
                  onClick={handleOpenChangePasswordModal}
                  variant="outline"
                  className="w-full sm:w-auto"
                >
                  Change Password
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

     
        <ChangePasswordModal
          isOpen={isChangePasswordModalOpen}
          onClose={handleCloseChangePasswordModal}
        />

        <ToastContainer position="top-right" autoClose={3000} />
      </div>
    </div>
  );
}