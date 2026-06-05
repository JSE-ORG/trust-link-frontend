import React, { useState, useCallback } from 'react';

// Types
interface DisputeFormData {
  // Step 1: Personal Info
  name: string;
  email: string;
  orderNumber: string;
  
  // Step 2: Dispute Details
  reason: string;
  description: string;
  
  // Step 3: Evidence
  files: File[];
  
  // Additional
  agreeToTerms: boolean;
}

interface DisputeFormProps {
  onSubmit?: (data: DisputeFormData) => Promise<void>;
  apiEndpoint?: string;
  onSuccess?: (response: any) => void;
  onError?: (error: Error) => void;
}

type Step = 1 | 2 | 3 | 4;

const DisputeForm: React.FC<DisputeFormProps> = ({ 
  onSubmit, 
  apiEndpoint = '/api/dispute',
  onSuccess,
  onError 
}) => {
  const [currentStep, setCurrentStep] = useState<Step>(1);
  const [formData, setFormData] = useState<DisputeFormData>({
    name: '',
    email: '',
    orderNumber: '',
    reason: '',
    description: '',
    files: [],
    agreeToTerms: false
  });
  const [errors, setErrors] = useState<Partial<Record<keyof DisputeFormData, string>>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitStatus, setSubmitStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [submitMessage, setSubmitMessage] = useState('');

  // Validation functions
  const validateStep1 = useCallback((): boolean => {
    const newErrors: Partial<Record<keyof DisputeFormData, string>> = {};
    
    if (!formData.name.trim()) {
      newErrors.name = 'Name is required';
    }
    if (!formData.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Email is invalid';
    }
    if (!formData.orderNumber.trim()) {
      newErrors.orderNumber = 'Order number is required';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }, [formData]);

  const validateStep2 = useCallback((): boolean => {
    const newErrors: Partial<Record<keyof DisputeFormData, string>> = {};
    
    if (!formData.reason) {
      newErrors.reason = 'Reason is required';
    }
    if (!formData.description.trim()) {
      newErrors.description = 'Description is required';
    } else if (formData.description.length < 20) {
      newErrors.description = 'Description must be at least 20 characters';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }, [formData]);

  const validateStep3 = useCallback((): boolean => {
    const newErrors: Partial<Record<keyof DisputeFormData, string>> = {};
    
    if (formData.files.length === 0) {
      newErrors.files = 'Please upload at least one file as evidence';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }, [formData]);

  const validateStep4 = useCallback((): boolean => {
    const newErrors: Partial<Record<keyof DisputeFormData, string>> = {};
    
    if (!formData.agreeToTerms) {
      newErrors.agreeToTerms = 'You must agree to the terms';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }, [formData]);

  // Navigation handlers
  const handleNext = useCallback(() => {
    let isValid = false;
    
    switch (currentStep) {
      case 1:
        isValid = validateStep1();
        break;
      case 2:
        isValid = validateStep2();
        break;
      case 3:
        isValid = validateStep3();
        break;
      case 4:
        isValid = validateStep4();
        break;
    }
    
    if (isValid && currentStep < 4) {
      setCurrentStep((prev) => (prev + 1) as Step);
      setErrors({});
    }
  }, [currentStep, validateStep1, validateStep2, validateStep3, validateStep4]);

  const handleBack = useCallback(() => {
    if (currentStep > 1) {
      setCurrentStep((prev) => (prev - 1) as Step);
      setErrors({});
    }
  }, [currentStep]);

  // Form field updates
  const updateField = useCallback(<K extends keyof DisputeFormData>(
    field: K,
    value: DisputeFormData[K]
  ) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // Clear error for this field when user types
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: undefined }));
    }
  }, [errors]);

  // File upload handler
  const handleFileUpload = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    const validFiles = files.filter(file => {
      const validTypes = ['image/jpeg', 'image/png', 'image/jpg', 'application/pdf'];
      const maxSize = 5 * 1024 * 1024; // 5MB
      return validTypes.includes(file.type) && file.size <= maxSize;
    });
    
    updateField('files', [...formData.files, ...validFiles]);
  }, [formData.files, updateField]);

  const removeFile = useCallback((index: number) => {
    const newFiles = formData.files.filter((_, i) => i !== index);
    updateField('files', newFiles);
  }, [formData.files, updateField]);

  // Submit handler
  const handleSubmit = useCallback(async () => {
    if (!validateStep4()) return;
    
    setIsSubmitting(true);
    setSubmitStatus('idle');
    
    try {
      // Prepare payload
      const payload = {
        name: formData.name,
        email: formData.email,
        orderNumber: formData.orderNumber,
        reason: formData.reason,
        description: formData.description,
        files: formData.files.map(file => ({
          name: file.name,
          type: file.type,
          size: file.size
        })),
        submittedAt: new Date().toISOString()
      };
      
      // Use custom onSubmit if provided, otherwise use fetch
      if (onSubmit) {
        await onSubmit(formData);
      } else {
        const response = await fetch(apiEndpoint, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(payload),
        });
        
        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }
        
        const responseData = await response.json();
        
        if (onSuccess) {
          onSuccess(responseData);
        }
      }
      
      setSubmitStatus('success');
      setSubmitMessage('Your dispute has been submitted successfully!');
    } catch (error) {
      setSubmitStatus('error');
      setSubmitMessage(error instanceof Error ? error.message : 'Failed to submit dispute');
      if (onError && error instanceof Error) {
        onError(error);
      }
    } finally {
      setIsSubmitting(false);
    }
  }, [formData, onSubmit, apiEndpoint, onSuccess, onError, validateStep4]);

  // Reset form
  const resetForm = useCallback(() => {
    setFormData({
      name: '',
      email: '',
      orderNumber: '',
      reason: '',
      description: '',
      files: [],
      agreeToTerms: false
    });
    setCurrentStep(1);
    setErrors({});
    setSubmitStatus('idle');
    setSubmitMessage('');
  }, []);

  // Render step content
  const renderStep = () => {
    switch (currentStep) {
      case 1:
        return (
          <div className="step step-1" data-testid="step-1">
            <h2>Step 1: Personal Information</h2>
            <div className="form-group">
              <label htmlFor="name">
                Full Name *
              </label>
              <input
                id="name"
                type="text"
                value={formData.name}
                onChange={(e) => updateField('name', e.target.value)}
                aria-label="name"
                aria-invalid={!!errors.name}
                aria-describedby={errors.name ? "name-error" : undefined}
              />
              {errors.name && (
                <span id="name-error" className="error" role="alert">
                  {errors.name}
                </span>
              )}
            </div>
            
            <div className="form-group">
              <label htmlFor="email">
                Email Address *
              </label>
              <input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) => updateField('email', e.target.value)}
                aria-label="email"
                aria-invalid={!!errors.email}
                aria-describedby={errors.email ? "email-error" : undefined}
              />
              {errors.email && (
                <span id="email-error" className="error" role="alert">
                  {errors.email}
                </span>
              )}
            </div>
            
            <div className="form-group">
              <label htmlFor="orderNumber">
                Order Number *
              </label>
              <input
                id="orderNumber"
                type="text"
                value={formData.orderNumber}
                onChange={(e) => updateField('orderNumber', e.target.value)}
                aria-label="order number"
                aria-invalid={!!errors.orderNumber}
                aria-describedby={errors.orderNumber ? "orderNumber-error" : undefined}
              />
              {errors.orderNumber && (
                <span id="orderNumber-error" className="error" role="alert">
                  {errors.orderNumber}
                </span>
              )}
            </div>
          </div>
        );
        
      case 2:
        return (
          <div className="step step-2" data-testid="step-2">
            <h2>Step 2: Dispute Details</h2>
            <div className="form-group">
              <label htmlFor="reason">
                Reason for Dispute *
              </label>
              <select
                id="reason"
                value={formData.reason}
                onChange={(e) => updateField('reason', e.target.value)}
                aria-label="reason"
                aria-invalid={!!errors.reason}
                aria-describedby={errors.reason ? "reason-error" : undefined}
              >
                <option value="">Select a reason</option>
                <option value="product_not_received">Product not received</option>
                <option value="damaged_product">Damaged product</option>
                <option value="wrong_product">Wrong product received</option>
                <option value="defective_product">Defective product</option>
                <option value="billing_error">Billing error</option>
              </select>
              {errors.reason && (
                <span id="reason-error" className="error" role="alert">
                  {errors.reason}
                </span>
              )}
            </div>
            
            <div className="form-group">
              <label htmlFor="description">
                Description *
              </label>
              <textarea
                id="description"
                value={formData.description}
                onChange={(e) => updateField('description', e.target.value)}
                rows={5}
                placeholder="Please provide detailed information about your dispute (minimum 20 characters)"
                aria-label="description"
                aria-invalid={!!errors.description}
                aria-describedby={errors.description ? "description-error" : undefined}
              />
              {errors.description && (
                <span id="description-error" className="error" role="alert">
                  {errors.description}
                </span>
              )}
              <small>{formData.description.length}/20 characters minimum</small>
            </div>
          </div>
        );
        
      case 3:
        return (
          <div className="step step-3" data-testid="step-3">
            <h2>Step 3: Upload Evidence</h2>
            <div className="form-group">
              <label htmlFor="files">
                Upload Supporting Documents *
              </label>
              <input
                id="files"
                type="file"
                multiple
                accept="image/jpeg,image/png,image/jpg,application/pdf"
                onChange={handleFileUpload}
                aria-label="upload files"
                aria-invalid={!!errors.files}
                aria-describedby={errors.files ? "files-error" : "files-hint"}
                data-testid="file-input"
              />
              <small id="files-hint">Accepted formats: JPEG, PNG, PDF (Max 5MB each)</small>
            </div>

            {formData.files.length > 0 && (
              <div className="file-list" data-testid="file-list">
                <h4>Uploaded Files:</h4>
                <ul>
                  {formData.files.map((file, index) => (
                    <li key={index} data-testid={`file-${index}`}>
                      {file.name} ({(file.size / 1024).toFixed(1)} KB)
                      <button
                        type="button"
                        onClick={() => removeFile(index)}
                        aria-label={`Delete ${file.name}`}
                        data-testid={`delete-file-${index}`}
                      >
                        Remove
                      </button>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {errors.files && (
              <span id="files-error" className="error" role="alert">
                {errors.files}
              </span>
            )}
          </div>
        );
        
      case 4:
        return (
          <div className="step step-4" data-testid="step-4">
            <h2>Step 4: Review & Submit</h2>
            <div className="review-section" data-testid="review-section">
              <h3>Personal Information</h3>
              <p><strong>Name:</strong> {formData.name}</p>
              <p><strong>Email:</strong> {formData.email}</p>
              <p><strong>Order Number:</strong> {formData.orderNumber}</p>
              
              <h3>Dispute Details</h3>
              <p><strong>Reason:</strong> {formData.reason}</p>
              <p><strong>Description:</strong> {formData.description}</p>
              
              <h3>Evidence</h3>
              <p><strong>Files:</strong> {formData.files.length} file(s) uploaded</p>
              <ul>
                {formData.files.map((file, index) => (
                  <li key={index}>{file.name}</li>
                ))}
              </ul>
              
              <div className="form-group">
                <label>
                  <input
                    type="checkbox"
                    id="agreeToTerms"
                    checked={formData.agreeToTerms}
                    onChange={(e) => updateField('agreeToTerms', e.target.checked)}
                    aria-label="agree to terms"
                    aria-invalid={!!errors.agreeToTerms}
                    aria-describedby={errors.agreeToTerms ? "agreeToTerms-error" : undefined}
                  />
                  I confirm that all information provided is accurate and complete *
                </label>
                {errors.agreeToTerms && (
                  <span id="agreeToTerms-error" className="error" role="alert">
                    {errors.agreeToTerms}
                  </span>
                )}
              </div>
            </div>
          </div>
        );
        
      default:
        return null;
    }
  };

  // Success state
  if (submitStatus === 'success') {
    return (
      <div className="dispute-form success-state" data-testid="success-state">
        <div className="success-message">
          <h2>✓ Dispute Submitted Successfully!</h2>
          <p>{submitMessage}</p>
          <p>We will review your dispute and get back to you within 3-5 business days.</p>
          <button 
            type="button" 
            onClick={resetForm}
            data-testid="new-dispute-button"
          >
            Submit Another Dispute
          </button>
        </div>
      </div>
    );
  }

  // Error state
  if (submitStatus === 'error') {
    return (
      <div className="dispute-form error-state" data-testid="error-state">
        <div className="error-message">
          <h2>✗ Submission Failed</h2>
          <p>{submitMessage}</p>
          <button 
            type="button" 
            onClick={() => setSubmitStatus('idle')}
            data-testid="try-again-button"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="dispute-form" data-testid="dispute-form">
      {/* Progress indicator */}
      <div className="progress-indicator" data-testid="progress-indicator">
        <div className={`step-indicator ${currentStep >= 1 ? 'active' : ''}`}>
          Step 1: Info
        </div>
        <div className={`step-indicator ${currentStep >= 2 ? 'active' : ''}`}>
          Step 2: Details
        </div>
        <div className={`step-indicator ${currentStep >= 3 ? 'active' : ''}`}>
          Step 3: Evidence
        </div>
        <div className={`step-indicator ${currentStep >= 4 ? 'active' : ''}`}>
          Step 4: Review
        </div>
      </div>
      
      {/* Form content */}
      <form onSubmit={(e) => e.preventDefault()}>
        {renderStep()}
        
        {/* Navigation buttons */}
        <div className="navigation-buttons">
          {currentStep > 1 && (
            <button
              type="button"
              onClick={handleBack}
              disabled={isSubmitting}
              data-testid="back-button"
            >
              Back
            </button>
          )}
          
          {currentStep < 4 ? (
            <button
              type="button"
              onClick={handleNext}
              disabled={isSubmitting}
              data-testid="next-button"
            >
              Next
            </button>
          ) : (
            <button
              type="button"
              onClick={handleSubmit}
              disabled={isSubmitting}
              data-testid="submit-button"
            >
              {isSubmitting ? 'Submitting...' : 'Submit Dispute'}
            </button>
          )}
        </div>
      </form>
      
      <style jsx>{`
        .dispute-form {
          max-width: 600px;
          margin: 0 auto;
          padding: 20px;
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, sans-serif;
        }
        
        .progress-indicator {
          display: flex;
          justify-content: space-between;
          margin-bottom: 30px;
          padding-bottom: 10px;
          border-bottom: 2px solid #e0e0e0;
        }
        
        .step-indicator {
          flex: 1;
          text-align: center;
          padding: 10px;
          color: #999;
          font-size: 14px;
        }
        
        .step-indicator.active {
          color: #4CAF50;
          font-weight: bold;
        }
        
        .form-group {
          margin-bottom: 20px;
        }
        
        label {
          display: block;
          margin-bottom: 5px;
          font-weight: 500;
        }
        
        input, select, textarea {
          width: 100%;
          padding: 10px;
          border: 1px solid #ddd;
          border-radius: 4px;
          font-size: 16px;
        }
        
        input:focus, select:focus, textarea:focus {
          outline: none;
          border-color: #4CAF50;
        }
        
        .error {
          color: #f44336;
          font-size: 14px;
          margin-top: 5px;
          display: block;
        }
        
        small {
          color: #666;
          font-size: 12px;
        }
        
        .file-list {
          margin-top: 15px;
          padding: 10px;
          background: #f5f5f5;
          border-radius: 4px;
        }
        
        .file-list ul {
          list-style: none;
          padding: 0;
        }
        
        .file-list li {
          padding: 5px 0;
          display: flex;
          justify-content: space-between;
          align-items: center;
        }
        
        .file-list button {
          background: #f44336;
          color: white;
          border: none;
          padding: 5px 10px;
          border-radius: 4px;
          cursor: pointer;
        }
        
        .review-section {
          background: #f9f9f9;
          padding: 20px;
          border-radius: 8px;
          margin-bottom: 20px;
        }
        
        .review-section h3 {
          margin-top: 0;
          color: #333;
        }
        
        .navigation-buttons {
          display: flex;
          justify-content: space-between;
          margin-top: 30px;
        }
        
        .navigation-buttons button {
          padding: 10px 20px;
          background: #4CAF50;
          color: white;
          border: none;
          border-radius: 4px;
          cursor: pointer;
          font-size: 16px;
        }
        
        .navigation-buttons button:hover {
          background: #45a049;
        }
        
        .navigation-buttons button:disabled {
          background: #ccc;
          cursor: not-allowed;
        }
        
        .success-state, .error-state {
          text-align: center;
          padding: 40px;
        }
        
        .success-message {
          color: #4CAF50;
        }
        
        .error-message {
          color: #f44336;
        }
        
        .success-state button, .error-state button {
          margin-top: 20px;
          padding: 10px 20px;
          background: #4CAF50;
          color: white;
          border: none;
          border-radius: 4px;
          cursor: pointer;
        }
        
        @media (max-width: 768px) {
          .dispute-form {
            padding: 10px;
          }
          
          .step-indicator {
            font-size: 10px;
            padding: 5px;
          }
          
          .navigation-buttons button {
            padding: 8px 16px;
          }
        }
      `}</style>
    </div>
  );
};

export default DisputeForm;