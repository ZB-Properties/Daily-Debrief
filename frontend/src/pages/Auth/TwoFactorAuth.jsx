import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  FiShield, FiSmartphone, FiCopy, FiCheck, FiArrowLeft,
  FiAlertCircle, FiLock, FiKey
} from 'react-icons/fi';
import QRCode from '../../components/common/QRCode';
import Button from '../../components/common/Button';
import Input from '../../components/common/Input';
import api from '../../services/api';
import toast from 'react-hot-toast';

const TwoFactorAuth = () => {
  const [step, setStep] = useState(1); // 1: intro, 2: setup, 3: backup codes, 4: enabled
  const [isLoading, setIsLoading] = useState(false);
  const [qrCode, setQrCode] = useState('');
  const [secret, setSecret] = useState('');
  const [verificationCode, setVerificationCode] = useState('');
  const [backupCodes, setBackupCodes] = useState([]);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState('');
  
  const navigate = useNavigate();

  useEffect(() => {
    check2FAStatus();
  }, []);

  const check2FAStatus = async () => {
    try {
      const response = await api.get('/auth/2fa/status');
      if (response.data.enabled) {
        setStep(4);
      }
    } catch (error) {
      console.error('Error checking 2FA status:', error);
    }
  };

  const handleSetup2FA = async () => {
    setIsLoading(true);
    setError('');
    try {
      const response = await api.post('/auth/2fa/setup');
      setQrCode(response.data.qrCode);
      setSecret(response.data.secret);
      setStep(2);
    } catch (error) {
      setError(error.response?.data?.error || 'Failed to setup 2FA');
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerifyCode = async () => {
    if (!verificationCode || verificationCode.length !== 6) {
      setError('Please enter a valid 6-digit code');
      return;
    }

    setIsLoading(true);
    setError('');
    try {
      const response = await api.post('/auth/2fa/verify', {
        code: verificationCode
      });
      
      if (response.data.success) {
        setBackupCodes(response.data.backupCodes || []);
        setStep(3);
        toast.success('2FA enabled successfully');
      }
    } catch (error) {
      setError(error.response?.data?.error || 'Invalid verification code');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDisable2FA = async () => {
    if (!window.confirm('Are you sure you want to disable 2FA? This will make your account less secure.')) {
      return;
    }

    setIsLoading(true);
    try {
      await api.post('/auth/2fa/disable');
      setStep(1);
      toast.success('2FA disabled');
    } catch (error) {
      toast.error('Failed to disable 2FA');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCopyBackupCodes = () => {
    navigator.clipboard.writeText(backupCodes.join('\n'));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
    toast.success('Backup codes copied');
  };

  const handleDownloadBackupCodes = () => {
    const blob = new Blob([backupCodes.join('\n')], { type: 'text/plain' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'backup-codes.txt';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
  };

  return (
    <div className="bg-gradient-to-br from-red-50 to-blue-200 dark:from-gray-900 dark:to-red-950 min-h-screen">
      <div className="max-w-2xl mx-auto p-4 md:p-6">
        {/* Header */}
        <div className="mb-8">
          <button
            onClick={() => navigate('/settings')}
            className="inline-flex items-center text-sm text-blue-600 dark:text-blue-400 hover:underline mb-4"
          >
            <FiArrowLeft className="w-4 h-4 mr-2" />
            Back to Settings
          </button>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            Two-Factor Authentication
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-2">
            Add an extra layer of security to your account
          </p>
        </div>

        {/* Main Card */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-8">
          {/* Step 1: Intro */}
          {step === 1 && (
            <div className="space-y-8">
              <div className="text-center">
                <div className="inline-flex items-center justify-center w-20 h-20 bg-blue-100 dark:bg-blue-900/20 rounded-full mb-4">
                  <FiShield className="w-10 h-10 text-blue-600" />
                </div>
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                  Secure Your Account
                </h2>
                <p className="text-gray-600 dark:text-gray-400">
                  Two-factor authentication adds an extra layer of security to your account. 
                  Once enabled, you'll need both your password and a verification code from 
                  your authenticator app to sign in.
                </p>
              </div>

              <div className="grid md:grid-cols-3 gap-4">
                <div className="p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg text-center">
                  <div className="text-2xl font-bold text-blue-600 mb-2">1</div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Install an authenticator app like Google Authenticator or Authy
                  </p>
                </div>
                <div className="p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg text-center">
                  <div className="text-2xl font-bold text-blue-600 mb-2">2</div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Scan the QR code with your authenticator app
                  </p>
                </div>
                <div className="p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg text-center">
                  <div className="text-2xl font-bold text-blue-600 mb-2">3</div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Enter the verification code from the app
                  </p>
                </div>
              </div>

              <Button
                onClick={handleSetup2FA}
                loading={isLoading}
                fullWidth
                size="large"
                className="bg-gradient-to-r from-red-500 to-blue-800 hover:from-red-600 hover:to-blue-900"
              >
                Get Started
              </Button>
            </div>
          )}

          {/* Step 2: Setup QR Code */}
          {step === 2 && (
            <div className="space-y-8">
              <div className="text-center">
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                  Scan QR Code
                </h2>
                <p className="text-gray-600 dark:text-gray-400">
                  Scan this QR code with your authenticator app
                </p>
              </div>

              <div className="flex justify-center">
                <div className="p-4 bg-white rounded-lg shadow-lg">
                  <QRCode value={qrCode} size={200} />
                </div>
              </div>

              <div className="p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                  Can't scan the QR code? Use this secret key instead:
                </p>
                <div className="flex items-center space-x-2">
                  <code className="flex-1 p-2 bg-gray-100 dark:bg-gray-800 rounded font-mono text-sm">
                    {secret}
                  </code>
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText(secret);
                      toast.success('Secret copied');
                    }}
                    className="p-2 hover:bg-gray-200 dark:hover:bg-gray-600 rounded"
                  >
                    <FiCopy className="w-4 h-4" />
                  </button>
                </div>
              </div>

              <div className="space-y-4">
                <Input
                  type="text"
                  placeholder="Enter 6-digit code"
                  value={verificationCode}
                  onChange={(e) => setVerificationCode(e.target.value)}
                  maxLength={6}
                  icon={<FiLock />}
                />

                {error && (
                  <div className="flex items-center gap-2 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 p-3 rounded-lg">
                    <FiAlertCircle className="flex-shrink-0" />
                    <span className="text-sm">{error}</span>
                  </div>
                )}

                <Button
                  onClick={handleVerifyCode}
                  loading={isLoading}
                  fullWidth
                  disabled={verificationCode.length !== 6}
                >
                  Verify and Enable
                </Button>

                <button
                  onClick={() => setStep(1)}
                  className="w-full text-sm text-gray-600 dark:text-gray-400 hover:underline"
                >
                  Go back
                </button>
              </div>
            </div>
          )}

          {/* Step 3: Backup Codes */}
          {step === 3 && (
            <div className="space-y-8">
              <div className="text-center">
                <div className="inline-flex items-center justify-center w-16 h-16 bg-yellow-100 dark:bg-yellow-900/20 rounded-full mb-4">
                  <FiKey className="w-8 h-8 text-yellow-600" />
                </div>
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                  Save Your Backup Codes
                </h2>
                <p className="text-gray-600 dark:text-gray-400">
                  These backup codes can be used to access your account if you lose your phone.
                  Save them in a secure place.
                </p>
              </div>

              <div className="p-6 bg-gray-900 rounded-lg">
                <div className="grid grid-cols-2 gap-4">
                  {backupCodes.map((code, index) => (
                    <div key={index} className="font-mono text-sm text-green-400 text-center">
                      {code}
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex space-x-3">
                <Button
                  onClick={handleCopyBackupCodes}
                  variant="outline"
                  icon={<FiCopy />}
                  className="flex-1"
                >
                  {copied ? 'Copied!' : 'Copy Codes'}
                </Button>
                <Button
                  onClick={handleDownloadBackupCodes}
                  variant="outline"
                  className="flex-1"
                >
                  Download
                </Button>
              </div>

              <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                <p className="text-sm text-blue-800 dark:text-blue-300">
                  <span className="font-bold">Important:</span> Each code can only be used once.
                  Store them safely and don't share them with anyone.
                </p>
              </div>

              <Button
                onClick={() => setStep(4)}
                fullWidth
              >
                I've Saved My Codes
              </Button>
            </div>
          )}

          {/* Step 4: Enabled */}
          {step === 4 && (
            <div className="space-y-8">
              <div className="text-center">
                <div className="inline-flex items-center justify-center w-20 h-20 bg-green-100 dark:bg-green-900/20 rounded-full mb-4">
                  <FiCheck className="w-10 h-10 text-green-600" />
                </div>
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                  2FA is Enabled
                </h2>
                <p className="text-gray-600 dark:text-gray-400">
                  Your account is now more secure. You'll need to enter a verification code
                  from your authenticator app when signing in.
                </p>
              </div>

              <div className="p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                <h3 className="font-medium text-gray-900 dark:text-white mb-2">
                  What to remember:
                </h3>
                <ul className="text-sm text-gray-600 dark:text-gray-400 space-y-2">
                  <li>• Keep your backup codes in a safe place</li>
                  <li>• Use your authenticator app to generate codes</li>
                  <li>• Each backup code can only be used once</li>
                </ul>
              </div>

              <div className="flex space-x-3">
                <Button
                  onClick={handleDisable2FA}
                  variant="danger"
                  loading={isLoading}
                  className="flex-1"
                >
                  Disable 2FA
                </Button>
                <Button
                  onClick={() => navigate('/settings')}
                  variant="outline"
                  className="flex-1"
                >
                  Done
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default TwoFactorAuth;