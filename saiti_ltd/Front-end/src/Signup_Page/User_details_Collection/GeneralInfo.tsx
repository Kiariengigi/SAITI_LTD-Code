// components/GeneralInfo.tsx
// ================================================================
// Fixes:
//   1. Default role is now empty — user must actively choose
//   2. handleRoleChange no longer wipes data the user already typed
//      when they merely re-focus the dropdown
//   3. Required validation before allowing Next
// ================================================================

import { useRef, useState } from 'react';
import { Form, Button, Alert } from "react-bootstrap";
import { uploadImageToCloudinary } from '../../api/cloudinary';

const GeneralInfo = ({ formData, setFormData, onNext }: any) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [validationError, setValidationError] = useState<string | null>(null);
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);

  const handleFileChange = async (file: File | undefined) => {
    if (file) {
      setUploadingLogo(true);
      setUploadError(null);

      try {
        const upload = await uploadImageToCloudinary(file, "saiti/business-logos");
        setFormData((prev: any) => ({ ...prev, business_logo: upload.secureUrl }));
      } catch (error) {
        setUploadError(error instanceof Error ? error.message : "Failed to upload logo.");
      } finally {
        setUploadingLogo(false);
      }
    }
  };

  const removeLogo = (e: React.MouseEvent) => {
    e.stopPropagation();
    setFormData((prev: any) => ({ ...prev, business_logo: '' }));
    setUploadError(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      void handleFileChange(e.dataTransfer.files[0]);
    }
  };

  // ── FIX: Only reset role-specific fields when the role actually changes ──
  // Previously this ran even when the user just clicked the dropdown,
  // wiping data they had already typed.
  const handleRoleChange = (newRole: string) => {
    if (newRole === formData.role_type) return; // role didn't change — do nothing

    setFormData({
      ...formData,
      role_type: newRole,
      // Only clear role-specific fields, not shared ones like location or phone
      companyName:     '',
      businessName:    '',
      industryType:    '',
      ProductionScope: '',
      Scope:           '',
      description:     '',
    });

    setValidationError(null);
  };

  // ── Validate before advancing to step 2 ─────────────────────────────────
  const handleNext = () => {
    // FIX: Require the user to explicitly select a role
    if (!formData.role_type) {
      setValidationError('Please select a business role to continue.');
      return;
    }

    if (formData.role_type === 'producer') {
      if (!formData.companyName?.trim()) {
        setValidationError('Company name is required.');
        return;
      }
      if (!formData.ProductionScope) {
        setValidationError('Production scope is required.');
        return;
      }
    }

    if (formData.role_type === 'wholesaler') {
      if (!formData.companyName?.trim()) {
        setValidationError('Company name is required.');
        return;
      }
    }

    if (formData.role_type === 'merchant') {
      if (!formData.businessName?.trim()) {
        setValidationError('Business name is required.');
        return;
      }
    }

    setValidationError(null);
    onNext();
  };

  const isProducer   = formData.role_type === 'producer';
  const isWholesaler = formData.role_type === 'wholesaler';
  const isMerchant   = formData.role_type === 'merchant';

  return (
    <>
      <h3 className="fw-bold mb-4">Business Information</h3>

      {validationError && (
        <Alert variant="danger" onClose={() => setValidationError(null)} dismissible>
          {validationError}
        </Alert>
      )}

      {uploadError && (
        <Alert variant="danger" onClose={() => setUploadError(null)} dismissible>
          {uploadError}
        </Alert>
      )}

      {/* ── FIX: Default is empty so user must actively choose ── */}
      <Form.Group className="mb-4">
        <Form.Label className="fw-bold">
          Business Role <span className="text-danger">*</span>
        </Form.Label>
        <Form.Select
          value={formData.role_type}
          onChange={(e) => handleRoleChange(e.target.value)}
          required
          isInvalid={!formData.role_type && !!validationError}
        >
          {/* FIX: Empty default forces an explicit selection */}
          <option value="">— Select your role —</option>
          <option value="merchant">Merchant</option>
          <option value="producer">Producer</option>
          <option value="wholesaler">Wholesaler</option>
        </Form.Select>
        <Form.Control.Feedback type="invalid">
          Please select a business role.
        </Form.Control.Feedback>
      </Form.Group>

      {/* Producer Fields */}
      {isProducer && (
        <>
          <Form.Group className="mb-3">
            <Form.Label className="fw-bold">Company Name <span className="text-danger">*</span></Form.Label>
            <Form.Control
              type="text"
              placeholder="Enter company name"
              value={formData.companyName}
              onChange={(e) => setFormData({ ...formData, companyName: e.target.value })}
              required
            />
          </Form.Group>

          <Form.Group className="mb-3">
            <Form.Label className="fw-bold">Industry Type</Form.Label>
            <Form.Control
              type="text"
              placeholder="e.g., Dairy, Beverages, Grains"
              value={formData.industryType}
              onChange={(e) => setFormData({ ...formData, industryType: e.target.value })}
            />
          </Form.Group>

          <Form.Group className="mb-3">
            <Form.Label className="fw-bold">Production Scope <span className="text-danger">*</span></Form.Label>
            <Form.Select
              value={formData.ProductionScope}
              onChange={(e) => setFormData({ ...formData, ProductionScope: e.target.value })}
              required
            >
              <option value="">Select production scale</option>
              <option value="Very_Large">Very Large Scale</option>
              <option value="Large">Large Scale</option>
              <option value="Medium">Medium Scale</option>
              <option value="Small">Small Scale</option>
            </Form.Select>
          </Form.Group>

          <Form.Group className="mb-3">
            <Form.Label className="fw-bold">Description</Form.Label>
            <Form.Control
              as="textarea"
              rows={3}
              placeholder="Brief description of your business"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            />
          </Form.Group>
        </>
      )}

      {/* Wholesaler Fields */}
      {isWholesaler && (
        <>
          <Form.Group className="mb-3">
            <Form.Label className="fw-bold">Company Name <span className="text-danger">*</span></Form.Label>
            <Form.Control
              type="text"
              placeholder="Enter company name"
              value={formData.companyName}
              onChange={(e) => setFormData({ ...formData, companyName: e.target.value })}
              required
            />
          </Form.Group>

          <Form.Group className="mb-3">
            <Form.Label className="fw-bold">Industry Type</Form.Label>
            <Form.Control
              type="text"
              placeholder="e.g., Food & Beverage, FMCG"
              value={formData.industryType}
              onChange={(e) => setFormData({ ...formData, industryType: e.target.value })}
            />
          </Form.Group>

          <Form.Group className="mb-3">
            <Form.Label className="fw-bold">Distribution Scope</Form.Label>
            <Form.Select
              value={formData.Scope}
              onChange={(e) => setFormData({ ...formData, Scope: e.target.value })}
            >
              <option value="">Select distribution scope</option>
              <option value="KM10">Within 10 km</option>
              <option value="KM50">Within 50 km</option>
              <option value="KM100">Within 100 km</option>
              <option value="KM200">Within 200 km</option>
              <option value="KM250">Within 250 km</option>
            </Form.Select>
          </Form.Group>
        </>
      )}

      {/* Merchant Fields */}
      {isMerchant && (
        <>
          <Form.Group className="mb-3">
            <Form.Label className="fw-bold">Business Name <span className="text-danger">*</span></Form.Label>
            <Form.Control
              type="text"
              placeholder="Enter business name"
              value={formData.businessName}
              onChange={(e) => setFormData({ ...formData, businessName: e.target.value })}
              required
            />
          </Form.Group>

          <Form.Group className="mb-3">
            <Form.Label className="fw-bold">Industry Type</Form.Label>
            <Form.Control
              type="text"
              placeholder="e.g., Retail, Kiosk"
              value={formData.industryType}
              onChange={(e) => setFormData({ ...formData, industryType: e.target.value })}
            />
          </Form.Group>
        </>
      )}

      {/* Logo Upload */}
      <Form.Group className="mb-4">
        <Form.Label className="fw-bold">Business Logo</Form.Label>
        <div
          className="border rounded-4 p-4 text-center bg-light mb-4 position-relative"
          style={{ cursor: uploadingLogo ? 'wait' : 'pointer', borderStyle: 'dashed' }}
          onClick={() => {
            if (!uploadingLogo) {
              fileInputRef.current?.click();
            }
          }}
          onDragOver={handleDragOver}
          onDrop={handleDrop}
        >
          {formData.business_logo && (
            <button
              type="button"
              className="btn-close position-absolute top-0 end-0 m-3"
              aria-label="Remove logo"
              onClick={removeLogo}
              style={{ zIndex: 10 }}
            />
          )}
          {formData.business_logo ? (
            <div className="d-flex flex-column align-items-center gap-2">
              <img
                src={formData.business_logo}
                alt="Business logo preview"
                style={{ width: 88, height: 88, objectFit: 'cover', borderRadius: 18, border: '1px solid #dee2e6' }}
              />
              <p className="mb-0 fw-semibold">
                {uploadingLogo ? "Uploading logo..." : "Logo uploaded. Click to replace."}
              </p>
            </div>
          ) : (
            <>
              <i className="bi bi-cloud-arrow-up fs-2 text-warning" />
              <p className="mb-0 mt-2 fw-bold">
                {uploadingLogo ? "Uploading logo..." : "Click or drag to upload business logo"}
              </p>
            </>
          )}
          <input
            type="file"
            ref={fileInputRef}
            className="d-none"
            accept="image/*"
            onChange={(e) => void handleFileChange(e.target.files?.[0])}
          />
        </div>
      </Form.Group>

      <Button variant="warning" className="w-100 rounded-pill" onClick={handleNext}>
        Next
      </Button>
    </>
  );
};

export default GeneralInfo;