// Counselors Service - API calls for counselor assignment management

const API_BASE = 'http://localhost:4000/api';

export interface CounselorAssignment {
    assignment_id: number;
    student_id: number;
    counselor_id: number;
    assigned_at: string;
    is_active: boolean;
    student_name?: string;
    student_email?: string;
    counselor_email?: string;
    full_name?: string;
    email?: string;
    phone?: string;
    passport_no?: string;
    nationality?: string;
}

export interface Counselor {
    id: number;
    email: string;
    is_verified: boolean;
    active_students: number;
}

export const counselorsService = {
    /**
     * Assign a counselor to a student
     */
    async assignCounselor(
        studentId: number,
        counselorId: number
    ): Promise<{ message: string; assignment_id: number }> {
        const token = localStorage.getItem('token');
        const response = await fetch(`${API_BASE}/counselors/assign`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                student_id: studentId,
                counselor_id: counselorId
            })
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.message || 'Failed to assign counselor');
        }

        return response.json();
    },

    /**
     * Get all students assigned to a counselor
     */
    async getCounselorStudents(
        counselorId: number,
        includeInactive = false
    ): Promise<CounselorAssignment[]> {
        const token = localStorage.getItem('token');
        const params = new URLSearchParams();
        if (includeInactive) params.append('include_inactive', 'true');

        const url = `${API_BASE}/counselors/students/${counselorId}${params.toString() ? '?' + params.toString() : ''}`;
        const response = await fetch(url, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        if (!response.ok) {
            throw new Error('Failed to fetch counselor students');
        }

        return response.json();
    },

    /**
     * Get assigned counselor for a student
     */
    async getStudentCounselor(studentId: number): Promise<CounselorAssignment | null> {
        const token = localStorage.getItem('token');
        const response = await fetch(`${API_BASE}/counselors/student/${studentId}`, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        if (!response.ok) {
            throw new Error('Failed to fetch student counselor');
        }

        const data = await response.json();
        return data.counselor || data;
    },

    /**
     * Get all counselors
     */
    async getAllCounselors(): Promise<Counselor[]> {
        const token = localStorage.getItem('token');
        const response = await fetch(`${API_BASE}/counselors/list`, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        if (!response.ok) {
            throw new Error('Failed to fetch counselors');
        }

        return response.json();
    },

    /**
     * Get all counselor assignments
     */
    async getAllAssignments(isActive?: boolean): Promise<CounselorAssignment[]> {
        const token = localStorage.getItem('token');
        const params = new URLSearchParams();
        if (isActive !== undefined) params.append('is_active', isActive.toString());

        const url = `${API_BASE}/counselors/assignments${params.toString() ? '?' + params.toString() : ''}`;
        const response = await fetch(url, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        if (!response.ok) {
            throw new Error('Failed to fetch assignments');
        }

        return response.json();
    },

    /**
     * Update assignment status (activate/deactivate)
     */
    async updateAssignment(
        assignmentId: number,
        isActive: boolean
    ): Promise<{ message: string }> {
        const token = localStorage.getItem('token');
        const response = await fetch(`${API_BASE}/counselors/assignment/${assignmentId}`, {
            method: 'PUT',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ is_active: isActive })
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.message || 'Failed to update assignment');
        }

        return response.json();
    },

    /**
     * Delete an assignment
     */
    async deleteAssignment(assignmentId: number): Promise<{ message: string }> {
        const token = localStorage.getItem('token');
        const response = await fetch(`${API_BASE}/counselors/assignment/${assignmentId}`, {
            method: 'DELETE',
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.message || 'Failed to delete assignment');
        }

        return response.json();
    }
};
