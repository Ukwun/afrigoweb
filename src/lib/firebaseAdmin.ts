import { applicationDefault, cert, getApps, initializeApp } from 'firebase-admin/app'
import { getAuth } from 'firebase-admin/auth'
import { getFirestore } from 'firebase-admin/firestore'
import { getStorage } from 'firebase-admin/storage'

function app(){if(getApps().length)return getApps()[0];const projectId=process.env.FIREBASE_PROJECT_ID||process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,clientEmail=process.env.FIREBASE_CLIENT_EMAIL,privateKey=process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g,'\n');if(!projectId)throw new Error('Firebase Admin is not configured');return initializeApp({credential:clientEmail&&privateKey?cert({projectId,clientEmail,privateKey}):applicationDefault(),projectId,storageBucket:process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET})}
export function firebaseAdmin(){const instance=app();return{auth:getAuth(instance),db:getFirestore(instance),storage:getStorage(instance)}}
