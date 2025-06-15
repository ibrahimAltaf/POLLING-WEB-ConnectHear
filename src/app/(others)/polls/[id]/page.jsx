// src/app/polls/[id]/page.jsx
'use client';

import React, { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import useAuthStore from '@/store/authStore';
import pollService from '@/services/pollService';
import Sidebar from '@/components/Sidebar/Sidebar'; // Sidebar component ka sahi path
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress'; // Shadcn Progress component
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { motion } from 'framer-motion';
import { Loader2, CheckCircle2, User, XCircle } from 'lucide-react'; // Icons for loading, check, user, remove vote
import Link from 'next/link';

export default function PollDetailPage() {
  const { id } = useParams(); // URL se poll ID extract karein
  const router = useRouter();
  const { user, isAuthenticated, loading: authLoading, initializeAuth } = useAuthStore();

  const [poll, setPoll] = useState(null);
  const [loadingPoll, setLoadingPoll] = useState(true);
  const [selectedOption, setSelectedOption] = useState(null);
  const [hasVoted, setHasVoted] = useState(false);
  const [userVoteOptionId, setUserVoteOptionId] = useState(null); // User ne kis option ko vote kiya hai
  const [isVoting, setIsVoting] = useState(false); // Voting process loading state
  const [showVoters, setShowVoters] = useState(false); // Voters list dikhane ke liye state

  // Auth state initialize karein component mount hone par
  useEffect(() => {
    if (authLoading) {
      initializeAuth();
    }
  }, [authLoading, initializeAuth]);

  // Poll details fetch karein aur user ke vote status ko check karein
  useEffect(() => {
    const fetchPoll = async () => {
      if (!id) return; // Agar ID nahi hai to fetch na karein

      setLoadingPoll(true);
      try {
        const fetchedPoll = await pollService.getPollById(id);
        setPoll(fetchedPoll);

        // Check if the current user has already voted
        if (isAuthenticated && user?.id && fetchedPoll.votedBy.includes(user.id)) {
          setHasVoted(true);
          // Find which option the user voted for
          const votedOption = fetchedPoll.options.find(opt => opt.voters?.includes(user.id));
          if (votedOption) {
            setUserVoteOptionId(votedOption._id);
          }
        } else {
          setHasVoted(false);
          setUserVoteOptionId(null);
        }
      } catch (error) {
        toast.error(error.message || "Failed to load poll details.", { position: "top-right" });
        router.push('/home'); // Error hone par home page par redirect karein
      } finally {
        setLoadingPoll(false);
      }
    };

    if (!authLoading) { // Sirf tab fetch karein jab auth state load ho chuki ho
      fetchPoll();
    }
  }, [id, isAuthenticated, user?.id, authLoading, router]); // Dependencies: poll ID, auth state, user ID

  // Vote cast karne ka handler
  const handleVote = async () => {
    if (!selectedOption) {
      toast.warn('Please select an option to vote.', { position: "top-right" });
      return;
    }
    if (hasVoted) {
      toast.info('You have already voted on this poll.', { position: "top-right" });
      return;
    }

    setIsVoting(true);
    try {
      const response = await pollService.voteOnPoll(id, selectedOption);
      setPoll(response.data); // Updated poll data se state update karein
      setHasVoted(true); // User ne vote kar diya hai
      setUserVoteOptionId(selectedOption); // User ke vote ko record karein
      toast.success('Your vote has been cast successfully!', { position: "top-right" });
    } catch (error) {
      toast.error(error.message || 'Failed to cast your vote. Please try again.', { position: "top-right" });
    } finally {
      setIsVoting(false);
    }
  };

  // Vote remove karne ka handler
  // NOTE: Is function ko work karne ke liye aapko backend mein `/api/polls/:id/remove-vote` endpoint implement karna hoga.
  // Poll model se `votedBy` array se user ID ko remove karein aur option ke `votes` ko decrement karein.
  const handleRemoveVote = async () => {
    if (!isAuthenticated || !user?.id) {
      toast.error('You must be logged in to remove your vote.', { position: "top-right" });
      return;
    }
    if (!hasVoted) {
      toast.info('You have not voted on this poll yet.', { position: "top-right" });
      return;
    }

    setIsVoting(true);
    try {
      // Backend se remove vote API call karein
      // Iske liye aapko pollService mein `removeVoteOnPoll` function add karna hoga
      // Aur backend mein iska corresponding endpoint banana hoga.
      const response = await pollService.removeVoteOnPoll(id, userVoteOptionId, user.id); // Assuming backend needs pollId, optionId, userId
      setPoll(response.data); // Updated poll data se state update karein
      setHasVoted(false); // User ka vote remove ho gaya hai
      setUserVoteOptionId(null); // User ke vote option ID ko reset karein
      toast.info('Your vote has been removed successfully!', { position: "top-right" });
    } catch (error) {
      toast.error(error.message || 'Failed to remove your vote. Please try again.', { position: "top-right" });
    } finally {
      setIsVoting(false);
    }
  };

  // Loading spinner dikhayein jab authentication ya poll details load ho rahe hon
  if (authLoading || loadingPoll) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-500 to-purple-600">
        <svg className="animate-spin h-10 w-10 text-white" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
        </svg>
      </div>
    );
  }

  // Agar poll load hone ke baad bhi null hai (e.g., poll not found)
  if (!poll) {
    return (
      <div className="flex min-h-screen bg-gray-50">
        <Sidebar />
        <div className="flex-1 flex flex-col p-6 lg:ml-64 items-center justify-center">
          <Card className="max-w-md w-full p-8 shadow-lg rounded-xl text-center">
            <CardTitle className="text-3xl font-bold text-red-600 mb-4">Poll Not Found</CardTitle>
            <CardDescription className="text-gray-700 mb-6">
              The poll you are looking for does not exist or has been deleted.
            </CardDescription>
            <Link href="/home" passHref>
              <Button className="bg-blue-600 hover:bg-blue-700 text-white text-lg py-3 px-6 rounded-lg shadow-md transition-all duration-300">
                Go to All Polls
              </Button>
            </Link>
          </Card>
        </div>
      </div>
    );
  }

  const totalVotes = poll.totalVotes || 0; // Total votes calculate karein

  return (
    <div className="flex min-h-screen bg-gray-50">
      <Sidebar />
      <div className="flex-1 flex flex-col p-4 lg:ml-64 overflow-y-auto">
        <motion.div
          className="w-full max-w-4xl mx-auto"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <h1 className="text-3xl font-extrabold text-gray-900 mb-4 border-b-2 pb-2 border-blue-200">
            Poll Details
          </h1>
          <p className="text-base text-gray-700 mb-6">
            View the poll, cast your vote, and see real-time results.
          </p>

          <Card className="p-6 shadow-2xl rounded-2xl bg-white/95 backdrop-blur-sm border border-blue-100 mb-6">
            <CardHeader className="pb-4">
              {poll.image && poll.image.url && (
                <img
                  src={`${process.env.NEXT_PUBLIC_API_URL}${poll.image.url}`}
                  alt="Poll Visual"
                  className="w-full h-64 object-cover rounded-lg mb-4 border border-gray-100 shadow-sm"
                  onError={(e) => { e.target.onerror = null; e.target.src="https://placehold.co/600x300/E0E7FF/5C6BC0?text=No+Image"; }}
                />
              )}
              <CardTitle className="text-3xl font-bold text-gray-900 leading-tight mb-2">
                {poll.question}
              </CardTitle>
              <CardDescription className="text-base text-gray-600">
                Created by: <span className="font-semibold text-blue-600">{poll.createdBy?.username || 'Anonymous'}</span>
              </CardDescription>
              <p className="text-sm text-gray-500 mt-1">Total Votes: {totalVotes}</p>
            </CardHeader>

            <CardContent className="space-y-4">
              {/* Voting Options */}
              {!hasVoted && ( // Sirf tab dikhayein jab user ne vote na kiya ho
                <div className="space-y-3">
                  <p className="text-lg font-semibold text-gray-800">Choose your option:</p>
                  {poll.options.map((option) => (
                    <Button
                      key={option._id}
                      variant={selectedOption === option._id ? "secondary" : "outline"}
                      className={`w-full justify-start text-lg py-3 rounded-lg border transition-colors duration-200 ${
                        selectedOption === option._id
                          ? 'bg-blue-100 border-blue-500 text-blue-800 font-semibold'
                          : 'border-gray-300 hover:bg-gray-100 text-gray-700'
                      }`}
                      onClick={() => setSelectedOption(option._id)}
                      disabled={isVoting}
                    >
                      {option.text}
                    </Button>
                  ))}
                  <Button
                    onClick={handleVote}
                    disabled={isVoting || !selectedOption}
                    className="w-full bg-gradient-to-r from-blue-600 to-purple-700 hover:from-blue-700 hover:to-purple-800 text-white py-3.5 rounded-lg text-xl font-semibold shadow-lg transition duration-300 ease-in-out transform hover:-translate-y-1 hover:shadow-xl flex items-center justify-center space-x-2 mt-4"
                  >
                    {isVoting && <Loader2 className="mr-2 h-5 w-5 animate-spin" />}
                    <span>{isVoting ? 'Submitting Vote...' : 'Vote'}</span>
                  </Button>
                </div>
              )}

              {/* Poll Results (only if user has voted or totalVotes > 0) */}
              {(hasVoted || totalVotes > 0) && (
                <div className="mt-6 pt-4 border-t border-gray-200 space-y-4">
                  <p className="text-lg font-semibold text-gray-800">Poll Results:</p>
                  {poll.options.map((option) => {
                    const percentage = totalVotes > 0 ? ((option.votes / totalVotes) * 100).toFixed(1) : 0;
                    return (
                      <div key={option._id} className="mb-3">
                        <div className="flex justify-between items-center mb-1">
                          <span className={`text-md font-medium ${userVoteOptionId === option._id && isAuthenticated ? 'text-blue-700' : 'text-gray-800'}`}>
                            {option.text}
                            {userVoteOptionId === option._id && isAuthenticated && (
                              <CheckCircle2 className="inline-block h-4 w-4 ml-2 text-blue-600" />
                            )}
                          </span>
                          <span className="text-md font-semibold text-gray-700">{percentage}% ({option.votes} votes)</span>
                        </div>
                        <Progress value={percentage} className="w-full h-3 rounded-full bg-gray-200" indicatorClassName="bg-blue-500" />
                      </div>
                    );
                  })}
                  {/* Remove Vote Button */}
                  {isAuthenticated && hasVoted && (
                    <Button
                      onClick={handleRemoveVote}
                      disabled={isVoting}
                      variant="outline"
                      className="w-full mt-4 border-red-400 text-red-600 hover:bg-red-50 py-2.5 rounded-lg text-base font-medium transition duration-300 flex items-center justify-center space-x-2"
                    >
                      {isVoting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                      <XCircle className="h-4 w-4 mr-2" />
                      <span>{isVoting ? 'Removing Vote...' : 'Remove My Vote'}</span>
                    </Button>
                  )}
                </div>
              )}
            </CardContent>
            <CardFooter className="pt-4 flex justify-between items-center">
              <Button
                variant="ghost"
                onClick={() => setShowVoters(!showVoters)}
                className="text-blue-600 hover:underline text-sm"
              >
                {showVoters ? 'Hide Voters' : 'Show Voters'}
              </Button>
              <Link href="/home" passHref>
                <Button variant="ghost" className="text-gray-600 hover:underline text-sm">
                  Back to All Polls
                </Button>
              </Link>
            </CardFooter>
          </Card>

          {/* Voters List Section (Conditional Rendering) */}
          <AnimatePresence>
            {showVoters && poll.votedBy && poll.votedBy.length > 0 && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.3 }}
                className="mt-6 p-6 shadow-2xl rounded-2xl bg-white/95 backdrop-blur-sm border border-gray-100"
              >
                <h3 className="text-xl font-bold text-gray-800 mb-4 border-b pb-2">
                  Voters ({poll.votedBy.length})
                </h3>
                <ul className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-md text-gray-700">
                  {poll.votedBy.map((voterId) => (
                    // NOTE: This will display raw user IDs. To display usernames,
                    // your backend would need to populate the 'votedBy' field with
                    // full user objects or provide a separate endpoint for voter details.
                    <li key={voterId} className="flex items-center space-x-2 p-2 bg-gray-50 rounded-md">
                      <User className="h-4 w-4 text-gray-500" />
                      <span>{voterId}</span> {/* Displaying raw ID for now */}
                    </li>
                  ))}
                </ul>
              </motion.div>
            )}
            {showVoters && poll.votedBy && poll.votedBy.length === 0 && (
                 <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    transition={{ duration: 0.3 }}
                    className="mt-6 p-6 shadow-2xl rounded-2xl bg-white/95 backdrop-blur-sm border border-gray-100 text-center"
                 >
                    <p className="text-lg text-gray-600">No one has voted on this poll yet.</p>
                 </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      </div>
      <ToastContainer />
    </div>
  );
}
