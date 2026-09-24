// Vercel detects this root entry point and runs the Express app as a Function.
// Keep Express imported here: Vercel's framework detector scans this entry file
// and does not follow the re-export into server/index.js when identifying it.
import express from 'express';
import app from './server/index.js';

void express;
export default app;
