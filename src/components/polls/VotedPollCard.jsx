
'use client';

import React from 'react';
import Link from 'next/link';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { motion } from 'framer-motion';
import { CheckCircle } from 'lucide-react';

const PLACEHOLDER_IMAGE = "https://placehold.co/400x200/E0E7FF/5C6BC0?text=No+Image";

export default function VotedPollCard({ poll }) {
  if (!poll) return null; 


  const userVotedOptionId = poll.userVote; 
  const userVotedOption = poll.options?.find(opt => opt._id === userVotedOptionId);


  const imageUrl = poll.images && poll.images.length > 0 && poll.images[0]?.url
    ? poll.images[0].url
    : PLACEHOLDER_IMAGE;

  return (
    <Link href={`/polls/${poll._id}`} passHref>
      <motion.div
        className="bg-white rounded-xl shadow-lg hover:shadow-xl transition-shadow duration-300 ease-in-out cursor-pointer overflow-hidden border border-gray-200 h-full flex flex-col max-w-[380px] w-full mx-auto"
        whileHover={{ scale: 1.02, transition: { duration: 0.3 } }}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.1 }}
      >
        <Card className="flex-1 flex flex-col justify-between border-none shadow-none">
          <CardHeader className="p-0 relative">
             <div className="w-full h-40 relative overflow-hidden rounded-t-xl">
                <img
                    src={imageUrl}
                    alt="Poll Visual"
                    className="w-full h-full object-cover"
                    onError={(e) => { e.target.onerror = null; e.target.src = PLACEHOLDER_IMAGE; }}
                />
            </div>
            <div className="p-4 pt-2">
                <CardTitle className="text-xl font-bold text-gray-800 line-clamp-2 leading-tight mb-1">
                    {poll.question}
                </CardTitle>
                <CardDescription className="text-sm text-gray-600">
                    By: <span className="font-medium text-blue-600">{poll.createdBy?.username || 'Anonymous'}</span>
                </CardDescription>
            </div>
          </CardHeader>
          <CardContent className="p-4 pt-0 flex-grow border-t border-gray-100">
            <p className="text-md font-semibold text-gray-700 mb-3">Total Votes: {poll.totalVotes}</p>
            {poll.options && poll.options.length > 0 ? (
              <ul className="text-sm text-gray-700 space-y-2">
                {poll.options.map((option) => (
                  <li
                    key={option._id}
                    className={`flex justify-between items-center p-2 rounded-md transition-colors duration-200 ${
                      userVotedOptionId === option._id ? 'bg-blue-50 border border-blue-200 font-semibold text-blue-800' : 'bg-gray-50 border border-gray-100'
                    }`}
                  >
                    <span className="flex items-center gap-2">
                      {userVotedOptionId === option._id && <CheckCircle className="h-4 w-4 text-blue-600" />}
                      {option.text}
                    </span>
                    <span className="font-medium text-gray-800">{option.votes} votes</span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-gray-500">No options available.</p>
            )}
          </CardContent>
          <CardFooter className="p-4 border-t border-gray-100 bg-gray-50">
            <Button className="w-full bg-blue-600 hover:bg-blue-700 text-white rounded-lg py-2.5 font-semibold transition-colors duration-200 shadow-sm hover:shadow-md">
              View Poll Details
            </Button>
          </CardFooter>
        </Card>
      </motion.div>
    </Link>
  );
}