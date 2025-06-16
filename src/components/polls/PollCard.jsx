'use client';

import React from 'react';
import Link from 'next/link';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { motion } from 'framer-motion';

export default function PollCard({ poll }) {
  if (!poll) return null; 

  return (
    <Link href={`/polls/${poll._id}`} passHref>
      <motion.div
        className="bg-white rounded-xl shadow-lg hover:shadow-xl transition-shadow duration-300 ease-in-out cursor-pointer overflow-hidden border border-gray-200 h-full flex flex-col"
        whileHover={{ scale: 1.02, transition: { duration: 0.3 } }}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.1 }}
      >
        <Card className="flex-1 flex flex-col justify-between border-none shadow-none">
          <CardHeader className="p-4 pb-2">
           
            {poll.image && poll.image.url && (
              <img
                src={poll.image.url}
                alt="Poll Visual"
                className="w-full h-48 object-cover rounded-md mb-3 border border-gray-100"
                onError={(e) => { e.target.onerror = null; e.target.src="https://placehold.co/400x200/E0E7FF/5C6BC0?text=No+Image"; }} // Placeholder on error
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
          <CardFooter className="p-4 border-t border-gray-100 bg-gray-50">
            <Button className="w-full bg-blue-600 hover:bg-blue-700 text-white rounded-lg py-2.5 font-semibold transition-colors duration-200 shadow-sm hover:shadow-md">
              View Poll
            </Button>
          </CardFooter>
        </Card>
      </motion.div>
    </Link>
  );
}