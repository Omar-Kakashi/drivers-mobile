/**
 * Hook to get count of expiring documents
 * Returns the number of documents expiring within 30 days
 */

import { useEffect } from 'react';
import { useDocumentStore } from '../stores/documentStore';
import { useAuthStore } from '../stores/authStore';

export function useExpiringDocumentCount() {
  const { user } = useAuthStore();
  const { 
    expiringDocuments, 
    fetchDocuments, 
    isLoading,
    nearestExpiryDays
  } = useDocumentStore();
  
  useEffect(() => {
    if (user?.id) {
      fetchDocuments(user.id);
    }
  }, [user?.id]);
  
  return {
    expiringCount: expiringDocuments.length,
    nearestExpiryDays,
    isLoading,
  };
}
