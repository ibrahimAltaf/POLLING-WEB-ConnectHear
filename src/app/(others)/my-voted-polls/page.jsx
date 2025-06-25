
'use client';

import React, { useEffect, useState, useCallback } from 'react';
import useAuthStore from '@/store/authStore';
import { useRouter } from 'next/navigation';
import Sidebar from '@/components/Sidebar/Sidebar';
import { Button } from '@/components/ui/button';
import { X, Plus, ImageIcon, Loader2 } from 'lucide-react'; 
import Link from 'next/link';
import axios from 'axios';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { motion } from 'framer-motion';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://connecthearpolling.vercel.app/api/polls';


function PollCard({ poll }) {
  if (!poll) return null;

  const primaryImage = poll.images && poll.images.length > 0 ? poll.images[0] : null;



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
      </Card>
    </motion.div>
  );
}


export default function MyVotedPollsPage() {
  const { isAuthenticated, loading: authLoading, initializeAuth, user } = useAuthStore();
  const router = useRouter();
  const [votedPolls, setVotedPolls] = useState([]); 
  const [loadingVotedPolls, setLoadingVotedPolls] = useState(true); 

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
      toast.info("Please log in to view your voted polls."); 
    }
  }, [isAuthenticated, authLoading, router]);

  const fetchVotedPolls = useCallback(async () => { 
    console.log('[fetchVotedPolls] Called. isAuthenticated:', isAuthenticated, 'user ID:', user?.id); 

    if (isAuthenticated && user?.id) {
      setLoadingVotedPolls(true); 
      try {
        const token = _getToken();
        if (!token) {
          throw new Error('Authentication required. Please log in to view your voted polls.'); 
        }

        console.log('[fetchVotedPolls] Making API call to:', `${API_URL}/voted-polls`); 
        const response = await axios.get(`${API_URL}/voted-polls`, { 
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        });
        const fetchedPolls = response.data.data;
        setVotedPolls(fetchedPolls);
        console.log('[fetchVotedPolls] Fetched voted polls successfully:', fetchedPolls.length, 'polls.'); 
        console.log('[fetchVotedPolls] votedPolls state after setVotedPolls:', fetchedPolls); 
        
        if (fetchedPolls.length === 0) {
          toast.info("You haven't voted on any polls yet!");
        }
      } catch (error) {
        console.error('[fetchVotedPolls] Error fetching user\'s voted polls:', error.response?.data || error.message); 
        toast.error(error.response?.data?.message || "Failed to retrieve your voted polls. Please try again.", { 
          position: "top-right", autoClose: 3000, hideProgressBar: false, closeOnClick: true, pauseOnHover: true, draggable: true, progress: undefined,
        });
      } finally {
        setLoadingVotedPolls(false); 
        console.log('[fetchVotedPolls] LoadingVotedPolls set to false in finally block.'); 
      }
    } else if (!authLoading && !isAuthenticated) {
      setLoadingVotedPolls(false);
      setVotedPolls([]);
      console.log('[fetchVotedPolls] Not authenticated, stopping voted poll fetch.');
    } else if (isAuthenticated && !user?.id) {
        setLoadingVotedPolls(false);
        toast.error('User ID not found in authentication state. Please try logging in again.');
    }
  }, [isAuthenticated, authLoading, user?.id, _getToken]);

  useEffect(() => {
    console.log('[useEffect - Fetch Polls] authLoading:', authLoading, 'isAuthenticated:', isAuthenticated, 'Current user:', user);
    if (!authLoading) {
      fetchVotedPolls(); 
    }
  }, [authLoading, fetchVotedPolls, isAuthenticated, user]);


  

  console.log('[Render] authLoading:', authLoading, 'loadingVotedPolls:', loadingVotedPolls, 'isAuthenticated:', isAuthenticated); // Updated log
  if (authLoading || loadingVotedPolls) {
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
          Your Voted Polls 🗳️ 
        </h1>

        {votedPolls.length === 0 ? (
          <div className="bg-white p-10 rounded-xl shadow-2xl text-center border border-dashed border-blue-300">
            <p className="text-2xl text-gray-700 mb-8 font-semibold">
              You haven't voted on any polls yet! Time to make your voice heard.
            </p>
           
            <Link href="/home" passHref>
              <Button className="bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white text-xl py-4 px-8 rounded-full shadow-lg transition-all duration-300 transform hover:scale-105 hover:shadow-xl focus:outline-none focus:ring-4 focus:ring-blue-300">
                Explore Polls
              </Button>
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-10 place-items-center">
            {votedPolls.map((poll) => ( 
              <PollCard
                key={poll._id}
                poll={poll}
               
              />
            ))}
          </div>
        )}
      </div>
    
      <ToastContainer position="top-right" autoClose={3000} hideProgressBar={false} newestOnTop={false} closeOnClick rtl={false} pauseOnFocusLoss draggable pauseOnHover />
    </div>
  );
}
