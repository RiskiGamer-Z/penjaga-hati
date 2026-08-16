'use client';

import { useEffect, useState } from 'react';
import { applySeedData } from './actions';

export default function SeedPage() {
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [message, setMessage] = useState('Applying test data...');

  useEffect(() => {
    const applyData = async () => {
      try {
        const result = await applySeedData();
        if (result.success) {
          setStatus('success');
          setMessage(result.message || 'Data setup applied successfully');
        } else {
          setStatus('error');
          setMessage(result.error || 'Failed to apply data');
        }
      } catch (error: any) {
        setStatus('error');
        setMessage(error.message || 'Error occurred');
      }
    };

    applyData();
  }, []);

  return (
    <div className="flex flex-col flex-1 overflow-hidden gap-6 p-8">
      <div className="flex flex-col gap-4">
        <div>
          <h1 className="font-bold text-brand-navy text-2xl">Test Data Setup</h1>
          <p className="text-gray-600 text-sm mt-2">Applying test data automatically...</p>
        </div>

        <div className={`p-4 rounded-lg border ${
          status === 'loading' ? 'bg-blue-50 border-blue-200' :
          status === 'success' ? 'bg-emerald-50 border-emerald-200' :
          'bg-red-50 border-red-200'
        }`}>
          <h3 className={`font-semibold mb-2 ${
            status === 'loading' ? 'text-blue-900' :
            status === 'success' ? 'text-emerald-900' :
            'text-red-900'
          }`}>
            {status === 'loading' ? '⏳ Processing...' :
             status === 'success' ? '✓ Success' :
             '✗ Error'}
          </h3>
          <p className={
            status === 'loading' ? 'text-blue-800' :
            status === 'success' ? 'text-emerald-800' :
            'text-red-800'
          }>
            {message}
          </p>
        </div>
      </div>
    </div>
  );
}
