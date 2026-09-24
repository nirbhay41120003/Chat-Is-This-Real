import { useState } from 'react';
import { extractNoteFile } from '../lib/importNotes.js';

export default function PromptInput({ onGenerate, loading, initialValue = '' }) {
  const [input, setInput] = useState(initialValue);
  const [fileMessage, setFileMessage] = useState('');
  async function importFile(file) {
    if (!file) return;
    try {
      const imported = await extractNoteFile(file);
      setInput(imported.text);
      setFileMessage(imported.truncated ? 'Imported and trimmed to 12,000 characters.' : `Imported ${file.name}`);
    } catch (error) {
      setFileMessage(error.message || 'Could not read that file. Check that it is a valid note file.');
    }
  }
  return <form className="prompt-form" onSubmit={(event) => { event.preventDefault(); onGenerate(input); }}>
    <label htmlFor="study-input">Your notes or topic</label>
    <label className="file-import">Import notes <input type="file" accept=".pdf,.txt,.md,.markdown,text/plain,text/markdown,application/pdf" disabled={loading} onChange={(event) => importFile(event.target.files?.[0])} /></label>
    {fileMessage && <p className="file-message" role="status">{fileMessage}</p>}
    <textarea id="study-input" value={input} onChange={(event) => setInput(event.target.value)}
      placeholder="Paste your notes here, or enter a topic you want to learn…" rows="5" maxLength="12000" />
    <div className="prompt-footer"><span>{input.length.toLocaleString()} / 12,000</span>
      <button className="button button-primary" type="submit" disabled={loading || !input.trim()}>
        {loading ? 'Building your deck…' : 'Create study set'} <span aria-hidden="true">↗</span>
      </button>
    </div>
  </form>;
}
