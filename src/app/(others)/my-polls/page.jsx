// src/app/my-polls/page.jsx
'use client';

import React, { useEffect, useState, useCallback } from 'react';
import useAuthStore from '@/store/authStore';
import { useRouter } from 'next/navigation';
import Sidebar from '@/components/Sidebar/Sidebar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { X, Plus, ImageIcon, Loader2 } from 'lucide-react';
import Link from 'next/link';
import axios from 'axios';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { motion } from 'framer-motion';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api/polls';


function EditPollModal({ poll, isOpen, onClose, onSave }) {
  const [editedQuestion, setEditedQuestion] = useState(poll?.question || '');
  const [editedOptions, setEditedOptions] = useState(
    poll?.options?.map(opt => opt.text) || ['', '']
  );
  const [currentImages, setCurrentImages] = useState(poll?.images || []);
  const [newImageFiles, setNewImageFiles] = useState([]);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (poll) {
      setEditedQuestion(poll.question || '');
      const initialOptions = poll.options?.map(opt => opt.text) || [];
      setEditedOptions(initialOptions.length >= 2 ? initialOptions : ['', '']);
      setCurrentImages(poll.images || []);
      setNewImageFiles([]);
    }
  }, [poll]);

  const _getModalToken = useCallback(() => {
    try {
      const { token } = useAuthStore.getState();
      return token;
    } catch (e) {
      console.error("Failed to get token in EditPollModal (embedded):", e);
      return null;
    }
  }, []);

  const _fileToBase64 = useCallback((file) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve(reader.result.split(',')[1]);
      reader.onerror = (error) => reject(error);
    });
  }, []);

  const handleOptionChange = (index, value) => {
    const updatedOptions = [...editedOptions];
    updatedOptions[index] = value;
    setEditedOptions(updatedOptions);
  };

  const handleAddOption = () => {
    setEditedOptions([...editedOptions, '']);
  };

  const handleRemoveOption = (index) => {
    if (editedOptions.length > 2) {
      const updatedOptions = editedOptions.filter((_, i) => i !== index);
      setEditedOptions(updatedOptions);
    } else {
      toast.warn("A poll must have at least two options.");
    }
  };

  const handleImageChange = (e) => {
    const files = Array.from(e.target.files);
    if (newImageFiles.length + currentImages.length + files.length > 5) {
      toast.error("You can upload a maximum of 5 images per poll.");
      return;
    }
    setNewImageFiles((prev) => [...prev, ...files]);
  };

  const handleRemoveNewImage = (index) => {
    setNewImageFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const handleRemoveCurrentImage = (index) => {
    setCurrentImages((prev) => prev.filter((_, i) => i !== index));
  };


  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSaving(true);
    const token = _getModalToken();

    if (!token) {
      toast.error('Authentication required to update poll.');
      setIsSaving(false);
      return;
    }

    if (!editedQuestion.trim()) {
      toast.error('Poll question cannot be empty.');
      setIsSaving(false);
      return;
    }
    const filteredOptions = editedOptions.filter(opt => opt.trim() !== '');
    if (filteredOptions.length < 2) {
      toast.error('Please provide at least two valid options.');
      setIsSaving(false);
      return;
    }

    try {
      const imagesToUpload = [];

      const base64NewImages = await Promise.all(
        newImageFiles.map(async (file) => ({
          base64: await _fileToBase64(file),
          fileName: file.name,
        }))
      );
      imagesToUpload.push(...base64NewImages);

      const payload = {
        question: editedQuestion,
        options: filteredOptions,
        images: imagesToUpload,
      };

      const response = await axios.put(`${API_URL}/${poll._id}`, payload, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      toast.success("Poll updated successfully!");
      if (onSave) {
        onSave(response.data.data);
      }
      onClose();
    } catch (error) {
      console.error("Error updating poll:", error.response?.data || error.message);
      toast.error(error.response?.data?.message || "Failed to update poll. Please try again.");
    } finally {
      setIsSaving(false);
    }
  };

  if (!poll) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[700px] p-6 bg-white rounded-lg shadow-xl overflow-y-auto max-h-[90vh]">
        <DialogHeader className="pb-4 border-b border-gray-200">
          <DialogTitle className="text-3xl font-bold text-gray-900">Edit Your Poll</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="mt-4 space-y-6">
          <div>
            <Label htmlFor="question" className="text-lg font-semibold text-gray-700 mb-2 block">Poll Question</Label>
            <Input
              id="question"
              value={editedQuestion}
              onChange={(e) => setEditedQuestion(e.target.value)}
              placeholder="Enter your poll question"
              className="text-md p-3 rounded-md border border-gray-300 focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>

          <div>
            <Label className="text-lg font-semibold text-gray-700 mb-2 block">Poll Options</Label>
            <div className="space-y-3">
              {editedOptions.map((option, index) => (
                <div key={index} className="flex items-center space-x-2">
                  <Input
                    value={option}
                    onChange={(e) => handleOptionChange(index, e.target.value)}
                    placeholder={`Option ${index + 1}`}
                    className="flex-1 text-md p-3 rounded-md border border-gray-300 focus:ring-2 focus:ring-blue-500"
                    required={index < 2}
                  />
                  {editedOptions.length > 2 && (
                    <Button
                      type="button"
                      variant="ghost"
                      onClick={() => handleRemoveOption(index)}
                      className="p-2 rounded-full hover:bg-red-100 text-red-500"
                    >
                      <X className="h-5 w-5" />
                    </Button>
                  )}
                </div>
              ))}
            </div>
            <Button
              type="button"
              onClick={handleAddOption}
              className="mt-4 w-full bg-blue-500 hover:bg-blue-600 text-white rounded-md py-2.5 flex items-center justify-center gap-2"
            >
              <Plus className="h-5 w-5" /> Add Option
            </Button>
          </div>

          <div className="mt-6">
            <Label htmlFor="imageUpload" className="text-lg font-semibold text-gray-700 mb-2 block">Poll Images (Max 5)</Label>
            <Input
              id="imageUpload"
              type="file"
              accept="image/*"
              multiple
              onChange={handleImageChange}
              className="file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
            />
            <div className="mt-4 grid grid-cols-2 sm:grid-cols-3 gap-3">
              {currentImages.map((image, index) => (
                <div key={`current-${image.public_id || image.url}`} className="relative group overflow-hidden rounded-md border border-gray-200">
                  <img
                    src={image.url}
                    alt={`Current Poll Image ${index + 1}`}
                    className="w-full h-24 object-cover"
                  />
                  <Button
                    type="button"
                    variant="destructive"
                    size="icon"
                    onClick={() => handleRemoveCurrentImage(index)}
                    className="absolute top-1 right-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-200 bg-red-600 hover:bg-red-700"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              ))}
              {newImageFiles.map((file, index) => (
                <div key={`new-${file.name}-${index}`} className="relative group overflow-hidden rounded-md border border-gray-200">
                  <img
                    src={URL.createObjectURL(file)}
                    alt={`New Poll Image ${index + 1}`}
                    className="w-full h-24 object-cover"
                    onLoad={() => URL.revokeObjectURL(file)}
                  />
                  <Button
                    type="button"
                    variant="destructive"
                    size="icon"
                    onClick={() => handleRemoveNewImage(index)}
                    className="absolute top-1 right-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-200 bg-red-600 hover:bg-red-700"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              ))}
              {(currentImages.length + newImageFiles.length === 0) && (
                <div className="h-24 flex items-center justify-center border-2 border-dashed border-gray-300 rounded-md text-gray-500">
                  <ImageIcon className="h-6 w-6 mr-2" /> No images selected
                </div>
              )}
            </div>
          </div>

          <DialogFooter className="pt-6 border-t border-gray-200 flex justify-end gap-3">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              className="px-6 py-2 rounded-md border border-gray-300 text-gray-700 hover:bg-gray-100"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              className="px-6 py-2 rounded-md bg-gradient-to-r from-blue-500 to-indigo-600 text-white font-semibold hover:from-blue-600 hover:to-indigo-700"
              disabled={isSaving}
            >
              {isSaving ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Saving...
                </>
              ) : (
                'Save Changes'
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}


function PollCard({ poll, isEditable, onDeleteSuccess, onEditClick }) {
  if (!poll) return null;

  const primaryImage = poll.images && poll.images.length > 0 ? poll.images[0] : null;

  const _getCardToken = useCallback(() => {
    try {
        const { token } = useAuthStore.getState();
        return token;
    } catch (e) {
        console.error("Failed to get token in PollCard (embedded):", e);
        return null;
    }
  }, []);

  const handleDelete = async (e) => {
    e.preventDefault();
    e.stopPropagation();

    if (window.confirm("Are you sure you want to delete this poll? This action cannot be undone.")) {
      try {
        const token = _getCardToken();
        if (!token) {
          toast.error('Authentication required to delete poll.');
          return;
        }

        await axios.delete(`${API_URL}/${poll._id}`, {
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        });

        if (onDeleteSuccess) {
          onDeleteSuccess(poll._id);
        }
        toast.success("Poll deleted successfully!");
      } catch (error) {
        console.error("Error deleting poll:", error.response?.data || error.message);
        toast.error(error.response?.data?.message || "Failed to delete poll.");
      }
    }
  };

  const handleEdit = (e) => {
    e.preventDefault();
    e.stopPropagation();

    if (onEditClick) {
      onEditClick(poll);
    }
  };

  return (
    <motion.div
      className="bg-white rounded-xl shadow-lg hover:shadow-xl transition-shadow duration-300 ease-in-out cursor-pointer overflow-hidden border border-gray-200 h-full flex flex-col w-full"
      whileHover={{ scale: 1.02, transition: { duration: 0.3 } }}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.1 }}
    >
      <Card className="flex-1 flex flex-col justify-between border-none shadow-none">
        <CardHeader className="p-4 pb-2">
          {primaryImage && primaryImage.url && (
            <img
              src={primaryImage.url}
              alt="Poll Visual"
              className="w-full h-48 object-cover rounded-md mb-3 border border-gray-100"
              onError={(e) => { e.target.onerror = null; e.target.src="https://placehold.co/400x200/E0E7FF/5C6BC0?text=No+Image"; }}
            />
          )}
          <CardTitle className="text-xl font-bold text-gray-800 line-clamp-2 leading-tight">
            {poll.question}
          </CardTitle>
          <CardDescription className="text-sm text-gray-600 mt-1">
            By: <span className="font-medium text-blue-600">{poll.createdBy?.username || 'Anonymous'}</span>
          </CardDescription>
        </CardHeader>
        <CardContent className="p-4 pt-0">
          <p className="text-md font-semibold text-gray-700 mb-2">Total Votes: {poll.totalVotes}</p>
          {poll.options && poll.options.length > 0 ? (
            <ul className="text-sm text-gray-500 space-y-1">
              {poll.options.slice(0, 3).map((option) => (
                <li key={option._id} className="flex justify-between items-center">
                  <span>{option.text}</span>
                  <span className="font-medium text-gray-700">{option.votes} votes</span>
                </li>
              ))}
              {poll.options.length > 3 && (
                <li className="text-xs text-blue-500 cursor-pointer hover:underline">
                  + {poll.options.length - 3} more options
                </li>
              )}
            </ul>
          ) : (
            <p className="text-sm text-gray-500">No options available.</p>
          )}
        </CardContent>
        <CardFooter className="p-4 border-t border-gray-100 bg-gray-50 flex flex-col gap-2">
          {isEditable && (
            <div className="flex w-full gap-2">
              <Button
                onClick={handleEdit}
                className="flex-1 bg-green-500 hover:bg-green-600 text-white rounded-lg py-2.5 font-semibold transition-colors duration-200 shadow-sm hover:shadow-md"
              >
                Edit
              </Button>
              <Button
                onClick={handleDelete}
                className="flex-1 bg-red-500 hover:bg-red-600 text-white rounded-lg py-2.5 font-semibold transition-colors duration-200 shadow-sm hover:shadow-md"
              >
                Delete
              </Button>
            </div>
          )}
        </CardFooter>
      </Card>
    </motion.div>
  );
}


export default function MyCreatedPollsPage() {
  const { isAuthenticated, loading: authLoading, initializeAuth, user } = useAuthStore();
  const router = useRouter();
  const [myPolls, setMyPolls] = useState([]);
  const [loadingMyPolls, setLoadingMyPolls] = useState(true);
  const [editingPoll, setEditingPoll] = useState(null);

  const _getToken = useCallback(() => {
    const { token } = useAuthStore.getState();
    console.log('[_getToken] Current token status (Page):', token ? 'Token exists' : 'No token');
    return token;
  }, []);

  useEffect(() => {
    console.log('[useEffect - Auth Init] authLoading:', authLoading, 'isAuthenticated:', isAuthenticated);
    if (authLoading) {
      initializeAuth();
    }
  }, [authLoading, isAuthenticated, initializeAuth]);

  useEffect(() => {
    console.log('[useEffect - Redirect] authLoading:', authLoading, 'isAuthenticated:', isAuthenticated);
    if (!authLoading && !isAuthenticated) {
      router.replace('/home');
      toast.info("Please log in to view your created polls.");
    }
  }, [isAuthenticated, authLoading, router]);

  const fetchMyPolls = useCallback(async () => {
    console.log('[fetchMyPolls] Called. isAuthenticated:', isAuthenticated, 'user ID:', user?.id);

    if (isAuthenticated && user?.id) {
      setLoadingMyPolls(true);
      try {
        const token = _getToken();
        if (!token) {
          throw new Error('Authentication required. Please log in to view your polls.');
        }

        console.log('[fetchMyPolls] Making API call to:', `${API_URL}/my-polls`);
        const response = await axios.get(`${API_URL}/my-polls`, {
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        });
        const fetchedPolls = response.data.data;
        setMyPolls(fetchedPolls);
        console.log('[fetchMyPolls] Fetched polls successfully:', fetchedPolls.length, 'polls.');
        console.log('[fetchMyPolls] myPolls state after setMyPolls:', fetchedPolls);
        
        if (fetchedPolls.length === 0) {
          toast.info("You haven't created any polls yet.");
        }
      } catch (error) {
        console.error('[fetchMyPolls] Error fetching user\'s created polls:', error.response?.data || error.message);
        toast.error(error.response?.data?.message || "Failed to retrieve your polls. Please try again.", {
          position: "top-right", autoClose: 3000, hideProgressBar: false, closeOnClick: true, pauseOnHover: true, draggable: true, progress: undefined,
        });
      } finally {
        setLoadingMyPolls(false);
        console.log('[fetchMyPolls] LoadingMyPolls set to false in finally block.');
      }
    } else if (!authLoading && !isAuthenticated) {
      setLoadingMyPolls(false);
      setMyPolls([]);
      console.log('[fetchMyPolls] Not authenticated, stopping poll fetch.');
    } else if (isAuthenticated && !user?.id) {
        setLoadingMyPolls(false);
        toast.error('User ID not found in authentication state. Please try logging in again.');
    }
  }, [isAuthenticated, authLoading, user?.id, _getToken]);

  useEffect(() => {
    console.log('[useEffect - Fetch Polls] authLoading:', authLoading, 'isAuthenticated:', isAuthenticated, 'Current user:', user);
    if (!authLoading) {
      fetchMyPolls();
    }
  }, [authLoading, fetchMyPolls, isAuthenticated, user]);

  const handlePollDeleteSuccess = useCallback(async (deletedPollId) => {
    try {
      const token = _getToken();
      if (!token) {
        toast.error('Authentication required to delete poll.');
        return;
      }

      console.log('[handlePollDeleteSuccess] Deleting poll ID:', deletedPollId);
      await axios.delete(`${API_URL}/${deletedPollId}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      setMyPolls((prevPolls) => prevPolls.filter((poll) => poll._id !== deletedPollId));
      toast.success("Poll deleted successfully!");
      console.log(`[handlePollDeleteSuccess] Poll ${deletedPollId} deleted from state.`);
    } catch (error) {
      console.error('Error deleting poll:', error.response?.data || error.message);
      toast.error(error.response?.data?.message || 'Failed to delete poll.');
    }
  }, [_getToken]);

  const handleEditClick = useCallback((pollToEdit) => {
    setEditingPoll(pollToEdit);
  }, []);

  const handlePollUpdated = useCallback((updatedPoll) => {
    setMyPolls((prevPolls) =>
      prevPolls.map((poll) => (poll._id === updatedPoll._id ? updatedPoll : poll))
    );
    setEditingPoll(null);
    toast.success("Poll updated on display!");
  }, []);

  console.log('[Render] authLoading:', authLoading, 'loadingMyPolls:', loadingMyPolls, 'isAuthenticated:', isAuthenticated);
  if (authLoading || loadingMyPolls) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <svg className="animate-spin h-10 w-10 text-blue-500" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
        </svg>
      </div>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  return (
    <div className="flex min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <Sidebar />
      <div className="flex-1 flex flex-col p-8 lg:ml-64">
        <h1 className="text-5xl font-extrabold text-gray-900 mb-8 pb-4 border-b-4 border-blue-300">
          Your Creations 🌟
        </h1>

        {myPolls.length === 0 ? (
          <div className="bg-white p-10 rounded-xl shadow-2xl text-center border border-dashed border-blue-300">
            <p className="text-2xl text-gray-700 mb-8 font-semibold">
              It's quiet in here... You haven't crafted any polls yet!
            </p>
            <Link href="/create-poll" passHref>
              <Button className="bg-gradient-to-r from-green-500 to-teal-600 hover:from-green-600 hover:to-teal-700 text-white text-xl py-4 px-8 rounded-full shadow-lg transition-all duration-300 transform hover:scale-105 hover:shadow-xl focus:outline-none focus:ring-4 focus:ring-green-300">
                Start Polling Now! 🎉
              </Button>
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-10 place-items-center">
            {myPolls.map((poll) => (
              <PollCard
                key={poll._id}
                poll={poll}
                isEditable={true}
                onDeleteSuccess={handlePollDeleteSuccess}
                onEditClick={handleEditClick}
              />
            ))}
          </div>
        )}
      </div>
      {editingPoll && (
        <EditPollModal
          poll={editingPoll}
          isOpen={!!editingPoll}
          onClose={() => setEditingPoll(null)}
          onSave={handlePollUpdated}
        />
      )}
      <ToastContainer position="top-right" autoClose={3000} hideProgressBar={false} newestOnTop={false} closeOnClick rtl={false} pauseOnFocusLoss draggable pauseOnHover />
    </div>
  );
}
