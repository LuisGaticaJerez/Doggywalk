export const getStatusColor = (status: string): { bg: string; text: string } => {
  const colors = {
    pending: { bg: '#fef3c7', text: '#92400e' },
    accepted: { bg: '#dbeafe', text: '#1e40af' },
    in_progress: { bg: '#e0e7ff', text: '#3730a3' },
    completed: { bg: '#d1fae5', text: '#065f46' },
    cancelled: { bg: '#fee2e2', text: '#991b1b' }
  };
  return colors[status as keyof typeof colors] || colors.pending;
};
