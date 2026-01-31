import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import DashboardLayout from '../../components/layout/DashboardLayout'
import { counselorsService } from '../../services/counselors.service'
import type { Counselor, CounselorAssignment } from '../../services/counselors.service'

export default function CounselorManagement() {
    const [counselors, setCounselors] = useState<Counselor[]>([])
    const [assignments, setAssignments] = useState<CounselorAssignment[]>([])
    const [loading, setLoading] = useState(true)
    const [assignForm, setAssignForm] = useState({
        studentId: '',
        counselorId: ''
    })

    useEffect(() => {
        fetchData()
    }, [])

    const fetchData = async () => {
        try {
            setLoading(true)
            const [counselorsData, assignmentsData] = await Promise.all([
                counselorsService.getAllCounselors(),
                counselorsService.getAllAssignments(true) // Only active assignments
            ])
            setCounselors(counselorsData)
            setAssignments(assignmentsData)
        } catch (error) {
            console.error('Failed to fetch data:', error)
            alert('Failed to load counselor data')
        } finally {
            setLoading(false)
        }
    }

    const handleAssign = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!assignForm.studentId || !assignForm.counselorId) {
            alert('Please fill in all fields')
            return
        }

        try {
            await counselorsService.assignCounselor(
                parseInt(assignForm.studentId),
                parseInt(assignForm.counselorId)
            )
            alert('Counselor assigned successfully!')
            setAssignForm({ studentId: '', counselorId: '' })
            fetchData()
        } catch (error: any) {
            alert(error.message || 'Failed to assign counselor')
        }
    }

    const handleDeactivate = async (assignmentId: number) => {
        if (!confirm('Are you sure you want to deactivate this assignment?')) return

        try {
            await counselorsService.updateAssignment(assignmentId, false)
            alert('Assignment deactivated successfully')
            fetchData()
        } catch (error: any) {
            alert(error.message || 'Failed to deactivate assignment')
        }
    }

    return (
        <DashboardLayout>
            <div className="space-y-6">
                <h1 className="text-3xl font-bold text-white">Counselor Management</h1>

                {/* Assign Counselor Form */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-white/10 backdrop-blur-xl rounded-2xl p-6 border border-white/20"
                >
                    <h2 className="text-xl font-semibold text-white mb-4">Assign Counselor to Student</h2>
                    <form onSubmit={handleAssign} className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-white/80 mb-2">
                                    Student ID *
                                </label>
                                <input
                                    type="number"
                                    value={assignForm.studentId}
                                    onChange={(e) => setAssignForm({ ...assignForm, studentId: e.target.value })}
                                    className="w-full px-4 py-2 bg-white/5 border border-white/20 rounded-lg text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-cyan-400"
                                    placeholder="Enter student ID"
                                    required
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-white/80 mb-2">
                                    Counselor *
                                </label>
                                <select
                                    value={assignForm.counselorId}
                                    onChange={(e) => setAssignForm({ ...assignForm, counselorId: e.target.value })}
                                    className="w-full px-4 py-2 bg-white/5 border border-white/20 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-cyan-400"
                                    required
                                >
                                    <option value="" className="bg-gray-800">Select a counselor</option>
                                    {counselors.map((counselor) => (
                                        <option key={counselor.id} value={counselor.id} className="bg-gray-800">
                                            {counselor.email} ({counselor.active_students} students)
                                        </option>
                                    ))}
                                </select>
                            </div>
                        </div>

                        <button
                            type="submit"
                            className="px-6 py-2 bg-cyan-500 hover:bg-cyan-600 text-white rounded-lg font-medium transition-colors"
                        >
                            Assign Counselor
                        </button>
                    </form>
                </motion.div>

                {/* Counselors Overview */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 }}
                    className="bg-white/10 backdrop-blur-xl rounded-2xl p-6 border border-white/20"
                >
                    <h2 className="text-xl font-semibold text-white mb-4">Counselors Overview</h2>
                    {loading ? (
                        <div className="text-center text-white/60 py-4">Loading...</div>
                    ) : counselors.length === 0 ? (
                        <div className="text-center text-white/60 py-4">No counselors found</div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            {counselors.map((counselor) => (
                                <div
                                    key={counselor.id}
                                    className="bg-white/5 rounded-lg p-4 border border-white/10"
                                >
                                    <div className="flex items-center justify-between mb-2">
                                        <h3 className="font-medium text-white">{counselor.email}</h3>
                                        {counselor.is_verified && (
                                            <span className="text-green-400 text-xs">✓ Verified</span>
                                        )}
                                    </div>
                                    <p className="text-2xl font-bold text-cyan-400">
                                        {counselor.active_students}
                                    </p>
                                    <p className="text-sm text-white/60">Active Students</p>
                                </div>
                            ))}
                        </div>
                    )}
                </motion.div>

                {/* Active Assignments */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                    className="bg-white/10 backdrop-blur-xl rounded-2xl border border-white/20 overflow-hidden"
                >
                    <div className="p-6 border-b border-white/10">
                        <h2 className="text-xl font-semibold text-white">Active Assignments</h2>
                    </div>
                    {loading ? (
                        <div className="p-8 text-center text-white/60">Loading assignments...</div>
                    ) : assignments.length === 0 ? (
                        <div className="p-8 text-center text-white/60">No active assignments</div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead className="bg-white/5">
                                    <tr>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-white/80 uppercase tracking-wider">
                                            Student
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-white/80 uppercase tracking-wider">
                                            Counselor
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-white/80 uppercase tracking-wider">
                                            Assigned Date
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-white/80 uppercase tracking-wider">
                                            Actions
                                        </th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-white/10">
                                    {assignments.map((assignment) => (
                                        <tr key={assignment.assignment_id} className="hover:bg-white/5 transition-colors">
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div className="text-sm text-white">{assignment.student_name}</div>
                                                <div className="text-xs text-white/60">{assignment.student_email}</div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-white/80">
                                                {assignment.counselor_email}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-white/60">
                                                {new Date(assignment.assigned_at).toLocaleDateString()}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm">
                                                <button
                                                    onClick={() => handleDeactivate(assignment.assignment_id)}
                                                    className="px-3 py-1 bg-red-500/20 text-red-400 hover:bg-red-500/30 rounded-lg font-medium transition-colors"
                                                >
                                                    Deactivate
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
