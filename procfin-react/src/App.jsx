import React, { useState, useEffect } from 'react';
import { auth, db } from './firebase';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import Home from './components/Home';
import Auth from './components/Auth';
import Dashboard from './components/Dashboard';
import Onboarding from './components/Onboarding';
import Vault from './components/Vault';
import RfqForm from './components/RfqForm';
import FundingRequest from './components/FundingRequest';
import Subscription from './components/Subscription';
import ProfileEdit from './components/ProfileEdit';
import AdminPanel from './components/AdminPanel';
import FunderReview from './components/FunderReview';
import StructureDeal from './components/StructureDeal';
import SupplierMilestones from './components/SupplierMilestones';
import FundingDetails from './components/FundingDetails';
import PesaChatbot from './components/PesaChatbot';
import { useToast } from './components/Toast';
import './index.css';

export default function App() {
  const [currentView, setCurrentView] = useState('home');
  const [authIntent, setAuthIntent] = useState(null);
  const [viewParam, setViewParam] = useState(null); // for passing dealId etc.
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [liveContext, setLiveContext] = useState({ rfqs: [], deals: [] });
  const toast = useToast();

  useEffect(() => {
    document.documentElement.classList.add('dark');

    let unsubRFQs = null;
    let unsubDeals = null;

    const unsubscribeAuth = onAuthStateChanged(auth, async (authUser) => {
      setLoading(true);
      if (authUser) {
        // Fetch profile from Firestore
        const userRef = doc(db, "users", authUser.uid);
        const userSnap = await getDoc(userRef);

        if (userSnap.exists()) {
          const userData = userSnap.data();
          setUser({ ...authUser, ...userData, uid: authUser.uid, id: authUser.uid });

          // Setup Live Context Listeners
          const { collection, query, where, onSnapshot } = await import('firebase/firestore');

          const qRfqs = query(collection(db, "rfqs"), where(userData.role === 'SME' ? "smeId" : "supplierId", "==", authUser.uid));
          unsubRFQs = onSnapshot(qRfqs, (snap) => {
            const rfqs = snap.docs.map(d => ({ id: d.id, ...d.data() }));
            setLiveContext(prev => ({ ...prev, rfqs }));
          });

          const qDeals = query(collection(db, "deals"), where(userData.role === 'SME' ? "smeId" : "supplierId", "==", authUser.uid));
          unsubDeals = onSnapshot(qDeals, (snap) => {
            const deals = snap.docs.map(d => ({ id: d.id, ...d.data() }));
            setLiveContext(prev => ({ ...prev, deals }));
          });

          if (userData.onboardingComplete) {
            setCurrentView('dashboard');
          } else {
            setCurrentView('onboarding');
          }
        } else {
          setUser({ ...authUser, uid: authUser.uid, id: authUser.uid });
        }
      } else {
        setUser(null);
        setLiveContext({ rfqs: [], deals: [] });
        setCurrentView('home');
        if (unsubRFQs) unsubRFQs();
        if (unsubDeals) unsubDeals();
      }
      setLoading(false);
    });

    return () => {
      unsubscribeAuth();
      if (unsubRFQs) unsubRFQs();
      if (unsubDeals) unsubDeals();
    };
  }, []);

  const navigateTo = (view, params = null) => {
    // If params is an object with dealId, extract for backward compatibility
    if (params && typeof params === 'object' && params.dealId) {
      setViewParam(params.dealId);
      setAuthIntent(null);
    } else if (params && typeof params === 'object') {
      setViewParam(params);
      setAuthIntent(params); 
    } else {
      setViewParam(params);
      setAuthIntent(typeof params === 'string' ? params : null);
    }
    setCurrentView(view);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleOnboardingComplete = async (data) => {
    if (!user) return;

    const updatedUser = {
      ...user,
      ...data,
      onboardingComplete: true,
      name: data.companyName
    };

    try {
      await updateDoc(doc(db, "users", user.uid), {
        ...data,
        name: data.companyName,
        onboardingComplete: true
      });
      setUser(updatedUser);
      setCurrentView('dashboard');
    } catch (err) {
      console.error("Onboarding update failed:", err);
      toast.error('Failed to save onboarding data.');
    }
  };

  const logout = () => {
    signOut(auth);
  };

  if (loading) {
    return (
      <div className="w-full min-h-screen bg-[#1a1a2e] flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-gray-400 font-bold uppercase tracking-widest text-[10px]">Synchronizing ProcFin...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full min-h-screen font-sans">
      {currentView === 'home' && <Home onNavigate={navigateTo} />}
      {currentView === 'auth' && <Auth initialIntent={authIntent} onBack={() => navigateTo('home')} onLogin={(intent) => navigateTo('dashboard', intent)} />}
      {currentView === 'onboarding' && user && <Onboarding user={user} onComplete={handleOnboardingComplete} />}
      {currentView === 'vault' && user && <Vault user={user} onBack={() => setCurrentView('dashboard')} />}
      {currentView === 'rfq-form' && user && <RfqForm user={user} rfqCount={viewParam} onBack={() => setCurrentView('dashboard')} />}
      {currentView === 'funding-request' && user && <FundingRequest user={user} params={viewParam} onBack={() => setCurrentView('dashboard')} />}
      {currentView === 'subscription' && user && (
        <Subscription
          user={user}
          onBack={() => setCurrentView('dashboard')}
          onSuccess={() => {
            setUser(prev => ({ ...prev, subscribed: true }));
            setCurrentView('dashboard');
          }}
        />
      )}
      {currentView === 'profile-edit' && user && (
        <ProfileEdit
          user={user}
          onBack={() => setCurrentView('dashboard')}
          onSaved={(updatedUser) => {
            setUser(prev => ({ ...prev, ...updatedUser }));
            setCurrentView('dashboard');
          }}
        />
      )}
      {currentView === 'admin-panel' && user && <AdminPanel user={user} onBack={() => setCurrentView('dashboard')} />}
      {currentView === 'funder-review' && user && (
        <FunderReview
          user={user}
          dealId={viewParam}
          onBack={() => setCurrentView('dashboard')}
          onApprove={(deal) => {
            setViewParam(deal.id);
            setCurrentView('structure-deal');
          }}
        />
      )}
      {currentView === 'structure-deal' && user && (
        <StructureDeal
          user={user}
          dealId={viewParam}
          onBack={() => setCurrentView('funder-review')}
          onContractGenerated={() => { }}
        />
      )}
      {currentView === 'supplier-milestones' && user && (
        <SupplierMilestones
          user={user}
          dealId={viewParam}
          onBack={() => setCurrentView('dashboard')}
        />
      )}
      {currentView === 'funding-details' && user && (
        <FundingDetails
          user={user}
          dealId={viewParam}
          onBack={() => setCurrentView('dashboard')}
        />
      )}
      {currentView === 'dashboard' && user && (
        <Dashboard
          user={user}
          onLogout={logout}
          onNavigate={(view, params) => navigateTo(view, params)}
        />
      )}
      <PesaChatbot user={user} liveContext={liveContext} />
    </div>
  );
}
