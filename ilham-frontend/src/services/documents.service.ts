// Documents Service - API calls for student document management

const API_BASE = 'http://localhost:4000/api';

export interface StudentDocument {
    id: number;
    student_id: number;
    document_type: string;
    document_name: string;
    file_url: string;
    uploaded_at: string;
    verified: boolean;
    verified_by?: number;
    verified_at?: string;
    verified_by_email?: string;
    student_name?: string;
    student_email?: string;
}

export const documentsService = {
    /**
     * Upload a new document for a student
     */
    async uploadDocument(
        studentId: number,
        documentType: string,
        file: File,
        documentName?: string
    ): Promise<{ message: string; document_id: number; file_url: string }> {
        const token = localStorage.getItem('token');
        const formData = new FormData();
        formData.append('file', file);
        formData.append('student_id', studentId.toString());
        formData.append('document_type', documentType);
        if (documentName) {
            formData.append('document_name', documentName);
        }

        const response = await fetch(`${API_BASE}/documents/upload`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`
            },
            body: formData
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.message || 'Failed to upload document');
        }

        return response.json();
    },

    /**
     * Get all documents for a specific student
     */
    async getStudentDocuments(studentId: number): Promise<StudentDocument[]> {
        const token = localStorage.getItem('token');
        const response = await fetch(`${API_BASE}/documents/student/${studentId}`, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        if (!response.ok) {
            throw new Error('Failed to fetch student documents');
        }

        return response.json();
    },

    /**
     * Get a specific document by ID
     */
    async getDocument(documentId: number): Promise<StudentDocument> {
        const token = localStorage.getItem('token');
        const response = await fetch(`${API_BASE}/documents/${documentId}`, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        if (!response.ok) {
            throw new Error('Failed to fetch document');
        }

        return response.json();
    },

    /**
     * Get all documents (admin only)
     */
    async getAllDocuments(filters?: {
        student_id?: number;
        document_type?: string;
        verified?: boolean;
    }): Promise<StudentDocument[]> {
        const token = localStorage.getItem('token');
        const params = new URLSearchParams();

        if (filters?.student_id) params.append('student_id', filters.student_id.toString());
        if (filters?.document_type) params.append('document_type', filters.document_type);
        if (filters?.verified !== undefined) params.append('verified', filters.verified.toString());

        const url = `${API_BASE}/documents${params.toString() ? '?' + params.toString() : ''}`;
        const response = await fetch(url, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        if (!response.ok) {
            throw new Error('Failed to fetch documents');
        }

        return response.json();
    },

    /**
     * Verify a document (admin only)
     */
    async verifyDocument(documentId: number): Promise<{ message: string }> {
        const token = localStorage.getItem('token');
        const response = await fetch(`${API_BASE}/documents/${documentId}/verify`, {
            method: 'PUT',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.message || 'Failed to verify document');
        }

        return response.json();
    },

    /**
     * Unverify a document (admin only)
     */
    async unverifyDocument(documentId: number): Promise<{ message: string }> {
        const token = localStorage.getItem('token');
        const response = await fetch(`${API_BASE}/documents/${documentId}/unverify`, {
            method: 'PUT',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.message || 'Failed to unverify document');
        }

        return response.json();
    },

    /**
     * Delete a document (admin only)
     */
    async deleteDocument(documentId: number): Promise<{ message: string }> {
        const token = localStorage.getItem('token');
        const response = await fetch(`${API_BASE}/documents/${documentId}`, {
            method: 'DELETE',
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.message || 'Failed to delete document');
        }

        return response.json();
    }
};
