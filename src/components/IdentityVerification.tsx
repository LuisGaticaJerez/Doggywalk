import { useState, useRef } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { useI18n } from '../contexts/I18nContext';

interface IdentityVerificationProps {
  onComplete: () => void;
  onSkip?: () => void;
}

interface VerificationData {
  documentType: 'passport' | 'national_id' | 'driver_license';
  documentNumber: string;
  fullName: string;
  dateOfBirth: string;
  nationality: string;
  expiryDate: string;
}

export default function IdentityVerification({ onComplete, onSkip }: IdentityVerificationProps) {
  const { user } = useAuth();
  const { t } = useI18n();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const [verificationData, setVerificationData] = useState<VerificationData>({
    documentType: 'national_id',
    documentNumber: '',
    fullName: '',
    dateOfBirth: '',
    nationality: '',
    expiryDate: ''
  });

  const [documentFront, setDocumentFront] = useState<File | null>(null);
  const [documentBack, setDocumentBack] = useState<File | null>(null);
  const [selfie, setSelfie] = useState<File | null>(null);

  const [documentFrontPreview, setDocumentFrontPreview] = useState<string>('');
  const [documentBackPreview, setDocumentBackPreview] = useState<string>('');
  const [selfiePreview, setSelfiePreview] = useState<string>('');

  const fileInputFront = useRef<HTMLInputElement>(null);
  const fileInputBack = useRef<HTMLInputElement>(null);

  const handleFileSelect = (file: File, type: 'front' | 'back' | 'selfie') => {
    const reader = new FileReader();
    reader.onloadend = () => {
      if (type === 'front') {
        setDocumentFront(file);
        setDocumentFrontPreview(reader.result as string);
      } else if (type === 'back') {
        setDocumentBack(file);
        setDocumentBackPreview(reader.result as string);
      } else {
        setSelfie(file);
        setSelfiePreview(reader.result as string);
      }
    };
    reader.readAsDataURL(file);
  };

  const uploadFile = async (file: File, bucket: string, path: string): Promise<string> => {
    const { data, error } = await supabase.storage
      .from(bucket)
      .upload(path, file, { upsert: true });

    if (error) throw error;

    const { data: { publicUrl } } = supabase.storage
      .from(bucket)
      .getPublicUrl(data.path);

    return publicUrl;
  };

  const handleSubmit = async () => {
    if (!user) return;

    if (!documentFront || !selfie) {
      setError(t.identityVerification.errorMissingFiles);
      return;
    }

    if (verificationData.documentType !== 'passport' && !documentBack) {
      setError(t.identityVerification.errorMissingBackPhoto);
      return;
    }

    setLoading(true);
    setError('');

    try {
      const timestamp = Date.now();
      const userId = user.id;

      const documentFrontUrl = await uploadFile(
        documentFront,
        'identity-documents',
        `${userId}/document-front-${timestamp}.jpg`
      );

      let documentBackUrl = null;
      if (documentBack) {
        documentBackUrl = await uploadFile(
          documentBack,
          'identity-documents',
          `${userId}/document-back-${timestamp}.jpg`
        );
      }

      const selfieUrl = await uploadFile(
        selfie,
        'identity-selfies',
        `${userId}/selfie-${timestamp}.jpg`
      );

      const { error: dbError } = await supabase
        .from('identity_verifications')
        .insert({
          provider_id: userId,
          document_type: verificationData.documentType,
          document_number: verificationData.documentNumber,
          document_front_url: documentFrontUrl,
          document_back_url: documentBackUrl,
          selfie_url: selfieUrl,
          full_name: verificationData.fullName,
          date_of_birth: verificationData.dateOfBirth,
          nationality: verificationData.nationality,
          expiry_date: verificationData.expiryDate || null,
          status: 'pending'
        });

      if (dbError) throw dbError;

      onComplete();
    } catch (err: any) {
      console.error('Error submitting verification:', err);
      setError(err.message || t.identityVerification.errorSubmitting);
    } finally {
      setLoading(false);
    }
  };


  return (
    <div style={{ maxWidth: '600px', margin: '0 auto', padding: '20px' }}>
      <h2 style={{ fontSize: '24px', fontWeight: 'bold', marginBottom: '10px' }}>
        {t.identityVerification.title}
      </h2>
      <p style={{ color: '#666', marginBottom: '30px' }}>
        {t.identityVerification.description}
      </p>

      <div style={{ marginBottom: '30px' }}>
        <div style={{ display: 'flex', gap: '10px', marginBottom: '20px' }}>
          {[1, 2, 3].map((s) => (
            <div
              key={s}
              style={{
                flex: 1,
                height: '4px',
                backgroundColor: step >= s ? '#3b82f6' : '#e5e7eb',
                borderRadius: '2px'
              }}
            />
          ))}
        </div>
        <p style={{ fontSize: '14px', color: '#666' }}>
          {t.identityVerification.step} {step} {t.identityVerification.of} 3
        </p>
      </div>

      {step === 1 && (
        <div>
          <h3 style={{ fontSize: '18px', fontWeight: '600', marginBottom: '20px' }}>
            {t.identityVerification.documentInfo}
          </h3>

          <div style={{ marginBottom: '20px' }}>
            <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500' }}>
              {t.identityVerification.documentType}
            </label>
            <select
              value={verificationData.documentType}
              onChange={(e) => setVerificationData({ ...verificationData, documentType: e.target.value as any })}
              style={{
                width: '100%',
                padding: '12px',
                border: '1px solid #d1d5db',
                borderRadius: '8px',
                fontSize: '16px'
              }}
            >
              <option value="national_id">{t.identityVerification.nationalId}</option>
              <option value="passport">{t.identityVerification.passport}</option>
              <option value="driver_license">{t.identityVerification.driverLicense}</option>
            </select>
          </div>

          <div style={{ marginBottom: '20px' }}>
            <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500' }}>
              {t.identityVerification.documentNumber}
            </label>
            <input
              type="text"
              value={verificationData.documentNumber}
              onChange={(e) => setVerificationData({ ...verificationData, documentNumber: e.target.value })}
              style={{
                width: '100%',
                padding: '12px',
                border: '1px solid #d1d5db',
                borderRadius: '8px',
                fontSize: '16px'
              }}
              placeholder="123456789"
            />
          </div>

          <div style={{ marginBottom: '20px' }}>
            <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500' }}>
              {t.identityVerification.fullName}
            </label>
            <input
              type="text"
              value={verificationData.fullName}
              onChange={(e) => setVerificationData({ ...verificationData, fullName: e.target.value })}
              style={{
                width: '100%',
                padding: '12px',
                border: '1px solid #d1d5db',
                borderRadius: '8px',
                fontSize: '16px'
              }}
              placeholder={t.identityVerification.fullNamePlaceholder}
            />
          </div>

          <div style={{ marginBottom: '20px' }}>
            <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500' }}>
              {t.identityVerification.dateOfBirth}
            </label>
            <input
              type="date"
              value={verificationData.dateOfBirth}
              onChange={(e) => setVerificationData({ ...verificationData, dateOfBirth: e.target.value })}
              style={{
                width: '100%',
                padding: '12px',
                border: '1px solid #d1d5db',
                borderRadius: '8px',
                fontSize: '16px'
              }}
            />
          </div>

          <div style={{ marginBottom: '20px' }}>
            <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500' }}>
              {t.identityVerification.nationality}
            </label>
            <input
              type="text"
              value={verificationData.nationality}
              onChange={(e) => setVerificationData({ ...verificationData, nationality: e.target.value })}
              style={{
                width: '100%',
                padding: '12px',
                border: '1px solid #d1d5db',
                borderRadius: '8px',
                fontSize: '16px'
              }}
              placeholder={t.identityVerification.nationalityPlaceholder}
            />
          </div>

          <div style={{ marginBottom: '20px' }}>
            <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500' }}>
              {t.identityVerification.expiryDate} ({t.identityVerification.optional})
            </label>
            <input
              type="date"
              value={verificationData.expiryDate}
              onChange={(e) => setVerificationData({ ...verificationData, expiryDate: e.target.value })}
              style={{
                width: '100%',
                padding: '12px',
                border: '1px solid #d1d5db',
                borderRadius: '8px',
                fontSize: '16px'
              }}
            />
          </div>

          <button
            onClick={() => setStep(2)}
            disabled={!verificationData.documentNumber || !verificationData.fullName || !verificationData.dateOfBirth || !verificationData.nationality}
            style={{
              width: '100%',
              padding: '14px',
              backgroundColor: '#3b82f6',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              fontSize: '16px',
              fontWeight: '600',
              cursor: 'pointer',
              opacity: (!verificationData.documentNumber || !verificationData.fullName || !verificationData.dateOfBirth || !verificationData.nationality) ? 0.5 : 1
            }}
          >
            {t.identityVerification.continue}
          </button>
        </div>
      )}

      {step === 2 && (
        <div>
          <h3 style={{ fontSize: '18px', fontWeight: '600', marginBottom: '20px' }}>
            {t.identityVerification.uploadDocuments}
          </h3>

          <div style={{ marginBottom: '24px' }}>
            <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500' }}>
              {t.identityVerification.documentFront}
            </label>
            {documentFrontPreview ? (
              <div style={{ position: 'relative' }}>
                <img
                  src={documentFrontPreview}
                  alt="Document front"
                  style={{ width: '100%', borderRadius: '8px', marginBottom: '10px' }}
                />
                <button
                  onClick={() => {
                    setDocumentFront(null);
                    setDocumentFrontPreview('');
                  }}
                  style={{
                    position: 'absolute',
                    top: '10px',
                    right: '10px',
                    padding: '8px 12px',
                    backgroundColor: '#ef4444',
                    color: 'white',
                    border: 'none',
                    borderRadius: '6px',
                    cursor: 'pointer'
                  }}
                >
                  {t.identityVerification.remove}
                </button>
              </div>
            ) : (
              <button
                onClick={() => fileInputFront.current?.click()}
                style={{
                  width: '100%',
                  padding: '48px',
                  backgroundColor: '#f3f4f6',
                  border: '2px dashed #d1d5db',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  fontSize: '16px',
                  color: '#6b7280'
                }}
              >
                📁 {t.identityVerification.uploadFile}
              </button>
            )}
            <input
              ref={fileInputFront}
              type="file"
              accept="image/*"
              onChange={(e) => e.target.files && handleFileSelect(e.target.files[0], 'front')}
              style={{ display: 'none' }}
            />
          </div>

          {verificationData.documentType !== 'passport' && (
            <div style={{ marginBottom: '24px' }}>
              <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500' }}>
                {t.identityVerification.documentBack}
              </label>
              {documentBackPreview ? (
                <div style={{ position: 'relative' }}>
                  <img
                    src={documentBackPreview}
                    alt="Document back"
                    style={{ width: '100%', borderRadius: '8px', marginBottom: '10px' }}
                  />
                  <button
                    onClick={() => {
                      setDocumentBack(null);
                      setDocumentBackPreview('');
                    }}
                    style={{
                      position: 'absolute',
                      top: '10px',
                      right: '10px',
                      padding: '8px 12px',
                      backgroundColor: '#ef4444',
                      color: 'white',
                      border: 'none',
                      borderRadius: '6px',
                      cursor: 'pointer'
                    }}
                  >
                    {t.identityVerification.remove}
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => fileInputBack.current?.click()}
                  style={{
                    width: '100%',
                    padding: '48px',
                    backgroundColor: '#f3f4f6',
                    border: '2px dashed #d1d5db',
                    borderRadius: '8px',
                    cursor: 'pointer',
                    fontSize: '16px',
                    color: '#6b7280'
                  }}
                >
                  📁 {t.identityVerification.uploadFile}
                </button>
              )}
              <input
                ref={fileInputBack}
                type="file"
                accept="image/*"
                onChange={(e) => e.target.files && handleFileSelect(e.target.files[0], 'back')}
                style={{ display: 'none' }}
              />
            </div>
          )}

          <div style={{ display: 'flex', gap: '10px' }}>
            <button
              onClick={() => setStep(1)}
              style={{
                flex: 1,
                padding: '14px',
                backgroundColor: '#e5e7eb',
                color: '#374151',
                border: 'none',
                borderRadius: '8px',
                fontSize: '16px',
                fontWeight: '600',
                cursor: 'pointer'
              }}
            >
              {t.identityVerification.back}
            </button>
            <button
              onClick={() => setStep(3)}
              disabled={!documentFront || (verificationData.documentType !== 'passport' && !documentBack)}
              style={{
                flex: 1,
                padding: '14px',
                backgroundColor: '#3b82f6',
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                fontSize: '16px',
                fontWeight: '600',
                cursor: 'pointer',
                opacity: (!documentFront || (verificationData.documentType !== 'passport' && !documentBack)) ? 0.5 : 1
              }}
            >
              {t.identityVerification.continue}
            </button>
          </div>
        </div>
      )}

      {step === 3 && (
        <div>
          <h3 style={{ fontSize: '18px', fontWeight: '600', marginBottom: '20px' }}>
            {t.identityVerification.selfieVerification}
          </h3>
          <p style={{ color: '#666', marginBottom: '20px', fontSize: '14px' }}>
            {t.identityVerification.selfieInstructions}
          </p>

          <div style={{ marginBottom: '24px' }}>
            {selfiePreview ? (
              <div style={{ position: 'relative' }}>
                <img
                  src={selfiePreview}
                  alt="Selfie"
                  style={{ width: '100%', borderRadius: '8px', marginBottom: '10px' }}
                />
                <button
                  onClick={() => {
                    setSelfie(null);
                    setSelfiePreview('');
                  }}
                  style={{
                    position: 'absolute',
                    top: '10px',
                    right: '10px',
                    padding: '8px 12px',
                    backgroundColor: '#ef4444',
                    color: 'white',
                    border: 'none',
                    borderRadius: '6px',
                    cursor: 'pointer'
                  }}
                >
                  {t.identityVerification.remove}
                </button>
              </div>
            ) : (
              <div>
                <input
                  type="file"
                  accept="image/*"
                  capture="user"
                  id="selfie-input"
                  onChange={(e) => e.target.files && handleFileSelect(e.target.files[0], 'selfie' as any)}
                  style={{ display: 'none' }}
                />
                <button
                  onClick={() => document.getElementById('selfie-input')?.click()}
                  style={{
                    width: '100%',
                    padding: '48px',
                    backgroundColor: '#f3f4f6',
                    border: '2px dashed #d1d5db',
                    borderRadius: '8px',
                    cursor: 'pointer',
                    fontSize: '16px',
                    color: '#6b7280'
                  }}
                >
                  📷 {t.identityVerification.takeSelfie}
                </button>
              </div>
            )}
          </div>

          {error && (
            <div style={{
              padding: '12px',
              backgroundColor: '#fee2e2',
              color: '#dc2626',
              borderRadius: '8px',
              marginBottom: '20px',
              fontSize: '14px'
            }}>
              {error}
            </div>
          )}

          <div style={{ display: 'flex', gap: '10px' }}>
            <button
              onClick={() => setStep(2)}
              disabled={loading}
              style={{
                flex: 1,
                padding: '14px',
                backgroundColor: '#e5e7eb',
                color: '#374151',
                border: 'none',
                borderRadius: '8px',
                fontSize: '16px',
                fontWeight: '600',
                cursor: 'pointer'
              }}
            >
              {t.identityVerification.back}
            </button>
            <button
              onClick={handleSubmit}
              disabled={!selfie || loading}
              style={{
                flex: 1,
                padding: '14px',
                backgroundColor: '#10b981',
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                fontSize: '16px',
                fontWeight: '600',
                cursor: 'pointer',
                opacity: (!selfie || loading) ? 0.5 : 1
              }}
            >
              {loading ? t.identityVerification.submitting : t.identityVerification.submit}
            </button>
          </div>
        </div>
      )}

      {onSkip && step === 1 && (
        <button
          onClick={onSkip}
          style={{
            width: '100%',
            marginTop: '10px',
            padding: '12px',
            backgroundColor: 'transparent',
            color: '#6b7280',
            border: 'none',
            cursor: 'pointer',
            fontSize: '14px'
          }}
        >
          {t.identityVerification.skipForNow}
        </button>
      )}
    </div>
  );
}
