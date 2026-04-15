import { useState } from 'react';
import { Container, Row, Col, Form } from 'react-bootstrap';
import axios from '../../api/axios';

import LocationandReach from './LocationandReach';

import GeneralInfo from './GeneralInfo';
import VerticalStepper from './VerticalStepper';

const spinStyle = document.createElement("style")
spinStyle.textContent = `@keyframes spin { to { transform: rotate(360deg); } }`
document.head.appendChild(spinStyle)

const User_Dt_Main = () => {

  const [step, setStep] = useState<number>(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    role_type: 'merchant',
    business_logo: '',
    location: '',
    phone_number: '',

    // Producer-specific
    companyName: '',
    industryType: '',
    ProductionScope: '',
    description: '',

    // Wholesaler-specific
    Scope: '',

    // Merchant-specific
    businessName: '',
  });

  const nextStep = () => setStep(prev => prev + 1);
  const prevStep = () => setStep(prev => prev - 1);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      // Validate required fields
      if (!formData.location || !formData.phone_number) {
        setError("Location and phone number are required");
        setLoading(false);
        return;
      }

      if (formData.role_type === 'producer') {
        if (!formData.companyName || !formData.ProductionScope) {
          setError("Company name and production scope are required");
          setLoading(false);
          return;
        }
      } else if (formData.role_type === 'wholesaler') {
        if (!formData.companyName) {
          setError("Company name is required");
          setLoading(false);
          return;
        }
      } else if (formData.role_type === 'merchant') {
        if (!formData.businessName) {
          setError("Business name is required");
          setLoading(false);
          return;
        }
      }

      console.log("📤 Sending profile data:", formData);

      // Submit profile data
      const response = await axios.post(
        'user/complete-profile',
        formData,
        {
          headers: { 'Content-Type': 'application/json' },
          withCredentials: true,
        }
      );

      console.log("✅ Profile submission successful:", response.data);

      // Success - redirect to dashboard or home
      setTimeout(() => {
        window.location.href = '/dashboard';
      }, 500);
    } catch (err: any) {
      console.error("❌ Profile completion failed:", err);
      console.error("Error response:", err.response?.data);
      console.error("Error status:", err.response?.status);
      setError(err.response?.data?.message || "Failed to complete profile");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Container fluid className="p-4 vh-100 overflow-hidden bg-white">
      <Row className="g-0 h-100 rounded-3">

        {/* LEFT PANEL */}
        <Col md={4} lg={3} style={{backgroundColor: '#FFF8DE'}} className="d-flex justify-content-center pt-5 rounded-start-4">
          <VerticalStepper currentStep={step} setStep={setStep} />
        </Col>

        {/* RIGHT PANEL */}
        <Col md={8} lg={9} className=" bg-light d-flex align-items-center justify-content-center px-5 overflow-auto rounded-end-4">
          <div className="w-100" style={{ maxWidth: '600px' }}>

            <Form onSubmit={handleSubmit}>

              {error && (
                <div className="alert alert-danger mb-3" role="alert">
                  {error}
                </div>
              )}

              {step === 1 && (
                <GeneralInfo
                  formData={formData}
                  setFormData={setFormData}
                  onNext={nextStep}
                />
              )}

              {step === 2 && (
                <>
                  <LocationandReach
                    apiKey={import.meta.env.VITE_GOOGLE_MAPS_API_KEY}
                    onBack={prevStep}
                    onChange={({ address }) => {
                      setFormData((prev) => ({ ...prev, location: address }));
                    }}
                    onPhoneChange={(phone) => {
                      setFormData((prev) => ({ ...prev, phone_number: phone }));
                    }}
                    mapHeight='420px'
                    isSubmitting={loading}
                  />
                </>
              )}

            </Form>

          </div>
        </Col>

      </Row>
    </Container>
  );
};

export default User_Dt_Main;