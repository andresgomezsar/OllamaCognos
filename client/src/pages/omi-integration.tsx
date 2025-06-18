import React, { useState, useEffect } from 'react';
import axios from 'axios';
import OmiImporter from '../components/OmiImporter';

const OmiIntegration: React.FC = () => {
  const [webhookStatus, setWebhookStatus] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Fetch webhook status when component mounts
    const fetchStatus = async () => {
      try {
        setLoading(true);
        const response = await axios.get('/api/omi/webhook/status');
        setWebhookStatus(response.data);
        setError(null);
      } catch (err) {
        console.error('Failed to fetch Omi webhook status:', err);
        setError('Failed to connect to Omi webhook service');
      } finally {
        setLoading(false);
      }
    };

    fetchStatus();
  }, []);

  const handleImportComplete = (result: any) => {
    console.log('Import completed with result:', result);
    // You could refresh some data here if needed
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-6">Omi Necklace Integration</h1>
      
      <div className="mb-10">
        <h2 className="text-2xl font-semibold mb-4">Webhook Configuration</h2>
        <p className="mb-4">
          Configure your Omi necklace app to send data to the following webhook endpoints:
        </p>
        
        {loading ? (
          <div className="animate-pulse bg-gray-100 h-32 rounded-md"></div>
        ) : error ? (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md">
            {error}
          </div>
        ) : (
          <div className="bg-gray-50 border rounded-md overflow-hidden">
            <table className="min-w-full">
              <thead className="bg-gray-100">
                <tr>
                  <th className="py-3 px-4 text-left font-medium">Feature</th>
                  <th className="py-3 px-4 text-left font-medium">Endpoint URL</th>
                  <th className="py-3 px-4 text-left font-medium">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {webhookStatus && webhookStatus.endpoints && Object.entries(webhookStatus.endpoints).map(([key, url]: [string, any]) => (
                  <tr key={key} className="hover:bg-gray-50">
                    <td className="py-3 px-4 font-medium">{key.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}</td>
                    <td className="py-3 px-4 font-mono text-sm">
                      {window.location.origin}{url}
                    </td>
                    <td className="py-3 px-4">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                        Active
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        
        <div className="mt-4 text-sm text-gray-600">
          <p>Add these endpoints to your Omi necklace app to start receiving data.</p>
        </div>
      </div>
      
      <div className="mb-10">
        <h2 className="text-2xl font-semibold mb-4">Import Existing Conversations</h2>
        <p className="mb-6">
          If you already have Omi conversations exported, you can import them here. 
          The system will process and integrate them with your existing data.
        </p>
        
        <div className="bg-white border rounded-lg p-6">
          <OmiImporter 
            onImportComplete={handleImportComplete}
            className="mx-auto"
          />
        </div>
      </div>
      
      <div className="bg-blue-50 border border-blue-200 rounded-md p-4 mb-8">
        <h3 className="text-lg font-medium text-blue-800 mb-2">How to Export Conversations from Omi</h3>
        <ol className="list-decimal pl-5 space-y-2 text-blue-700">
          <li>Open the Omi necklace app on your device</li>
          <li>Navigate to Settings &gt; Data &amp; Privacy</li>
          <li>Select "Export Conversations" option</li>
          <li>Choose export format: JSON</li>
          <li>Save the file to your device</li>
          <li>Upload the saved file using the importer above</li>
        </ol>
      </div>
      
      <div>
        <h2 className="text-2xl font-semibold mb-4">Connection Status</h2>
        {loading ? (
          <div className="animate-pulse bg-gray-100 h-16 rounded-md"></div>
        ) : webhookStatus ? (
          <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-md">
            <p className="font-medium">Webhook Server: {webhookStatus.status}</p>
            <p className="text-sm mt-1">Last updated: {webhookStatus.last_updated}</p>
          </div>
        ) : (
          <div className="bg-yellow-50 border border-yellow-200 text-yellow-700 px-4 py-3 rounded-md">
            No status information available
          </div>
        )}
      </div>
    </div>
  );
};

export default OmiIntegration;
