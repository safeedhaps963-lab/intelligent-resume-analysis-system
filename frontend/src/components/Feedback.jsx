import React, { useState } from 'react';
import toast from 'react-hot-toast';

const Feedback = () => {
  const [type, setType] = useState('feedback');
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [isSending, setIsSending] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSending(true);

    const payload = { type, subject, message };
    const token = localStorage.getItem('authToken') || localStorage.getItem('token');

    try {
      const res = await fetch('/api/feedback', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token && { 'Authorization': `Bearer ${token}` })
        },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (res.ok) {
        toast.success(data.message || 'Thanks — your message was sent.');
        setSubject('');
        setMessage('');
        setType('feedback');
      } else {
        toast.error(data.error || 'Failed to send feedback');
      }
    } catch (err) {
      console.error('Feedback submit error:', err);
      toast.error('Network error. Please try again later.');
    } finally {
      setIsSending(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto bg-white p-6 rounded-lg shadow">
      <h2 className="text-2xl font-semibold mb-4">Feedback & Complaints</h2>

      <p className="text-sm text-gray-600 mb-4">Send us feedback or report an issue. We read every message.</p>

      <form onSubmit={handleSubmit}>
        <div className="mb-3">
          <label className="block text-sm font-medium mb-1">Type</label>
          <select
            value={type}
            onChange={(e) => setType(e.target.value)}
            className="w-full px-3 py-2 border rounded"
          >
            <option value="feedback">Feedback</option>
            <option value="complaint">Complaint</option>
            <option value="bug">Bug Report</option>
          </select>
        </div>

        <div className="mb-3">
          <label className="block text-sm font-medium mb-1">Subject</label>
          <input
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
            required
            className="w-full px-3 py-2 border rounded"
            placeholder="Short summary"
          />
        </div>

        <div className="mb-3">
          <label className="block text-sm font-medium mb-1">Message</label>
          <textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            required
            rows={6}
            className="w-full px-3 py-2 border rounded"
            placeholder="Tell us what's on your mind"
          />
        </div>

        <div className="flex items-center justify-end">
          <button
            type="submit"
            disabled={isSending}
            className={`px-4 py-2 rounded text-white ${isSending ? 'bg-gray-400' : 'bg-purple-600 hover:bg-purple-700'}`}>
            {isSending ? 'Sending...' : 'Send Message'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default Feedback;
