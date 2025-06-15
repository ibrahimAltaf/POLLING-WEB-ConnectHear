'use client';

import React, { useEffect, useState, useCallback } from 'react';
import useAuthStore from '@/store/authStore';
import pollService from '@/services/pollService';
import Sidebar from '@/components/Sidebar/Sidebar';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { ChevronLeft, ChevronRight, UserRound, ShieldQuestion } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

const PLACEHOLDER_IMAGE = "https://placehold.co/400x200/E0E7FF/5C6BC0?text=No+Image";

const ProgressBar = ({ percentage }) => {
  return (
    <div className="w-full bg-gray-200 rounded-full h-2.5 dark:bg-gray-700 overflow-hidden mt-1">
      <div
        className="bg-blue-600 h-2.5 rounded-full transition-all duration-500 ease-out"
        style={{ width: `${percentage}%` }}
      ></div>
    </div>
  );
};

const PollCard = ({ poll, user, onPollUpdated }) => {
  const [selectedOption, setSelectedOption] = useState(null);
  const [isVoting, setIsVoting] = useState(false);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  // Determine if the logged-in user (if any) has voted
  const hasLoggedInUserVoted = user && poll.votedBy?.includes(user._id);

  // Determine if results should be shown (if user voted or any votes exist)
  // Results are shown if logged-in user voted, OR if there's any total vote count greater than 0
  const showResults = hasLoggedInUserVoted || (poll.totalVotes && poll.totalVotes > 0);
  
  // Determine if the user can cast a vote (only if they haven't already voted)
  const canCastVote = !hasLoggedInUserVoted;

  if (!poll) return null;

  const handleVote = async () => {
    if (!selectedOption) {
      toast.warn("Please select an option to vote.");
      return;
    }
    setIsVoting(true);
    try {
      // Pass the selected option ID to the service
      const response = await pollService.vote(poll._id, selectedOption);
      toast.success("Vote cast successfully!");
      // Update the parent component's state with the fresh poll data from the backend
      onPollUpdated(response.data.data);
      setSelectedOption(null); // Reset selected option after vote
    } catch (error) {
      console.error("Error during vote in PollCard:", error);
      toast.error(error.response?.data?.message || error.message || "Failed to cast vote.", { autoClose: 5000 });
    } finally {
      setIsVoting(false);
    }
  };

  const images = poll.images || [];
  const hasMultipleImages = images.length > 1;

  const nextImage = () => {
    setCurrentImageIndex((prevIndex) => (prevIndex + 1) % images.length);
  };

  const prevImage = () => {
    setCurrentImageIndex((prevIndex) => (prevIndex - 1 + images.length) % images.length);
  };

  const currentImageUrl = images.length > 0 && images[currentImageIndex]?.url
    ? images[currentImageIndex].url
    : PLACEHOLDER_IMAGE;

  return (
    <motion.div
      className="bg-white rounded-xl shadow-lg hover:shadow-xl transition-shadow duration-300 ease-in-out overflow-hidden border border-gray-100 flex flex-col h-full"
      whileHover={{ scale: 1.02, transition: { duration: 0.3 } }}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.1 }}
      style={{ minWidth: '280px' }} 
    >
      <Card className="flex-1 flex flex-col justify-between border-none shadow-none">
        <CardHeader className="p-0 pb-2 relative">
          <div className="w-full h-48 relative overflow-hidden rounded-t-xl">
            <img
              src={currentImageUrl}
              alt="Poll Visual"
              className="w-full h-full object-cover"
              onError={(e) => { e.target.onerror = null; e.target.src=PLACEHOLDER_IMAGE; }}
            />
            {hasMultipleImages && (
              <>
                <button
                  onClick={(e) => { e.preventDefault(); e.stopPropagation(); prevImage(); }}
                  className="absolute left-2 top-1/2 -translate-y-1/2 bg-black bg-opacity-50 text-white p-1.5 rounded-full hover:bg-opacity-75 transition"
                >
                  <ChevronLeft size={20} />
                </button>
                <button
                  onClick={(e) => { e.preventDefault(); e.stopPropagation(); nextImage(); }}
                  className="absolute right-2 top-1/2 -translate-y-1/2 bg-black bg-opacity-50 text-white p-1.5 rounded-full hover:bg-opacity-75 transition"
                >
                  <ChevronRight size={20} />
                </button>
                <div className="absolute bottom-2 left-0 right-0 flex justify-center space-x-1">
                  {images.map((_, index) => (
                    <span
                      key={index}
                      className={`block w-2 h-2 rounded-full ${currentImageIndex === index ? 'bg-white' : 'bg-gray-400'}`}
                    ></span>
                  ))}
                </div>
              </>
            )}
          </div>
          <div className="p-4 pt-2">
            <CardTitle className="text-xl font-bold text-gray-800 line-clamp-2 leading-tight mb-1">
              {poll.question}
            </CardTitle>
            <CardDescription className="text-sm text-gray-600">
              By: <span className="font-medium text-blue-600">{poll.createdBy?.username || 'Anonymous'}</span>
              <span className="ml-2"> • </span>
              <span className="text-gray-500">{formatDistanceToNow(new Date(poll.createdAt), { addSuffix: true })}</span>
            </CardDescription>
          </div>
        </CardHeader>
        <CardContent className="p-4 pt-0 flex-grow border-t border-gray-100">
          <p className="text-md font-semibold text-gray-700 mb-3">Total Votes: {poll.totalVotes}</p>
          {poll.options && poll.options.length > 0 ? (
            <RadioGroup onValueChange={setSelectedOption} disabled={hasLoggedInUserVoted || isVoting} className="space-y-2">
              {poll.options.map((option) => {
                const votes = Number(option.votes) || 0;
                const totalVotes = Number(poll.totalVotes) || 0;
                // Calculate percentage, handling division by zero
                const percentage = totalVotes > 0 ? ((votes / totalVotes) * 100).toFixed(1) : 0;

                return (
                  <div key={option._id} className="relative flex flex-col p-2 rounded-md hover:bg-gray-50 transition-colors group">
                    <div className="flex items-center space-x-2">
                      {canCastVote && (
                        <RadioGroupItem value={option._id} id={`option-${poll._id}-${option._id}`} />
                      )}
                      <label 
                        htmlFor={`option-${poll._id}-${option._id}`} 
                        className={`text-sm font-medium leading-none flex-grow ${!canCastVote ? 'peer-disabled:cursor-not-allowed peer-disabled:opacity-70' : ''}`}
                      >
                        {option.text}
                      </label>
                      {/* Show votes and percentage if results are to be displayed */}
                      {showResults && (
                        <span className="ml-auto text-gray-600 text-sm font-semibold">
                          {votes} votes ({percentage}%)
                        </span>
                      )}
                    </div>
                    {/* Show progress bar if results are to be displayed */}
                    {showResults && <ProgressBar percentage={percentage} />}
                  </div>
                );
              })}
            </RadioGroup>
          ) : (
            <p className="text-sm text-gray-500">No options available.</p>
          )}

          <div className="mt-6 text-sm text-gray-600">
            <h4 className="font-semibold text-gray-800 mb-2">Recent Participants:</h4>
            {/* Conditional display for participants */}
            {poll.votedByDetails && poll.votedByDetails.length > 0 || hasLoggedInUserVoted ? (
              <div className="flex flex-wrap gap-2">
                {/* Always show the logged-in user if they've voted, as the first participant */}
                {hasLoggedInUserVoted && user && (
                  <span className="bg-blue-200 text-blue-900 px-2 py-1 rounded-full text-xs font-medium flex items-center gap-1 border border-blue-400">
                    <UserRound size={14} className="inline-block" /> You
                  </span>
                )}

                {/* Show other participants, filtering out the current user to avoid duplication */}
                {/* Adjust slice limit based on whether 'You' badge is displayed to maintain overall limit */}
                {poll.votedByDetails
                  .filter(voter => !(hasLoggedInUserVoted && user && voter._id === user._id)) // Filter out current user if 'You' is shown
                  .slice(0, 5 - (hasLoggedInUserVoted && user ? 1 : 0)) // Show up to 5 names total (including 'You')
                  .map((voter) => (
                    <span key={voter._id} className="bg-blue-100 text-blue-800 px-2 py-1 rounded-full text-xs font-medium flex items-center gap-1">
                      <UserRound size={14} className="inline-block" /> {voter.username || 'Anonymous'}
                    </span>
                  ))}
                {/* Show "+X more" if there are more participants than currently displayed */}
                {poll.votedByDetails.length > 5 - (hasLoggedInUserVoted && user ? 1 : 0) && (
                  <span className="bg-gray-100 text-gray-600 px-2 py-1 rounded-full text-xs font-medium">
                    +{poll.votedByDetails.length - (5 - (hasLoggedInUserVoted && user ? 1 : 0))} more
                  </span>
                )}
              </div>
            ) : (
              <p className="text-sm text-gray-500">No logged-in users have participated yet.</p>
            )}
            {/* Show anonymous votes if any */}
            {poll.anonymousVotes > 0 && (
              <p className="mt-2 font-semibold text-gray-700 text-sm flex items-center gap-1">
                <ShieldQuestion size={14} className="inline-block" /> Plus {poll.anonymousVotes} anonymous vote{poll.anonymousVotes > 1 ? 's' : ''}.
              </p>
            )}
            {/* Message if no votes at all */}
            {poll.totalVotes === 0 && <p className="text-sm text-gray-500 mt-2">Be the first to cast a vote!</p>}
          </div>
        </CardContent>
        <CardFooter className="p-4 border-t border-gray-100 bg-gray-50">
          {hasLoggedInUserVoted ? (
            <Button className="w-full bg-gray-400 text-white rounded-lg py-2.5 font-semibold cursor-not-allowed opacity-90" disabled>
              You've Voted!
            </Button>
          ) : (
            <Button
              className="w-full bg-blue-600 hover:bg-blue-700 text-white rounded-lg py-2.5 font-semibold transition-all duration-300 ease-in-out shadow-md hover:shadow-lg transform hover:-translate-y-0.5 active:translate-y-0"
              onClick={handleVote}
              disabled={isVoting || !selectedOption} // Disable if voting or no option selected
            >
              {isVoting ? 'Submitting Vote...' : 'Vote Now'}
            </Button>
          )}
        </CardFooter>
      </Card>
    </motion.div>
  );
};


export default function HomePage() {
  const { user, isAuthenticated, loading: authLoading, initializeAuth } = useAuthStore();
  const [polls, setPolls] = useState([]);
  const [loadingPolls, setLoadingPolls] = useState(true);

  // Initialize auth state on component mount
  useEffect(() => {
    if (authLoading) {
      initializeAuth();
    }
  }, [authLoading, initializeAuth]);

  // Function to fetch all polls from the backend
  const fetchPolls = useCallback(async () => {
    setLoadingPolls(true);
    try {
      const fetchedPolls = await pollService.getAllPolls();
      // Assume pollService.getAllPolls() returns response.data.data directly (an array of polls)
      setPolls(fetchedPolls);
    } catch (error) {
      console.error("Error fetching all polls:", error);
      toast.error(error.message || "Failed to retrieve polls from the server.", {
        position: "top-right",
        autoClose: 3000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true,
        progress: undefined,
      });
    } finally {
      setLoadingPolls(false);
    }
  }, []);

  // Handler to update a single poll in the state after a vote or other change
  const handlePollUpdated = useCallback((updatedPoll) => {
    if (!updatedPoll || !updatedPoll._id) {
      console.error("handlePollUpdated: Invalid updatedPoll object (missing _id).", updatedPoll);
      // Fallback: If the updated poll is invalid, refetch all polls to ensure data consistency
      fetchPolls();
      return;
    }

    setPolls((prevPolls) => {
      const newPolls = prevPolls.map((p) => {
        if (p && p._id && p._id === updatedPoll._id) {
          return updatedPoll; // Replace the old poll with the updated one
        }
        return p;
      });
      return newPolls;
    });
  }, [fetchPolls]); 

  // Fetch polls once authentication state is determined (not loading)
  useEffect(() => {
    if (!authLoading) {
      fetchPolls();
    }
  }, [authLoading, fetchPolls]); 

  // Loading state UI
  if (authLoading || loadingPolls) {
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

      <div className="flex-1 flex flex-col p-6 ">
        <motion.div
          className="w-full"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <h1 className="text-4xl font-extrabold text-gray-900 mb-6 border-b-2 pb-2 border-blue-200">
            {isAuthenticated ? `Welcome, ${user?.username || 'User'}!` : 'Explore Public Polls'}
          </h1>
          <p className="text-lg text-gray-700 mb-8">
            {isAuthenticated
              ? "Discover the latest polls from the ConnectHear community. Participate or create your own!"
              : "Browse polls as a guest. To create and manage your own polls, or track your votes, please log in or sign up."}
          </p>

          {polls.length === 0 ? (
            <div className="text-center p-10 bg-white rounded-lg shadow-md">
              <p className="text-xl text-gray-600 mb-6">No polls are available yet. Be the first to create one!</p>
              {isAuthenticated && (
                <Link href="/create-poll" passHref>
                  <Button className="bg-green-500 hover:bg-green-600 text-white text-lg py-3 px-6 rounded-lg shadow-md transition-all duration-300 transform hover:scale-105">
                    Create My First Poll
                  </Button>
                </Link>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 place-items-stretch">
              {polls.map((poll) => (
                <PollCard
                  key={poll._id}
                  poll={poll}
                  user={user} // Pass the current user to PollCard
                  onPollUpdated={handlePollUpdated} // Pass the handler to update poll state
                />
              ))}
            </div>
          )}
        </motion.div>
      </div>
      <ToastContainer />
    </div>
  );
}