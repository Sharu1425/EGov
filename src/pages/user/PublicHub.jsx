import React, { useState, useEffect } from 'react';
import axios from 'axios';
import {
  DocumentIcon,
  ArrowDownTrayIcon,
  EyeIcon,
  CheckCircleIcon,
  GlobeAltIcon
} from '@heroicons/react/24/outline';

const PublicHub = () => {
  const [documents, setDocuments] = useState([]);
  const [error, setError] = useState('');

  const fetchPublicDocuments = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get('/api/documents/public', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setDocuments(response.data);
    } catch (err) {
      console.error('Error fetching public documents:', err);
      setError('Failed to fetch public documents');
    }
  };

  useEffect(() => {
    fetchPublicDocuments();
    const interval = setInterval(fetchPublicDocuments, 30000);
    return () => clearInterval(interval);
  }, []);

  const handleView = async (id, filePath) => {
    try {
      const token = localStorage.getItem('token');
      const fileExt = filePath.split('.').pop().toLowerCase();
      
      // For PDFs and images, open in new tab with direct URL
      if (['pdf', 'jpg', 'jpeg', 'png', 'gif'].includes(fileExt)) {
        window.open(`/api/documents/view/${id}?token=${token}`, '_blank');
      } else {
        // For other file types, download them
        const response = await axios.get(`/api/documents/download/${id}`, {
          headers: { Authorization: `Bearer ${token}` },
          responseType: 'blob'
        });
        
        const url = window.URL.createObjectURL(new Blob([response.data]));
        const link = document.createElement('a');
        link.href = url;
        link.setAttribute('download', filePath.split('/').pop());
        document.body.appendChild(link);
        link.click();
        link.remove();
      }
    } catch (err) {
      console.error('Error viewing document:', err);
      setError('Failed to view document');
    }
  };

  const handleDownload = async (id, title, fileType) => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`/api/documents/download/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
        responseType: 'blob'
      });
      
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `${title}${fileType}`);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (err) {
      console.error('Error downloading document:', err);
      setError('Failed to download document');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 py-6 px-4 sm:px-6 lg:px-8 transition-colors duration-300">
      <div className="max-w-7xl mx-auto">
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 transform hover:scale-[1.01] transition-all duration-300">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h2 className="text-3xl font-bold text-gray-900 dark:text-white bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
                Public Documents Hub
              </h2>
              <p className="mt-2 text-sm text-gray-600 dark:text-gray-300">
                Browse and access approved public documents from our community.
              </p>
            </div>
            <div className="p-3 bg-indigo-50 dark:bg-indigo-900/30 rounded-full">
              <GlobeAltIcon className="h-8 w-8 text-indigo-600 dark:text-indigo-400" />
            </div>
          </div>

          {error && (
            <div className="mb-6 bg-red-50 dark:bg-red-900/30 border-l-4 border-red-500 p-4 rounded-r-lg transform -translate-x-2 transition-transform duration-300">
              <p className="text-red-800 dark:text-red-200">{error}</p>
            </div>
          )}

          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
              <thead>
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider bg-gray-50 dark:bg-gray-700/50">
                    Title
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider bg-gray-50 dark:bg-gray-700/50">
                    Uploaded By
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider bg-gray-50 dark:bg-gray-700/50">
                    Upload Date
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider bg-gray-50 dark:bg-gray-700/50">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                {documents.map((doc) => (
                  <tr key={doc._id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors duration-200">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <DocumentIcon className="h-5 w-5 text-gray-400 dark:text-gray-500 mr-2" />
                        <div className="text-sm font-medium text-gray-900 dark:text-white">
                          {doc.title}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <span className="text-sm text-gray-700 dark:text-gray-300">
                          {doc.owner?.firstName} {doc.owner?.lastName}
                        </span>
                        <CheckCircleIcon className="ml-1.5 h-4 w-4 text-green-500 dark:text-green-400" />
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700 dark:text-gray-300">
                      {new Date(doc.uploadDate).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      <div className="flex space-x-3">
                        <button
                          onClick={() => handleView(doc._id, doc.filePath)}
                          className="text-indigo-600 dark:text-indigo-400 hover:text-indigo-900 dark:hover:text-indigo-300 transform hover:scale-110 transition-all duration-300"
                          title="View Document"
                        >
                          <EyeIcon className="h-5 w-5" />
                        </button>
                        <button
                          onClick={() => handleDownload(doc._id, doc.title, doc.fileType)}
                          className="text-indigo-600 dark:text-indigo-400 hover:text-indigo-900 dark:hover:text-indigo-300 transform hover:scale-110 transition-all duration-300"
                          title="Download Document"
                        >
                          <ArrowDownTrayIcon className="h-5 w-5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PublicHub; 