import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import DashboardLayout from '../../components/layout/DashboardLayout'
import { documentsService } from '../../services/documents.service'
import type { StudentDocument } from '../../services/documents.service'

export default function StudentDocuments() {
    const [documents, setDocuments] = useState<StudentDocument[]>([])
    const [loading, setLoading] = useState(true)
    const [uploading, setUploading] = useState(false)
    const [filter, setFilter] = useState<'all' | 'verified' | 'unverified'>('all')
    const [selectedFile, setSelectedFile] = useState<File | null>(null)
    const [uploadForm, setUploadForm] = useState({
        studentId: '',
        documentType: 'Transcript',
        documentName: ''
    })

    const documentTypes = [
        'Transcript',
        'Passport',
        'IELTS Certificate',
        'Recommendation Letter',
        'Personal Statement',
        'Financial Documents',
        'Other'
    ]

    useEffect(() => {
        fetchDocuments()
    }, [filter])

    const fetchDocuments = async () => {
        try {
            setLoading(true)
            const filters = filter === 'all' ? {} : { verified: filter === 'verified' }
            const data = await documentsService.getAllDocuments(filters)
            setDocuments(data)
        } catch (error) {
            console.error('Failed to fetch documents:', error)
            alert('Failed to load documents')
        } finally {
            setLoading(false)
        }
    }

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            setSelectedFile(e.target.files[0])
        }
    }

    const handleUpload = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!selectedFile || !uploadForm.studentId) {
            alert('Please select a file and enter student ID')
            return
        }

        try {
            setUploading(true)
            await documentsService.uploadDocument(
                parseInt(uploadForm.studentId),
                uploadForm.documentType,
                selectedFile,
                uploadForm.documentName || selectedFile.name
            )
            alert('Document uploaded successfully!')
            setSelectedFile(null)
            setUploadForm({ studentId: '', documentType: 'Transcript', documentName: '' })
            fetchDocuments()
        } catch (error: any) {
            alert(error.message || 'Failed to upload document')
        } finally {
            setUploading(false)
        }
    }

    const handleVerify = async (documentId: number, currentStatus: boolean) => {
        try {
            if (currentStatus) {
                await documentsService.unverifyDocument(documentId)
            } else {
                await documentsService.verifyDocument(documentId)
            }
            fetchDocuments()
        } catch (error: any) {
            alert(error.message || 'Failed to update document')
        }
    }

    const handleDelete = async (documentId: number) => {
        if (!confirm('Are you sure you want to delete this document?')) return

        try {
            await documentsService.deleteDocument(documentId)
            alert('Document deleted successfully')
            fetchDocuments()
        } catch (error: any) {
            alert(error.message || 'Failed to delete document')
        }
    }

    return (
        <DashboardLayout>
            <div className="space-y-6">
                <div className="flex justify-between items-center">
                    <h1 className="text-3xl font-bold text-white">Student Documents</h1>
                </div>

                {/* Upload Form */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-white/10 backdrop-blur-xl rounded-2xl p-6 border border-white/20"
                >
                    <h2 className="text-xl font-semibold text-white mb-4">Upload Document</h2>
                    <form onSubmit={handleUpload} className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-white/80 mb-2">
                                    Student ID *
                                </label>
                                <input
                                    type="number"
                                    value={uploadForm.studentId}
                                    onChange={(e) => setUploadForm({ ...uploadForm, studentId: e.target.value })}
                                    className="w-full px-4 py-2 bg-white/5 border border-white/20 rounded-lg text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-cyan-400"
                                    placeholder="Enter student ID"
                                    required
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-white/80 mb-2">
                                    Document Type *
                                </label>
                                <select
                                    value={uploadForm.documentType}
                                    onChange={(e) => setUploadForm({ ...uploadForm, documentType: e.target.value })}
                                    className="w-full px-4 py-2 bg-white/5 border border-white/20 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-cyan-400"
                                >
                                    {documentTypes.map((type) => (
                                        <option key={type} value={type} className="bg-gray-800">
                                            {type}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-white/80 mb-2">
                                    Document Name (Optional)
                                </label>
                                <input
                                    type="text"
                                    value={uploadForm.documentName}
                                    onChange={(e) => setUploadForm({ ...uploadForm, documentName: e.target.value })}
                                    className="w-full px-4 py-2 bg-white/5 border border-white/20 rounded-lg text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-cyan-400"
                                    placeholder="Custom name"
                                />
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-white/80 mb-2">
                                Select File * (PDF, JPG, PNG, DOC, DOCX - Max 10MB)
                            </label>
                            <input
                                type="file"
                                onChange={handleFileChange}
                                accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
                                className="w-full px-4 py-2 bg-white/5 border border-white/20 rounded-lg text-white file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:bg-cyan-500 file:text-white file:cursor-pointer hover:file:bg-cyan-600"
                                required
                            />
                            {selectedFile && (
                                <p className="mt-2 text-sm text-white/60">
                                    Selected: {selectedFile.name} ({(selectedFile.size / 1024 / 1024).toFixed(2)} MB)
                                </p>
                            )}
                        </div>

                        <button
                            type="submit"
                            disabled={uploading}
                            className="px-6 py-2 bg-cyan-500 hover:bg-cyan-600 text-white rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {uploading ? 'Uploading...' : 'Upload Document'}
                        </button>
                    </form>
                </motion.div>

                {/* Filter Tabs */}
                <div className="flex gap-2">
                    {(['all', 'verified', 'unverified'] as const).map((f) => (
                        <button
                            key={f}
                            onClick={() => setFilter(f)}
                            className={`px-4 py-2 rounded-lg font-medium transition-colors ${filter === f
                                ? 'bg-cyan-500 text-white'
                                : 'bg-white/10 text-white/60 hover:bg-white/20'
                                }`}
                        >
                            {f.charAt(0).toUpperCase() + f.slice(1)}
                        </button>
                    ))}
                </div>

                {/* Documents List */}
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="bg-white/10 backdrop-blur-xl rounded-2xl border border-white/20 overflow-hidden"
                >
                    {loading ? (
                        <div className="p-8 text-center text-white/60">Loading documents...</div>
                    ) : documents.length === 0 ? (
                        <div className="p-8 text-center text-white/60">No documents found</div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead className="bg-white/5">
                                    <tr>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-white/80 uppercase tracking-wider">
                                            Student
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-white/80 uppercase tracking-wider">
                                            Document
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-white/80 uppercase tracking-wider">
                                            Type
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-white/80 uppercase tracking-wider">
                                            Uploaded
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-white/80 uppercase tracking-wider">
                                            Status
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-white/80 uppercase tracking-wider">
                                            Actions
                                        </th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-white/10">
                                    {documents.map((doc) => (
                                        <tr key={doc.id} className="hover:bg-white/5 transition-colors">
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div className="text-sm text-white">{doc.student_name}</div>
                                                <div className="text-xs text-white/60">{doc.student_email}</div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <a
                                                    href={`http://localhost:4000${doc.file_url}`}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="text-cyan-400 hover:text-cyan-300 text-sm underline"
                                                >
                                                    {doc.document_name}
                                                </a>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-white/80">
                                                {doc.document_type}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-white/60">
                                                {new Date(doc.uploaded_at).toLocaleDateString()}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                {doc.verified ? (
                                                    <span className="px-2 py-1 text-xs font-medium bg-green-500/20 text-green-400 rounded-full">
                                                        ✓ Verified
                                                    </span>
                                                ) : (
                                                    <span className="px-2 py-1 text-xs font-medium bg-yellow-500/20 text-yellow-400 rounded-full">
                                                        ⏳ Pending
                                                    </span>
                                                )}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm space-x-2">
                                                <button
                                                    onClick={() => handleVerify(doc.id, doc.verified)}
                                                    className={`px-3 py-1 rounded-lg font-medium transition-colors ${doc.verified
                                                        ? 'bg-yellow-500/20 text-yellow-400 hover:bg-yellow-500/30'
                                                        : 'bg-green-500/20 text-green-400 hover:bg-green-500/30'
                                                        }`}
                                                >
                                                    {doc.verified ? 'Unverify' : 'Verify'}
                                                </button>
                                                <button
                                                    onClick={() => handleDelete(doc.id)}
                                                    className="px-3 py-1 bg-red-500/20 text-red-400 hover:bg-red-500/30 rounded-lg font-medium transition-colors"
                                                >
                                                    Delete
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </motion.div>
            </div>
        </DashboardLayout>
    )
}
