import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import {
  DocumentIcon,
  ArrowDownTrayIcon,
  EyeIcon,
  ClockIcon,
  CheckCircleIcon,
  XCircleIcon,
  TrashIcon,
  ChatBubbleLeftIcon,
  DocumentTextIcon,
  FolderIcon,
  GlobeAltIcon
} from '@heroicons/react/24/outline';

const Dashboard = () => {
  const [documents, setDocuments] = useState([]);
  const [uploadForm, setUploadForm] = useState({
    title: '',
    file: null,
    comment: '',
    accessLevel: 'private'
  });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const [loading, setLoading] = useState(false);

  const fetchDocuments = useCallback(async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const response = await axios.get('/api/documents/user', {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      setDocuments(response.data);
      setError('');
    } catch (err) {
      console.error('Error fetching documents:', err);
      setError('Failed to fetch documents. Please try again.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchDocuments();
    const interval = setInterval(fetchDocuments, 30000); // Poll every 30 seconds
    return () => clearInterval(interval);
  }, [fetchDocuments]);

  const handleView = async (id, title, filePath) => {
    try {
      const token = localStorage.getItem('token');
      const fileExt = filePath.split('.').pop().toLowerCase();
      
      if (['pdf', 'jpg', 'jpeg', 'png', 'gif'].includes(fileExt)) {
        window.open(`/api/documents/view/${id}?token=${token}`, '_blank');
      } else {
        const response = await axios.get(`/api/documents/download/${id}`, {
          headers: { Authorization: `Bearer ${token}` },
          responseType: 'blob'
        });
        
        const url = window.URL.createObjectURL(new Blob([response.data]));
        const link = document.createElement('a');
        link.href = url;
        link.setAttribute('download', title || filePath.split('/').pop());
        document.body.appendChild(link);
        link.click();
        link.remove();
        window.URL.revokeObjectURL(url);
      }
    } catch (err) {
      console.error('Error viewing document:', err);
      setError('Failed to view document. Please try again.');
    }
  };

  const handleDownload = async (id, title, filePath) => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const response = await axios.get(`/api/documents/download/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
        responseType: 'blob'
      });
      
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', title || filePath.split('/').pop());
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
      setError('');
    } catch (err) {
      console.error('Error downloading document:', err);
      setError('Failed to download document. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    const formData = new FormData();
    formData.append('title', uploadForm.title);
    formData.append('file', uploadForm.file);
    formData.append('comment', uploadForm.comment);
    formData.append('accessLevel', uploadForm.accessLevel);

    try {
      await axios.post('/api/documents/upload', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
          Authorization: `Bearer ${localStorage.getItem('token')}`
        }
      });
      setSuccess('Document uploaded successfully. Waiting for admin approval.');
      setUploadForm({ title: '', file: null, comment: '', accessLevel: 'private' });
      setError('');
      fetchDocuments();
    } catch (err) {
      console.error('Error uploading document:', err);
      setError(err.response?.data?.message || 'Upload failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id, title) => {
    if (deleteConfirm === id) {
      try {
        setLoading(true);
        const token = localStorage.getItem('token');
        await axios.delete(`/api/documents/${id}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        setSuccess(`Document "${title}" has been deleted successfully.`);
        setError('');
        setDocuments(prevDocs => prevDocs.filter(doc => doc._id !== id));
        setDeleteConfirm(null);
      } catch (err) {
        console.error('Error deleting document:', err);
        setError(err.response?.data?.message || 'Failed to delete document. Please try again.');
        setDeleteConfirm(null);
      } finally {
        setLoading(false);
      }
    } else {
      setError('');
      setSuccess('');
      setDeleteConfirm(id);
      setTimeout(() => setDeleteConfirm(null), 3000);
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'approved':
        return <CheckCircleIcon className="h-5 w-5 text-green-500" />;
      case 'rejected':
        return <XCircleIcon className="h-5 w-5 text-red-500" />;
      default:
        return <ClockIcon className="h-5 w-5 text-yellow-500" />;
    }
  };

  const getStatusText = (status) => {
    switch (status) {
      case 'approved':
        return 'Approved';
      case 'rejected':
        return 'Rejected';
      default:
        return 'Pending';
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 py-6 px-4 sm:px-6 lg:px-8 transition-colors duration-300">
      <div className="max-w-7xl mx-auto space-y-8">
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 transform hover:scale-[1.01] transition-all duration-300">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-3xl font-bold text-gray-900 dark:text-white bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
                Upload New Document
              </h2>
              <p className="mt-2 text-sm text-gray-600 dark:text-gray-300">
                Upload and manage your documents securely
              </p>
            </div>
            <div className="p-3 bg-indigo-50 dark:bg-indigo-900/30 rounded-full">
              <FolderIcon className="h-8 w-8 text-indigo-600 dark:text-indigo-400" />
            </div>
          </div>
          {error && (
            <div className="mb-4 bg-red-50 dark:bg-red-900/30 border-l-4 border-red-500 p-4 rounded-r-lg">
              <p className="text-red-800 dark:text-red-200">{error}</p>
            </div>
          )}
          {success && (
            <div className="mb-4 bg-green-50 dark:bg-green-900/30 border-l-4 border-green-500 p-4 rounded-r-lg">
              <p className="text-green-800 dark:text-green-200">{success}</p>
            </div>
          )}
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-sm font-semibold text-gray-900 dark:text-gray-100 mb-2">
                Document Title
                <span className="ml-2 text-xs text-gray-500 dark:text-gray-400 font-normal">
                  (Optional - filename will be used if left blank)
                </span>
              </label>
              <input
                type="text"
                value={uploadForm.title}
                onChange={(e) => setUploadForm({ ...uploadForm, title: e.target.value })}
                className="block w-full border border-gray-300 dark:border-gray-600 rounded-lg shadow-sm py-3 px-4 text-gray-900 dark:text-white bg-white dark:bg-gray-700 focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                placeholder="Enter document title"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-900 dark:text-gray-100 mb-2">
                Access Level
              </label>
              <select
                value={uploadForm.accessLevel}
                onChange={(e) => setUploadForm({ ...uploadForm, accessLevel: e.target.value })}
                className="block w-full border border-gray-300 dark:border-gray-600 rounded-lg shadow-sm py-3 px-4 text-gray-900 dark:text-white bg-white dark:bg-gray-700 focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              >
                <option value="private">Private</option>
                <option value="public">Public</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-900 dark:text-gray-100 mb-2">
                Comment
                <span className="ml-2 text-xs text-gray-500 dark:text-gray-400 font-normal">
                  (Optional)
                </span>
              </label>
              <textarea
                value={uploadForm.comment}
                onChange={(e) => setUploadForm({ ...uploadForm, comment: e.target.value })}
                className="block w-full border border-gray-300 dark:border-gray-600 rounded-lg shadow-sm py-3 px-4 text-gray-900 dark:text-white bg-white dark:bg-gray-700 focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                placeholder="Add a comment about this document"
                rows="3"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-900 dark:text-gray-100 mb-2">
                File
              </label>
              <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-gray-300 dark:border-gray-600 border-dashed rounded-lg hover:border-indigo-500">
                <div className="space-y-1 text-center">
                  <DocumentIcon className="mx-auto h-12 w-12 text-gray-400" />
                  <div className="flex text-sm text-gray-600 dark:text-gray-300">
                    <label htmlFor="file-upload" className="relative cursor-pointer rounded-md font-medium text-indigo-600 dark:text-indigo-400 hover:text-indigo-500">
                      <span>Upload a file</span>
                      <input
                        id="file-upload"
                        type="file"
                        required
                        onChange={(e) => setUploadForm({ ...uploadForm, file: e.target.files[0] })}
                        className="sr-only"
                      />
                    </label>
                    <p className="pl-1">or drag and drop</p>
                  </div>
                  <p className="text-xs text-gray-500">
                    PDF, DOC, DOCX, or image files up to 10MB
                  </p>
                </div>
              </div>
            </div>
            <button
              type="submit"
              disabled={loading}
              className={`w-full flex justify-center py-3 px-4 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 ${loading ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              {loading ? 'Uploading...' : 'Upload Document'}
            </button>
          </form>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-3xl font-bold text-gray-900 dark:text-white bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
                My Documents
              </h2>
              <p className="mt-2 text-sm text-gray-600 dark:text-gray-300">
                Manage and track your uploaded documents
              </p>
            </div>
            <div className="p-3 bg-indigo-50 dark:bg-indigo-900/30 rounded-full">
              <DocumentTextIcon className="h-8 w-8 text-indigo-600 dark:text-indigo-400" />
            </div>
          </div>

          {loading && (
            <div className="text-center py-4">
              <p className="text-gray-600 dark:text-gray-300">Loading documents...</p>
            </div>
          )}

          {!loading && documents.length === 0 && (
            <div className="text-center py-4">
              <p className="text-gray-600 dark:text-gray-300">No documents found. Upload your first document above!</p>
            </div>
          )}

          {!loading && documents.length > 0 && (
            <div className="mt-4 overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                <thead>
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Title</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Status</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Access Level</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                  {documents.map((doc) => (
                    <tr key={doc._id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <DocumentIcon className="h-5 w-5 text-gray-400 mr-2" />
                          <span className="text-sm text-gray-900 dark:text-white">{doc.title || doc.fileName}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          {getStatusIcon(doc.status)}
                          <span className="ml-2 text-sm text-gray-900 dark:text-white">
                            {getStatusText(doc.status)}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          {doc.accessLevel === 'public' ? (
                            <GlobeAltIcon className="h-5 w-5 text-green-500 mr-2" />
                          ) : (
                            <DocumentIcon className="h-5 w-5 text-gray-400 mr-2" />
                          )}
                          <span className="text-sm text-gray-900 dark:text-white capitalize">
                            {doc.accessLevel}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        <div className="flex space-x-3">
                          {doc.status === 'approved' && (
                            <>
                              <button
                                onClick={() => handleView(doc._id, doc.title, doc.fileName)}
                                className="text-indigo-600 dark:text-indigo-400 hover:text-indigo-900 dark:hover:text-indigo-300"
                                title="View Document"
                              >
                                <EyeIcon className="h-5 w-5" />
                              </button>
                              <button
                                onClick={() => handleDownload(doc._id, doc.title, doc.fileName)}
                                className="text-indigo-600 dark:text-indigo-400 hover:text-indigo-900 dark:hover:text-indigo-300"
                                title="Download Document"
                              >
                                <ArrowDownTrayIcon className="h-5 w-5" />
                              </button>
                            </>
                          )}
                          {doc.comment && (
                            <div className="relative group">
                              <ChatBubbleLeftIcon 
                                className="h-5 w-5 text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-300"
                                title="View Comment"
                              />
                              <div className="absolute z-10 w-48 px-2 py-1 -mt-1 text-sm text-gray-500 transform -translate-x-1/2 bg-white border border-gray-200 rounded-lg shadow-lg opacity-0 group-hover:opacity-100 dark:bg-gray-700 dark:border-gray-600 dark:text-gray-300">
                                {doc.comment}
                              </div>
                            </div>
                          )}
                          <button
                            onClick={() => handleDelete(doc._id, doc.title || doc.fileName)}
                            className={`${
                              deleteConfirm === doc._id
                                ? 'text-red-600 dark:text-red-400'
                                : 'text-gray-400 dark:text-gray-500'
                            } hover:text-red-900 dark:hover:text-red-300`}
                            title={deleteConfirm === doc._id ? 'Click again to confirm deletion' : 'Delete Document'}
                          >
                            <TrashIcon className="h-5 w-5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Dashboard; 