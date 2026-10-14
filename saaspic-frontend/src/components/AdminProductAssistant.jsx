"use client";
import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { API_URL } from '@/lib/api';
import { mergeProductSuggestions, suggestionFields, suggestionLabels, slugFromName, fieldsToReplace } from '@/lib/productAISuggestions';
import './AdminProductAssistant.css';

export default function AdminProductAssistant({ formData, setFormData, categories, disabled, mode = 'add' }) {
  const router = useRouter();
  const currentForm = useRef(formData);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  useEffect(() => { currentForm.current = formData; }, [formData]);

  async function generate() {
    setError(''); setMessage('');
    const identity = { name: formData.name.trim(), website: formData.website.trim() };
    if (!identity.name || !identity.website) { setError('Enter the product name and official website in Basic Information first.'); return; }
    const token = localStorage.getItem('adminToken');
    if (!token) { router.push('/login'); return; }
    try {
      setLoading(true);
      const response = await fetch(`${API_URL}/products/ai/generate`, {
        method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` }, body: JSON.stringify(identity),
      });
      if (response.status === 401 || response.status === 403) { setError('Your admin session has expired. Sign in again.'); router.push('/login'); return; }
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || 'Could not generate suggestions.');
      if (currentForm.current.name.trim() !== identity.name || currentForm.current.website.trim() !== identity.website) throw new Error('The product name or website changed. Generate fresh suggestions for the current product.');
      const fields = suggestionFields(data.suggestions || {}, categories);
      if (!Object.keys(fields).length) throw new Error('No usable suggestions were returned. Enter the information manually or try again.');
      fields.name ||= identity.name;
      fields.slug ||= slugFromName(fields.name);
      const existing = fieldsToReplace(currentForm.current, fields);
      if (mode === 'edit' && existing.length && !window.confirm(`Replace these existing fields with AI-generated values: ${existing.map(key => suggestionLabels[key]).join(', ')}? Your website, pricing, images, and affiliate settings will stay unchanged.`)) {
        setMessage('Autofill canceled. Your existing product values were preserved.');
        return;
      }
      const approvedForm = currentForm.current;
      setFormData(current => current === approvedForm ? mergeProductSuggestions(current, fields, true, identity) : current);
      setMessage('Product fields filled with AI-generated values. Review and edit them, then click Save. Nothing has been saved yet.');
    } catch (error) { setError(error.message || 'Could not generate suggestions.'); }
    finally { setLoading(false); }
  }
  return <section className="admin-ai-assistant-card" aria-label="Product AI assistant" aria-busy={loading}>
    <div className="admin-ai-assistant-header"><strong>Product AI Assistant</strong></div>
    <div className="admin-product-ai-body">
      <p>Enter a product name and official website above. AI will fill the product fields for you to review and edit before saving.</p>
      <button type="button" className="admin-ai-action-btn" onClick={generate} disabled={disabled || loading || !categories.length}>{loading ? 'Generating suggestions…' : 'Generate with AI'}</button>
      {error && <p className="admin-error" role="alert">{error}</p>}
      {message && <p className="admin-success" role="status">{message}</p>}
    </div>
  </section>;
}
