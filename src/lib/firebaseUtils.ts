import { 
  collection, 
  doc, 
  serverTimestamp, 
  Timestamp,
  DocumentReference,
  CollectionReference
} from 'firebase/firestore';
import { db } from './firebase';

/**
 * Standard path generator to match Mobile App's "getUserSubCollection" logic
 * pattern: collectionName/{userId}/collectionName
 */
export const getStudentSubCollection = (category: string, studentId: string) => {
  return collection(db, category, studentId, category);
};

/**
 * Common data injector to match Flutter's "setData" metadata
 */
export const injectMetadata = (data: any, isUpdate: boolean = false) => {
  const userDataRaw = typeof window !== 'undefined' ? localStorage.getItem('userData') : null;
  const userData = userDataRaw ? JSON.parse(userDataRaw) : null;

  const metadata: any = {
    updated_at: serverTimestamp(),
    updatedTimes: serverTimestamp(),
    updatedAt: serverTimestamp(), // Web legacy compatibility
  };

  if (!isUpdate) {
    metadata.created_at = serverTimestamp();
    metadata.createdTimes = serverTimestamp();
    metadata.createdAt = serverTimestamp(); // Web legacy compatibility
    
    if (userData) {
      metadata.createdBy = userData.uid;
      metadata.createdByName = userData.displayName || '';
      metadata.createdByImageUrl = userData.photoURL || '';
    }
  }

  return { ...data, ...metadata };
};

/**
 * Map Flutter Rating Enum to Arabic Text
 */
export const getRatingLabel = (rating: number): string => {
  switch (rating) {
    case 1: return 'ممتاز';
    case 2: return 'جيد جداً';
    case 3: return 'جيد';
    case 4: return 'مقبول';
    case 5: return 'ضعيف';
    default: return 'بدون تقييم';
  }
};
