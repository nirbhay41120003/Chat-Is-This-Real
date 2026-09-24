import { validateResult } from './validateResult.js';

export async function generateStudySet(input, onProgress = () => {}, result = null, refinement = '') {
  let response;
  try {
    response = await fetch(result ? '/api/refine' : '/api/generate', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(result ? { result: { topic: result.topic, blocks: result.blocks }, refinement } : { input }),
    });
  } catch {
    const error = new Error('network_error'); error.kind = 'network'; throw error;
  }
  if (!response.ok) {
    let body = {};
    try { body = await response.json(); } catch { /* use generic error */ }
    const error = new Error(body?.error || 'request_failed');
    error.kind = body?.error === 'timeout' ? 'timeout' : body?.error === 'invalid_json' ? 'malformed'
      : body?.error === 'empty_response' ? 'empty' : body?.error === 'invalid_shape' ? 'shape' : 'http';
    throw error;
  }
  if (!response.body) { const error = new Error('network_error'); error.kind = 'network'; throw error; }
  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let buffer = '';
  let completed = null;
  let streamError = null;
  let streamedText = '';
  let previewBlocks = [];
  while (true) {
    const { value, done } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });
    const events = buffer.split('\n\n'); buffer = events.pop() || '';
    for (const event of events) {
      const type = event.match(/^event: (.+)$/m)?.[1];
      const dataLine = event.match(/^data: (.+)$/m)?.[1];
      if (!dataLine) continue;
      let data;
      try { data = JSON.parse(dataLine); } catch { continue; }
      if (type === 'delta') {
        streamedText += data.text;
        const marker = streamedText.indexOf('"blocks"');
        const start = marker < 0 ? -1 : streamedText.indexOf('[', marker);
        if (start >= 0) {
          let depth = 0; let inString = false; let escaped = false; let objectStart = -1;
          for (let i = start + 1; i < streamedText.length; i += 1) {
            const char = streamedText[i];
            if (inString) { if (escaped) escaped = false; else if (char === '\\') escaped = true; else if (char === '"') inString = false; continue; }
            if (char === '"') { inString = true; continue; }
            if (char === '{') { if (depth === 0) objectStart = i; depth += 1; }
            if (char === '}') {
              depth -= 1;
              if (depth === 0 && objectStart >= 0) {
                try { const block = JSON.parse(streamedText.slice(objectStart, i + 1)); if (!previewBlocks.some((item) => item.id === block.id)) previewBlocks = [...previewBlocks, block]; } catch { /* wait for a complete block */ }
                objectStart = -1;
              }
            }
          }
        }
        onProgress(data.text, previewBlocks);
      }
      if (type === 'complete') completed = data;
      if (type === 'error') streamError = data.error;
    }
  }
  if (streamError) {
    const error = new Error(streamError);
    error.kind = streamError === 'timeout' ? 'timeout' : streamError === 'invalid_json' ? 'malformed'
      : streamError === 'empty_response' ? 'empty' : streamError === 'invalid_shape' ? 'shape' : 'http';
    throw error;
  }
  const valid = validateResult(completed);
  if (!valid) { const error = new Error('invalid_shape'); error.kind = 'shape'; throw error; }
  return valid;
}
