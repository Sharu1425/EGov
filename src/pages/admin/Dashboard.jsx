import React, { useState, useEffect } from 'react';
import axios from 'axios';
import {
  DocumentIcon,
  CheckIcon,
  XMarkIcon,
  GlobeAltIcon,
  LockClosedIcon,
  UserGroupIcon,
  ArrowDownTrayIcon,
  EyeIcon
} from '@heroicons/react/24/outline';

const AdminDashboard = () => {
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const fetchDocuments = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const response = await axios.get('/api/documents/admin', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setDocuments(response.data);
    } catch (err) {
      console.error('Error fetching documents:', err);
      setError('Failed to fetch documents');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDocuments();
    const interval = setInterval(fetchDocuments, 30000);
    return () => clearInterval(interval);
  }, []);

  const handleApproval = async (id, approved) => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.post(`/api/documents/${id}/approve`, 
        { approved },
        { headers: { Authorization: `Bearer ${token}` }}
      );
      setSuccess(`Document ${approved ? 'approved' : 'rejected'} successfully`);
      
      // Update the document in the local state
      setDocuments(documents.map(doc => 
        doc._id === id ? response.data : doc
      ));
      
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      console.error('Error updating approval status:', err);
      setError('Failed to update document status');
    }
  };

  const handleAccessLevel = async (id, accessLevel) => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.post(`/api/documents/${id}/access`,
        { accessLevel },
        { headers: { Authorization: `Bearer ${token}` }}
      );
      setSuccess('Access level updated successfully');
      
      // Update the document in the local state
      setDocuments(documents.map(doc => 
        doc._id === id ? response.data : doc
      ));
      
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      console.error('Error updating access level:', err);
      setError('Failed to update access level');
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

  const handleView = async (id, filePath) => {
    try {
      const token = localStorage.getItem('token');
      const fileExt = filePath.split('.').pop().toLowerCase();
      
      // For PDFs and images, open in new tab with direct URL
      if (['pdf', 'jpg', 'jpeg', 'png', 'gif'].includes(fileExt)) {
        const viewUrl = `/api/documents/view/${id}`;
        // Create a temporary link and click it
        const link = document.createElement('a');
        link.href = viewUrl;
        link.target = '_blank';
        // Add authorization header through meta tag
        const meta = document.createElement('meta');
        meta.httpEquiv = 'Authorization';
        meta.content = `Bearer ${token}`;
        document.head.appendChild(meta);
        document.body.appendChild(link);
        link.click();
        // Clean up
        document.body.removeChild(link);
        setTimeout(() => document.head.removeChild(meta), 100);
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

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white shadow-sm rounded-lg p-6">
        <h1 className="text-2xl font-bold text-gray-900">Admin Dashboard</h1>
        <p className="mt-1 text-gray-500">Manage and approve user documents.</p>
      </div>

      {/* Status Messages */}
      {error && (
        <div className="bg-red-50 border-l-4 border-red-400 p-4 rounded-md">
          <div className="flex">
            <XMarkIcon className="h-5 w-5 text-red-400" />
            <p className="ml-3 text-sm text-red-700">{error}</p>
          </div>
        </div>
      )}
      {success && (
        <div className="bg-green-50 border-l-4 border-green-400 p-4 rounded-md">
          <div className="flex">
            <CheckIcon className="h-5 w-5 text-green-400" />
            <p className="ml-3 text-sm text-green-700">{success}</p>
          </div>
        </div>
      )}

      {/* Documents List */}
      <div className="bg-white shadow-sm rounded-lg overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-medium text-gray-900">All Documents</h2>
        </div>
        <div className="divide-y divide-gray-200">
          {loading ? (
            <div className="p-6 text-center text-gray-500">Loading documents...</div>
          ) : documents && documents.length === 0 ? (
            <div className="p-6 text-center text-gray-500">No documents found</div>
          ) : (
            documents.map((doc) => (
              <div key={doc._id} className="px-6 py-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <DocumentIcon className="h-8 w-8 text-gray-400" />
                    <div className="ml-4">
                      <h3 className="text-sm font-medium text-gray-900">{doc.title}</h3>
                      <p className="text-sm text-gray-500">
                        Uploaded by {doc.owner?.firstName} {doc.owner?.lastName} on{' '}
                        {new Date(doc.uploadDate).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-4">
                    {/* Document Actions */}
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => handleView(doc._id, doc.filePath)}
                        className="text-indigo-600 hover:text-indigo-900"
                        title="View Document"
                      >
                        <EyeIcon className="h-5 w-5" />
                      </button>
                      <button
                        onClick={() => handleDownload(doc._id, doc.title, doc.fileType)}
                        className="text-indigo-600 hover:text-indigo-900"
                        title="Download Document"
                      >
                        <ArrowDownTrayIcon className="h-5 w-5" />
                      </button>
                    </div>

                    {/* Approval Actions */}
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => handleApproval(doc._id, true)}
                        className={`inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded-md ${
                          doc.approved
                            ? 'bg-green-100 text-green-800'
                            : 'text-white bg-green-600 hover:bg-green-700'
                        }`}
                        disabled={doc.approved}
                      >
                        <CheckIcon className="h-4 w-4 mr-1" />
                        {doc.approved ? 'Approved' : 'Approve'}
                      </button>
                      <button
                        onClick={() => handleApproval(doc._id, false)}
                        className={`inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded-md ${
                          !doc.approved
                            ? 'bg-red-100 text-red-800'
                            : 'text-white bg-red-600 hover:bg-red-700'
                        }`}
                        disabled={!doc.approved}
                      >
                        <XMarkIcon className="h-4 w-4 mr-1" />
                        {!doc.approved ? 'Rejected' : 'Reject'}
                      </button>
                    </div>

                    {/* Access Level Controls */}
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => handleAccessLevel(doc._id, 'public')}
                        className={`inline-flex items-center px-2 py-1 text-xs font-medium rounded-md ${
                          doc.accessLevel === 'public'
                            ? 'bg-blue-100 text-blue-800'
                            : 'bg-gray-100 text-gray-800 hover:bg-gray-200'
                        }`}
                      >
                        <GlobeAltIcon className="h-4 w-4 mr-1" />
                        Public
                      </button>
                      <button
                        onClick={() => handleAccessLevel(doc._id, 'private')}
                        className={`inline-flex items-center px-2 py-1 text-xs font-medium rounded-md ${
                          doc.accessLevel === 'private'
                            ? 'bg-gray-100 text-gray-800'
                            : 'bg-gray-100 text-gray-800 hover:bg-gray-200'
                        }`}
                      >
                        <LockClosedIcon className="h-4 w-4 mr-1" />
                        Private
                      </button>
                      <button
                        onClick={() => handleAccessLevel(doc._id, 'restricted')}
                        className={`inline-flex items-center px-2 py-1 text-xs font-medium rounded-md ${
                          doc.accessLevel === 'restricted'
                            ? 'bg-purple-100 text-purple-800'
                            : 'bg-gray-100 text-gray-800 hover:bg-gray-200'
                        }`}
                      >
                        <UserGroupIcon className="h-4 w-4 mr-1" />
                        Restricted
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard; 