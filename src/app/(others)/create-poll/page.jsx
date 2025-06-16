
'use client';

import React, { useEffect, useState } from 'react';
import useAuthStore from '@/store/authStore';
import { useRouter } from 'next/navigation';
import Sidebar from '@/components/Sidebar/Sidebar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { motion, AnimatePresence }  from'framer-motion';
import { PlusCircle, XCircle, Image as ImageIcon, Loader2 }  from 'lucide-react';
import pollService from '@/services/pollService';

export default function CreatePollPage() {
  const { isAuthenticated, loading: authLoading, initializeAuth } = useAuthStore();
  const router = useRouter();

  const [question, setQuestion] = useState('');
  const [options, setOptions] = useState(['', '']);
  const [imageFiles, setImageFiles] = useState([]);
  const [imagePreviews, setImagePreviews] = useState([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (authLoading) {
      initializeAuth();
    }
  }, [authLoading, initializeAuth]);

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.replace('/home');
    }
  }, [isAuthenticated, authLoading, router]);

  const handleAddOption = () => {
    if (options.length < 10) {
      setOptions([...options, '']);
    } else {
      toast.warn('You can add a maximum of 10 options.', { position: "top-right" });
    }
  };

  const handleRemoveOption = (indexToRemove) => {
    if (options.length > 2) {
      setOptions(options.filter((_, index) => index !== indexToRemove));
    } else {
      toast.warn('A poll must have at least 2 options.', { position: "top-right" });
    }
  };

  const handleOptionChange = (index, value) => {
    const newOptions = [...options];
    newOptions[index] = value;
    setOptions(newOptions);
  };

  const handleImageChange = (e) => {
    const files = Array.from(e.target.files);
    if (files.length === 0) {
      return;
    }

    const totalImagesLimit = 5;
    const currentTotalImages = imageFiles.length;

   
    const validNewFiles = [];
    files.forEach(file => {
      const allowedTypes = ['image/jpeg', 'image/png', 'image/gif'];
      const maxSize = 5 * 1024 * 1024; // 5 MB

      if (!allowedTypes.includes(file.type)) {
        toast.error(`File "${file.name}" is not an allowed image type (JPEG, PNG, GIF).`, { position: "top-right" });
        return;
      }
      if (file.size > maxSize) {
        toast.error(`File "${file.name}" exceeds the 5MB size limit.`, { position: "top-right" });
        return;
      }
      validNewFiles.push(file);
    });

    if (currentTotalImages + validNewFiles.length > totalImagesLimit) {
      toast.warn(`You can upload a maximum of ${totalImagesLimit} images. Please remove some existing images or select fewer new ones.`, { position: "top-right" });
      e.target.value = ''; 
      return;
    }

    const newImagePreviews = [];
    const newImageFiles = [];
    let processedCount = 0;

    if (validNewFiles.length === 0) {
      e.target.value = ''; 
      return;
    }

    validNewFiles.forEach(file => {
      newImageFiles.push(file);

      const reader = new FileReader();
      reader.onloadend = () => {
        newImagePreviews.push(reader.result);
        processedCount++;
        if (processedCount === validNewFiles.length) {
          setImageFiles(prev => [...prev, ...newImageFiles]);
          setImagePreviews(prev => [...prev, ...newImagePreviews]);
          e.target.value = ''; 
        }
      };
      reader.readAsDataURL(file);
    });
  };

  const handleRemoveImage = (indexToRemove) => {
    setImageFiles(prev => prev.filter((_, index) => index !== indexToRemove));
    setImagePreviews(prev => prev.filter((_, index) => index !== indexToRemove));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);

    if (!question.trim()) {
      toast.error('Poll question cannot be empty.', { position: "top-right" });
      setIsLoading(false);
      return;
    }
    const filteredOptions = options.filter(opt => opt.trim() !== '');
    if (filteredOptions.length < 2) {
      toast.error('Please provide at least two valid options.', { position: "top-right" });
      setIsLoading(false);
      return;
    }
    
    if (imageFiles.length === 0) {
      toast.error('Please upload at least one image for the poll.', { position: "top-right" });
      setIsLoading(false);
      return;
    }

    try {
     
      await pollService.createPoll(question, filteredOptions, imageFiles);
      toast.success('Poll created successfully!', { position: "top-right" });

      
      setQuestion('');
      setOptions(['', '']);
      setImageFiles([]);
      setImagePreviews([]);

      router.push('/home'); 
    } catch (error) {
      console.error('Error creating poll in frontend:', error);
      toast.error(error.response?.data?.message || error.message || 'Failed to create poll. Please try again.', { position: "top-right" });
    } finally {
      setIsLoading(false); 
    }
  };

  if (authLoading || !isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-500 to-purple-600">
        <svg className="animate-spin h-10 w-10 text-white" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
        </svg>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-gray-50">
      <Sidebar />
      <div className="flex-1 p-4 ml-10">
        <motion.div
          className="w-full max-w-4xl mx-auto"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <h1 className="text-3xl font-extrabold text-gray-900 mb-4 border-b-2 pb-2 border-green-200">
            Create Your New Poll
          </h1>
          <p className="text-base text-gray-700 mb-6">
            Engage your community by asking a question and providing options. Don't forget an eye-catching image!
          </p>

          <Card className="max-w-3xl mx-auto p-5 shadow-2xl rounded-2xl bg-white/95 backdrop-blur-sm border border-green-100">
            <CardHeader className="pb-4">
              <CardTitle className="text-2xl font-bold text-gray-900">Poll Details</CardTitle>
              <CardDescription className="text-sm text-gray-600">
                Fill out the form below to create your interactive poll.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                {/* Poll Question Input */}
                <div>
                  <Label htmlFor="question" className="text-base font-semibold text-gray-800 mb-1.5">
                    Poll Question
                  </Label>
                  <Input
                    id="question"
                    type="text"
                    placeholder="E.g., What's your favorite color?"
                    value={question}
                    onChange={(e) => setQuestion(e.target.value)}
                    required
                    className="rounded-lg p-2.5 text-base border-gray-300 focus:ring-green-500 focus:border-green-500 transition duration-300"
                  />
                </div>

                {/* Poll Options Section */}
                <div>
                  <Label className="text-base font-semibold text-gray-800 mb-2 block">
                    Poll Options (min 2, max 10)
                  </Label>
                  <AnimatePresence>
                    {options.map((option, index) => (
                      <motion.div
                        key={index}
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        transition={{ duration: 0.3 }}
                        className="flex items-center space-x-2 mb-2"
                      >
                        <Input
                          id={`option-${index}`}
                          type="text"
                          placeholder={`Option ${index + 1}`}
                          value={option}
                          onChange={(e) => handleOptionChange(index, e.target.value)}
                          required
                          className="flex-1 rounded-lg p-2.5 text-base border-gray-300 focus:ring-blue-500 focus:border-blue-500 transition duration-300"
                        />
                        {options.length > 2 && (
                          <Button
                            type="button"
                            variant="destructive"
                            size="icon"
                            onClick={() => handleRemoveOption(index)}
                            className="rounded-full h-8 w-8 flex-shrink-0"
                          >
                            <XCircle className="h-4 w-4" />
                          </Button>
                        )}
                      </motion.div>
                    ))}
                  </AnimatePresence>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={handleAddOption}
                    disabled={options.length >= 10}
                    className="mt-3 w-full border-dashed border-gray-400 text-gray-700 hover:bg-gray-100 py-2.5 rounded-lg text-base flex items-center justify-center space-x-2 transition duration-300"
                  >
                    <PlusCircle className="h-4 w-4" />
                    <span>Add Another Option</span>
                  </Button>
                </div>

                {/* Image Upload Section */}
                <div className="mb-6">
                  <Label htmlFor="image-upload" className="text-base font-semibold text-gray-800 mb-1.5">
                    Upload Poll Image(s) (Max 5)
                  </Label>
                  <Input
                    id="image-upload"
                    type="file"
                    accept="image/*"
                    multiple
                    onChange={handleImageChange}
                    className="rounded-lg p-2.5 text-base file:text-blue-600 file:font-semibold file:bg-blue-50 file:border-none file:rounded-md file:py-1.5 file:px-3 file:mr-3 hover:file:bg-blue-100 transition duration-300 h-50"
                  />
                  {imagePreviews.length > 0 && (
                    <div className="mt-3 mb-4 grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 p-3 border border-gray-200 rounded-lg bg-gray-50">
                      <AnimatePresence>
                        {imagePreviews.map((previewUrl, index) => (
                          <motion.div
                            key={index}
                            initial={{ opacity: 0, scale: 0.8 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.8 }}
                            transition={{ duration: 0.2 }}
                            className="relative group rounded-lg overflow-hidden shadow-md"
                          >
                            <img src={previewUrl} alt={`Image Preview ${index + 1}`} className="w-full h-24 object-cover" />
                            <Button
                              type="button"
                              variant="destructive"
                              size="icon"
                              onClick={() => handleRemoveImage(index)}
                              className="absolute top-1 right-1 rounded-full h-6 w-6 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-200"
                            >
                              <XCircle className="h-4 w-4" />
                            </Button>
                            <span className="absolute bottom-0 left-0 right-0 bg-black bg-opacity-50 text-white text-xs text-center p-1 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                              {imageFiles[index]?.name}
                            </span>
                          </motion.div>
                        ))}
                      </AnimatePresence>
                    </div>
                  )}
                </div>

                {/* Submit Button */}
                <Button
                  type="submit"
                  disabled={isLoading}
                  className="w-full bg-gradient-to-r from-green-500 to-teal-600 hover:from-green-600 hover:to-teal-700 text-white py-3 rounded-lg text-lg font-semibold shadow-lg transition duration-300 ease-in-out transform hover:-translate-y-1 hover:shadow-xl flex items-center justify-center space-x-2"
                >
                  {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  <span>{isLoading ? 'Creating Poll...' : 'Create Poll'}</span>
                </Button>
              </form>
            </CardContent>
            <CardFooter className="flex justify-center pt-4">
            </CardFooter>
          </Card>
        </motion.div>
      </div>
      <ToastContainer />
    </div>
  );
}