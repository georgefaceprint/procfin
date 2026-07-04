import React, { useState, useEffect } from 'react';
import { auth, db, messaging } from './firebase';
import { getToken, onMessage } from 'firebase/messaging';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import { doc, getDoc, updateDoc, setDoc } from 'firebase/firestore';
import Home from './components/Home';
import Auth from './components/Auth';
import SplashScreen from './components/SplashScreen';
import PinLockScreen from './components/PinLockScreen';
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
import SmeSourcing from './components/SmeSourcing';
import Calculator from './components/Calculator';
import ComingSoon from './components/ComingSoon';
import { useToast } from './components/Toast';
import { Capacitor } from '@capacitor/core';
import { PushNotifications } from '@capacitor/push-notifications';
import './index.css';

export default function App() {
  const [currentView, setCurrentView] = useState('home');
  const [authIntent, setAuthIntent] = useState(null);
  const [viewParam, setViewParam] = useState(null); // for passing dealId etc.
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showSplash, setShowSplash] = useState(true);
  const [isUnlocked, setIsUnlocked] = useState(true); // default to true to disable PIN wall
  const [liveContext, setLiveContext] = useState({ rfqs: [], deals: [] });
  const toast = useToast();

  useEffect(() => {
    document.documentElement.classList.add('dark');

    // Minimum splash screen duration
    const splashTimer = setTimeout(() => {
      setShowSplash(false);
      setLoading(false); // Failsafe to guarantee splash screen unmounts!
    }, 4000);

    let unsubRFQs = null;
    let unsubDeals = null;

    const unsubscribeAuth = onAuthStateChanged(auth, async (authUser) => {
      setLoading(true);
      try {
        if (authUser) {
          // Fetch profile from Firestore
          const userRef = doc(db, "users", authUser.uid);
          const userSnap = await getDoc(userRef);

          if (userSnap.exists()) {
            const userData = userSnap.data();
            const userType = userData.type || userData.role || 'SME';
            setUser({ 
              ...authUser, 
              ...userData, 
              uid: authUser.uid, 
              id: authUser.uid,
              type: userType,
              role: userType
            });

            // Setup Live Context Listeners
            const { collection, query, where, onSnapshot } = await import('firebase/firestore');

            const isSme = userType === 'SME';
            const qRfqs = query(collection(db, "rfqs"), where(isSme ? "smeId" : "supplierId", "==", authUser.uid));
            unsubRFQs = onSnapshot(qRfqs, 
              (snap) => {
                const rfqs = snap.docs.map(d => ({ id: d.id, ...d.data() }));
                setLiveContext(prev => ({ ...prev, rfqs }));
              },
              (err) => {
                console.error("Live RFQ listener error:", err);
              }
            );

            const qDeals = query(collection(db, "deals"), where(isSme ? "smeId" : "supplierId", "==", authUser.uid));
            unsubDeals = onSnapshot(qDeals, 
              (snap) => {
                const deals = snap.docs.map(d => ({ id: d.id, ...d.data() }));
                setLiveContext(prev => ({ ...prev, deals }));
              },
              (err) => {
                console.error("Live Deals listener error:", err);
              }
            );

            if (userData.onboardingComplete) {
              setCurrentView('dashboard');
            } else {
              setCurrentView('onboarding');
            }
          } else {
            setUser({ ...authUser, uid: authUser.uid, id: authUser.uid, type: 'SME', role: 'SME' });
          }
        } else {
          setUser(null);
          setLiveContext({ rfqs: [], deals: [] });
          setCurrentView('home');
          if (unsubRFQs) unsubRFQs();
          if (unsubDeals) unsubDeals();
        }
      } catch (err) {
        console.error("Critical error in onAuthStateChanged:", err);
      } finally {
        setLoading(false);
      }
    });

    return () => {
      clearTimeout(splashTimer);
      unsubscribeAuth();
      if (unsubRFQs) unsubRFQs();
      if (unsubDeals) unsubDeals();
    };
  }, []);

  // Setup Push Notifications when the app boots
  useEffect(() => {
    if (Capacitor.isNativePlatform()) {
      const registerPush = async () => {
        try {
          const permStatus = await PushNotifications.requestPermissions();
          if (permStatus.receive === 'granted') {
            await PushNotifications.register();
          }

          PushNotifications.addListener('registration', async (token) => {
            console.log('Push registration success, token: ' + token.value);
            if (user && user.uid) {
              try {
                await updateDoc(doc(db, "users", user.uid), {
                  pushToken: token.value
                });
              } catch (e) {
                console.error("Failed to save push token:", e);
              }
            }
          });

          PushNotifications.addListener('pushNotificationReceived', (notification) => {
            toast.info(`New Alert: ${notification.title}`);
          });
        } catch (e) {
          console.error("Error setting up push notifications:", e);
        }
      };
      

      registerPush();
      
      return () => {
        PushNotifications.removeAllListeners();
      };
    } else if (messaging && user && user.uid) {
      // Web Push Notification Fallback using FCM
      const requestWebPush = async () => {
        try {
          const permission = await Notification.requestPermission();
          if (permission === 'granted') {
            const currentToken = await getToken(messaging, { vapidKey: 'BDDM-_bDP7JtZcwrxxeWeLHo6TDOSUvlqlQmCvwEJmzanvlDEYtQ3BK6cNv73I8TWVgAmgrtvJbdPZtioh6BcKE' });
            if (currentToken) {
              await updateDoc(doc(db, "users", user.uid), {
                fcmToken: currentToken
              });
            }
          }
        } catch (err) {
          console.error("Web push error:", err);
        }
      };

      requestWebPush();

      const unsubMessage = onMessage(messaging, (payload) => {
        toast.info(`New Alert: ${payload.notification?.title || 'Notification Received'}`);
      });

      return () => {
        if (unsubMessage) unsubMessage();
      }
    }
  }, [user]); // Re-run if user logs in so we can attach token to their doc

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
      await setDoc(doc(db, "users", user.uid), {
        ...data,
        name: data.companyName,
        onboardingComplete: true,
        type: user.type || 'SME',
        role: user.role || 'SME',
        verified: user.verified || false
      }, { merge: true });
      
      setUser(updatedUser);
      setCurrentView('dashboard');
    } catch (err) {
      console.error("Onboarding update failed:", err);
      toast.error('Failed to save onboarding data: ' + err.message);
      throw err;
    }
  };

  const logout = () => {
    signOut(auth);
  };

  if (showSplash || loading) {
    return <SplashScreen />;
  }


  if (user && user.pinHash && !isUnlocked && currentView !== 'home') {
    return <PinLockScreen user={user} onUnlock={() => setIsUnlocked(true)} onLogout={logout} />;
  }

  return (
    <div className="w-full min-h-screen font-sans">
      {currentView !== 'home' && (
        <div className="bg-[#0b0c10]/95 backdrop-blur-md sticky top-0 z-40 border-b border-gray-800/80 px-6 py-3.5 flex items-center justify-between print:hidden">
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigateTo('home')}
              className="px-3.5 py-1.5 bg-gray-800/80 hover:bg-gray-700 text-gray-300 hover:text-white rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 border border-gray-700/50"
            >
              ← Home
            </button>
            {currentView !== 'dashboard' && currentView !== 'onboarding' && (
              <button
                onClick={() => navigateTo('dashboard')}
                className="px-3.5 py-1.5 bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-400 rounded-lg text-xs font-bold transition-all"
              >
                Dashboard
              </button>
            )}
          </div>
          <div className="flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-[10px] uppercase font-black text-gray-500 tracking-widest">ProcFin PWA Live</span>
          </div>
        </div>
      )}
      {currentView === 'home' && <Home onNavigate={navigateTo} />}
      {currentView === 'auth' && <Auth initialIntent={authIntent} onBack={() => navigateTo('home')} onLogin={(userProfile) => { setIsUnlocked(true); setUser(userProfile); navigateTo(userProfile.onboardingComplete ? 'dashboard' : 'onboarding'); }} />}
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
      {currentView === 'suppliers' && user && (
        <SmeSourcing
          user={user}
          onBack={() => setCurrentView('dashboard')}
          onNavigate={(view, params) => navigateTo(view, params)}
        />
      )}
      {currentView === 'calculator' && user && (
        <Calculator
          user={user}
          onBack={() => setCurrentView('dashboard')}
          onNavigate={(view, params) => navigateTo(view, params)}
        />
      )}
      {currentView === 'dashboard' && user && (
        <Dashboard
          user={user}
          onLogout={logout}
          onNavigate={(view, params) => navigateTo(view, params)}
          onUpdateUser={(fields) => setUser(prev => ({ ...prev, ...fields }))}
        />
      )}
      {!['home', 'auth', 'onboarding', 'vault', 'rfq-form', 'funding-request', 'subscription', 'profile-edit', 'admin-panel', 'funder-review', 'structure-deal', 'supplier-milestones', 'funding-details', 'suppliers', 'calculator', 'dashboard'].includes(currentView) && user && (
        <ComingSoon viewName={currentView} onBack={() => setCurrentView('dashboard')} />
      )}
      <PesaChatbot user={user} liveContext={liveContext} />
    </div>
  );
}
