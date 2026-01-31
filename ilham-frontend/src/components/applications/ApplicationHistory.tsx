import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { applicationsService } from '../../services/applications.service'
import type { ApplicationHistoryEntry } from '../../services/applications.service'

interface ApplicationHistoryProps {
    applicationId: number
}

export default function ApplicationHistory({ applicationId }: ApplicationHistoryProps) {
    const [history, setHistory] = useState<ApplicationHistoryEntry[]>([])
    const [loading, setLoading] = useState(true)
    const [isOpen, setIsOpen] = useState(false)

    useEffect(() => {
        if (isOpen && applicationId) {
            fetchHistory()
        }
    }, [isOpen, applicationId])

    const fetchHistory = async () => {
        try {
            setLoading(true)
            const data = await applicationsService.getApplicationHistory(applicationId)
            setHistory(data)
        } catch (error) {
            console.error('Failed to fetch application history:', error)
        } finally {
            setLoading(false)
        }
    }

    const getStatusColor = (status: string) => {
        switch (status.toLowerCase()) {
            case 'applied':
                return 'bg-blue-500/20 text-blue-400'
            case 'approved':
                return 'bg-green-500/20 text-green-400'
            case 'rejected':
                return 'bg-red-500/20 text-red-400'
            default:
                return 'bg-gray-500/20 text-gray-400'
        }
    }

    return (
        <>
            {/* Trigger Button */}
            <button
                onClick={() => setIsOpen(true)}
                className="px-3 py-1 bg-purple-500/20 text-purple-400 hover:bg-purple-500/30 rounded-lg font-medium transition-colors text-sm"
            >
                View History
            </button>

            {/* Modal */}
            {isOpen && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="bg-gradient-to-br from-[#081A33] to-[#0B2D55] rounded-2xl border border-white/20 max-w-2xl w-full max-h-[80vh] overflow-hidden"
                    >
                        {/* Header */}
                        <div className="p-6 border-b border-white/10 flex justify-between items-center">
                            <h2 className="text-2xl font-bold text-white">Application History</h2>
                            <button
                                onClick={() => setIsOpen(false)}
                                className="text-white/60 hover:text-white transition-colors"
                            >
                                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            </button>
                        </div>

                        {/* Content */}
                        <div className="p-6 overflow-y-auto max-h-[calc(80vh-100px)]">
                            {loading ? (
                                <div className="text-center text-white/60 py-8">Loading history...</div>
                            ) : history.length === 0 ? (
                                <div className="text-center text-white/60 py-8">No history available</div>
                            ) : (
                                <div className="space-y-4">
                                    {/* Timeline */}
                                    <div className="relative">
                                        {/* Vertical line */}
                                        <div className="absolute left-4 top-0 bottom-0 w-0.5 bg-white/20"></div>

                                        {/* Timeline items */}
                                        {history.map((entry, index) => (
                                            <div key={entry.id} className="relative pl-12 pb-8 last:pb-0">
                                                {/* Timeline dot */}
                                                <div className="absolute left-2 top-2 w-4 h-4 rounded-full bg-cyan-500 border-2 border-[#081A33]"></div>

                                                {/* Content */}
                                                <motion.div
                                                    initial={{ opacity: 0, x: -20 }}
                                                    animate={{ opacity: 1, x: 0 }}
                                                    transition={{ delay: index * 0.1 }}
                                                    className="bg-white/5 rounded-lg p-4 border border-white/10"
                                                >
                                                    <div className="flex items-start justify-between mb-2">
                                                        <div className="flex gap-2">
                                                            <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(entry.old_status)}`}>
                                                                {entry.old_status}
                                                            </span>
                                                            <span className="text-white/40">→</span>
                                                            <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(entry.new_status)}`}>
                                                                {entry.new_status}
                                                            </span>
                                                        </div>
                                                        <span className="text-xs text-white/40">
                                                            {new Date(entry.changed_at).toLocaleString()}
                                                        </span>
                                                    </div>

                                                    {entry.counselor_remark && (
                                                        <div className="mt-2 p-3 bg-white/5 rounded border border-white/10">
                                                            <p className="text-xs text-white/60 mb-1">Counselor Remark:</p>
                                                            <p className="text-sm text-white">{entry.counselor_remark}</p>
                                                        </div>
                                                    )}

                                                    {entry.changed_by_email && (
                                                        <div className="mt-2 text-xs text-white/40">
                                                            Changed by: {entry.changed_by_email}
                                                        </div>
                                                    )}
                                                </motion.div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Footer */}
                        <div className="p-4 border-t border-white/10 flex justify-end">
                            <button
                                onClick={() => setIsOpen(false)}
                                className="px-4 py-2 bg-white/10 hover:bg-white/20 text-white rounded-lg font-medium transition-colors"
                            >
                                Close
                            </button>
                        </div>
                    </motion.div>
                </div>
            )}
        </>
    )
}
