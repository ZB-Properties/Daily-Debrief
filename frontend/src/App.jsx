// App.jsx
import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, BrowserRouter } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { SocketProvider } from './context/SocketContext';
import { ThemeProvider } from './context/ThemeContext';
import Toast from './components/common/Toaster'
import PrivateRoute from './components/common/PrivateRoute';
import MainLayout from './components/layout/MainLayout';

import ConnectionStatus from './components/common/ConnectionStatus';
 
// Auth Pages
import Login from './pages/Auth/Login';
import Register from './pages/Auth/Register';
import ForgotPassword from './pages/Auth/ForgotPassword';
import VerifyEmail from './pages/Auth/VerifyEmail'
import TwoFactorLogin from './pages/Auth/TwoFactorLogin'; 
//import ResetPassword from './';


// Main Pages
import Chats from './pages/Chat/Chat';
import Contacts from './pages/Chat/Contacts';
import Calls from './pages/Chat/Calls';
import Favorites from './pages/Chat/Favorites';
import Archived from './pages/Chat/Archived';
import Settings from './pages/Chat/Settings';
import Profile from './pages/Chat/Profile';
import Test from './pages/Test';
import NewChat from './pages/Chat/NewChat'
import Notifications from './pages/Chat/Notifications';
import Call from './pages/Chat/Call';
//import ChangePassword from './pages/Error/ChangePassword';
import { NotificationProvider } from './context/NotificationContext';
import { CallProvider } from './context/CallContext';
import JoinGroup from './pages/Chat/JoinGroup';
import ChangePassword from './pages/Auth/ChangePassword';
import TwoFactorAuth from './pages/Auth/TwoFactorAuth';
import ChatInfo from './pages/Chat/ChatInfo';



function App() {

  return (
    <BrowserRouter future={{
        v7_startTransition: true,
        v7_relativeSplatPath: true,
      }}
    >
   
      <ThemeProvider>
        <AuthProvider>
          <SocketProvider>
            <NotificationProvider>
              <CallProvider>
            <Toast />

            <ConnectionStatus /> 

            <Routes>
              
              {/* Public Routes */}
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />
              <Route path="/forgot-password" element={<ForgotPassword />} />
              <Route path="/2fa-login" element={<TwoFactorLogin />} />
              <Route path="/verify-email/:token" element={<VerifyEmail />} /> 
             
              {/* Protected Routes - All wrapped in MainLayout */}
              <Route element={<PrivateRoute />}>

                <Route element={<MainLayout />}>

                <Route index element={<Navigate to="/chats" replace />} />
      
                  {/* Main Chat Routes */}
    
                  <Route path="/chats" element={<Chats />} />
                  <Route path="/contacts" element={<Contacts />} />
                  <Route path="/calls" element={<Calls />} />
                  <Route path="/favorites" element={<Favorites />} />
                  <Route path="/archived" element={<Archived />} />
                  <Route path="/settings" element={<Settings />} />
                  <Route path="/profile" element={<Profile />} />
                   <Route path="/chat-info/:conversationId" element={<ChatInfo />} />
                 
                  
                  <Route path="/new-chat" element={<NewChat />} />
                  <Route path="/notifications" element={<Notifications />} />
                  <Route path="/change-password" element={<ChangePassword />} />
                  <Route path="/settings/2fa" element={<TwoFactorAuth />} />
                  
                  
                  {/* Dynamic Routes */}
                  <Route path="/chat/:userId" element={<Chats />} />
                  <Route path="/call/:callId" element={<Call/>} />

                  <Route path="/join-group/:code" element={<JoinGroup />} />
                  
                </Route>
              </Route>

              {/* 404 Page */}
              <Route path="*" element={
                <div className="h-screen flex flex-col items-center justify-center bg-gray-50 dark:bg-gray-900">
                  <h1 className="text-6xl font-bold text-gray-900 dark:text-white mb-4">404</h1>
                  <p className="text-xl text-gray-600 dark:text-gray-400 mb-8">Page not found</p>
                  <a href="/" className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
                    Go to Chats
                  </a>
                </div>
              } />

              
            </Routes>
            
            </CallProvider>
            </NotificationProvider>
          </SocketProvider>
        </AuthProvider>
      </ThemeProvider>
   
    </BrowserRouter>
  );
}



export default App;