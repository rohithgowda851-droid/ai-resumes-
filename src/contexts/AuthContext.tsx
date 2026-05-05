import React, { createContext, useContext, useEffect, useState } from 'react';
import { 
  onAuthStateChanged, 
  User as FirebaseUser,
  signInWithPopup,
  GoogleAuthProvider,
  signOut as firebaseSignOut,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  updateProfile
} from 'firebase/auth';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { auth, db } from '../lib/firebase';

interface UserProfile {
  uid: string;
  email: string;
  displayName: string;
  role: 'admin' | 'recruiter';
  createdAt: string;
}

interface AuthContextType {
  user: FirebaseUser | null;
  profile: UserProfile | null;
  loading: boolean;
  signIn: () => Promise<void>;
  signInEmail: (email: string, pass: string) => Promise<void>;
  signUpEmail: (email: string, pass: string, name: string) => Promise<void>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<FirebaseUser | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    console.log("AuthContext: Setting up onAuthStateChanged listener");
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      console.log("AuthContext: Auth state changed, user:", user?.email || 'null');
      setUser(user);
      
      try {
        if (user) {
          // Fetch or create profile
          console.log("AuthContext: Fetching profile for", user.uid);
          const profileDoc = await getDoc(doc(db, 'users', user.uid));
          
          if (profileDoc.exists()) {
            console.log("AuthContext: Profile found");
            setProfile(profileDoc.data() as UserProfile);
          } else {
            console.log("AuthContext: Profile not found, creating new profile");
            // Create default profile as recruiter (first user could be admin if bootstrapped, but we check email in rules)
            const newProfile: UserProfile = {
              uid: user.uid,
              email: user.email || '',
              displayName: user.displayName || (user.email === 'rohithgowda851@gmail.com' ? 'ROHIT S MADIWALAR' : 'Anonymous User'),
              role: user.email === 'rohithgowda851@gmail.com' ? 'admin' : 'recruiter',
              createdAt: new Date().toISOString()
            };
            await setDoc(doc(db, 'users', user.uid), newProfile);
            setProfile(newProfile);
            console.log("AuthContext: New profile created", newProfile);
          }
        } else {
          setProfile(null);
        }
      } catch (error) {
        console.error("AuthContext: Error during auth state change processing:", error);
      } finally {
        setLoading(false);
        console.log("AuthContext: Loading finished");
      }
    }, (error) => {
      console.error("AuthContext: onAuthStateChanged error:", error);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const signIn = async () => {
    const provider = new GoogleAuthProvider();
    await signInWithPopup(auth, provider);
  };

  const signInEmail = async (email: string, pass: string) => {
    await signInWithEmailAndPassword(auth, email, pass);
  };

  const signUpEmail = async (email: string, pass: string, name: string) => {
    const { user } = await createUserWithEmailAndPassword(auth, email, pass);
    await updateProfile(user, { displayName: name });
    
    // Create profile immediately to avoid race conditions with useEffect
    const newProfile: UserProfile = {
      uid: user.uid,
      email: user.email || email,
      displayName: name,
      role: email === 'rohithgowda851@gmail.com' ? 'admin' : 'recruiter',
      createdAt: new Date().toISOString()
    };
    await setDoc(doc(db, 'users', user.uid), newProfile);
    setProfile(newProfile);
  };

  const signOut = async () => {
    await firebaseSignOut(auth);
  };

  return (
    <AuthContext.Provider value={{ user, profile, loading, signIn, signInEmail, signUpEmail, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
