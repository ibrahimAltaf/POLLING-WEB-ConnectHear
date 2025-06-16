// src/components/polls/PollPreviewCard.jsx
'use client';

import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress'; 
import { motion } from 'framer-motion';


export default function PollPreviewCard({ question, options, imagePreviews }) {
  // Filter out empty options for a cleaner preview
  const validOptions = options.filter(opt => opt.trim() !== '');

  
  const totalPreviewVotes = validOptions.length > 0 ? validOptions.length * 5 : 0; 

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.3 }}
      className="w-full h-full flex flex-col" 
    >
      <Card className="flex-1 p-5 shadow-xl rounded-2xl bg-white/90 backdrop-blur-sm border border-blue-100">
        <CardHeader className="pb-4">
          {imagePreviews && imagePreviews.length > 0 ? (
            <img
              src={imagePreviews[0]} 
              alt="Poll Preview Image"
              className="w-full h-48 object-cover rounded-lg mb-4 border border-gray-100 shadow-sm"
            />
          ) : (
            <div className="w-full h-48 bg-gray-200 rounded-lg mb-4 flex items-center justify-center text-gray-500">
              <span className="text-center">Image Preview (Upload an image)</span>
            </div>
          )}
          <CardTitle className="text-2xl font-bold text-gray-900 leading-tight mb-2">
            {question.trim() || 'Your Poll Question Here'}
          </CardTitle>
          <CardDescription className="text-sm text-gray-600">
            Preview by: <span className="font-semibold text-blue-600">You (Live Preview)</span>
          </CardDescription>
          <p className="text-xs text-gray-500 mt-1">Total Votes: {totalPreviewVotes}</p>
        </CardHeader>

        <CardContent className="space-y-3">
          {validOptions.length > 0 ? (
            validOptions.map((option, index) => {
      
              const simulatedPercentage = validOptions.length > 0 ? ((1 / validOptions.length) * 100).toFixed(1) : 0;
              const simulatedVotes = Math.round(totalPreviewVotes / validOptions.length);

              return (
                <div key={index} className="mb-2">
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-base font-medium text-gray-800">{option}</span>
                    <span className="text-base font-semibold text-gray-700">{simulatedPercentage}% ({simulatedVotes} votes)</span>
                  </div>
                  <Progress value={simulatedPercentage} className="w-full h-2.5 rounded-full bg-gray-200" indicatorClassName="bg-blue-400" />
                </div>
              );
            })
          ) : (
            <p className="text-sm text-gray-500">Add some options to see them here.</p>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
}
