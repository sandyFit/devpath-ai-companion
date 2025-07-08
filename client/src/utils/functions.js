// Utility functions
export const getStatusColor = (status) => {
    const colors = {
        'COMPLETED': 'text-green-400 bg-green-400/10',
        'PROCESSING': 'text-yellow-400 bg-yellow-400/10',
        'FAILED': 'text-red-400 bg-red-400/10',
        'PENDING': 'text-blue-400 bg-blue-400/10'
    };
    return colors[status] || 'text-gray-400 bg-gray-400/10';
};

export const getPriorityColor = (priority) => {
    const colors = {
        'HIGH': 'text-red-400 bg-red-400/10',
        'MEDIUM': 'text-yellow-400 bg-yellow-400/10',
        'LOW': 'text-green-400 bg-green-400/10'
    };
    return colors[priority] || 'text-gray-400 bg-gray-400/10';
};
