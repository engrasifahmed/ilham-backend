// Applications Service - Extended with history functionality

const API_BASE = 'http://localhost:4000/api';

export interface ApplicationHistoryEntry {
    id: number;
    application_id: number;
    old_status: string;
    new_status: string;
    counselor_remark?: string;
    changed_by?: number;
    changed_at: string;
    changed_by_email?: string;
}

export interface UnpaidInvoice {
    invoice_id: number;
    application_id: number;
    student_id: number;
    student_name: string;
    student_email: string;
    university_name: string;
    invoice_amount: number;
    invoice_status: string;
    invoice_date: string;
    total_paid: number;
    balance_due: number;
}

export interface UnreadNotification {
    student_id: number;
    student_name: string;
    student_email: string;
    unread_count: number;
}

export interface StudentApplicationSummary {
    student_id: number;
    student_name: string;
    student_email: string;
    application_id: number;
    university_name: string;
    application_status: string;
    applied_at: string;
    invoice_id?: number;
    invoice_amount?: number;
    invoice_status?: string;
    total_paid?: number;
}

export const applicationsService = {
    /**
     * Get application history timeline
     */
    async getApplicationHistory(applicationId: number): Promise<ApplicationHistoryEntry[]> {
        const token = localStorage.getItem('token');
        const response = await fetch(`${API_BASE}/applications/${applicationId}/history`, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        if (!response.ok) {
            throw new Error('Failed to fetch application history');
        }

        return response.json();
    },

    /**
     * Get unpaid invoices (using database view)
     */
    async getUnpaidInvoices(): Promise<UnpaidInvoice[]> {
        const token = localStorage.getItem('token');
        const response = await fetch(`${API_BASE}/admin/unpaid-invoices`, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        if (!response.ok) {
            throw new Error('Failed to fetch unpaid invoices');
        }

        return response.json();
    },

    /**
     * Get unread notifications summary (using database view)
     */
    async getUnreadNotifications(): Promise<UnreadNotification[]> {
        const token = localStorage.getItem('token');
        const response = await fetch(`${API_BASE}/admin/unread-notifications`, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        if (!response.ok) {
            throw new Error('Failed to fetch unread notifications');
        }

        return response.json();
    },

    /**
     * Get student applications summary (using database view)
     */
    async getStudentApplicationsSummary(studentId?: number): Promise<StudentApplicationSummary[]> {
        const token = localStorage.getItem('token');
        const params = new URLSearchParams();
        if (studentId) params.append('student_id', studentId.toString());

        const url = `${API_BASE}/admin/student-applications-summary${params.toString() ? '?' + params.toString() : ''}`;
        const response = await fetch(url, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        if (!response.ok) {
            throw new Error('Failed to fetch student applications summary');
        }

        return response.json();
    }
};
