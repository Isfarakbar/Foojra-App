import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import './ShopRegistrationScreen.css';

const ShopRegistrationScreen = () => {
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [formData, setFormData] = useState({
    // Basic Information
    name: '',
    description: '',
    phone: '',
    cuisine: '',
    category: 'restaurant',
    
    // Address Information
    address: {
      street: '',
      area: '',
      city: 'Gojra',
      postalCode: '',
      coordinates: { lat: 32.5734, lng: 72.3261 } // Gojra coordinates
    },
    
    // Business Information
    businessInfo: {
      businessName: '',
      businessType: 'Restaurant',
      ownerName: '',
      ownerCNIC: '',
      taxNumber: ''
    },
    
    // Operating Hours
    operatingHours: {
      monday: { open: '09:00', close: '22:00', isClosed: false },
      tuesday: { open: '09:00', close: '22:00', isClosed: false },
      wednesday: { open: '09:00', close: '22:00', isClosed: false },
      thursday: { open: '09:00', close: '22:00', isClosed: false },
      friday: { open: '09:00', close: '22:00', isClosed: false },
      saturday: { open: '09:00', close: '22:00', isClosed: false },
      sunday: { open: '10:00', close: '21:00', isClosed: false }
    },
    
    // Delivery Information
    deliveryInfo: {
      deliveryFee: 50,
      freeDeliveryThreshold: 500,
      estimatedDeliveryTime: { min: 30, max: 60 },
      deliveryAreas: [
        { area: 'City Center', additionalFee: 0 },
        { area: 'Satellite Town', additionalFee: 20 },
        { area: 'Model Town', additionalFee: 30 }
      ],
      acceptsOnlinePayment: true,
      acceptsCashOnDelivery: true
    },
    
    // Features
    features: {
      hasTableBooking: false,
      hasPickup: true,
      hasDelivery: true,
      acceptsPreOrders: false
    },
    
    // Social Media
    socialMedia: {
      facebook: '',
      instagram: '',
      whatsapp: ''
    }
  });
  const [files, setFiles] = useState({
    shopImages: [],
    shopLogo: null,
    businessLicense: null
  });

  const cuisineOptions = [
    'Pakistani', 'Fast Food', 'Chinese', 'Italian', 'Continental',
    'Desi', 'BBQ', 'Seafood', 'Vegetarian', 'Desserts', 'Beverages'
  ];

  const categoryOptions = [
    { value: 'restaurant', label: 'Restaurant' },
    { value: 'fast_food', label: 'Fast Food' },
    { value: 'cafe', label: 'Cafe' },
    { value: 'bakery', label: 'Bakery' },
    { value: 'grocery', label: 'Grocery Store' },
    { value: 'pharmacy', label: 'Pharmacy' }
  ];

  const businessTypeOptions = [
    { value: 'Restaurant', label: 'Restaurant' },
    { value: 'Fast Food', label: 'Fast Food' },
    { value: 'Cafe', label: 'Cafe' },
    { value: 'Bakery', label: 'Bakery' },
    { value: 'Grocery Store', label: 'Grocery Store' },
    { value: 'Pharmacy', label: 'Pharmacy' },
    { value: 'Others', label: 'Others' }
  ];

  const gojraAreas = [
    'City Center', 'Satellite Town', 'Model Town', 'Civil Lines',
    'Jhang Road', 'Faisalabad Road', 'Railway Station Area',
    'Industrial Area', 'New City', 'Old City'
  ];

  useEffect(() => {
    // Check if user is logged in and is a shop owner
    const userInfoFromStorage = localStorage.getItem('userInfo')
      ? JSON.parse(localStorage.getItem('userInfo'))
      : null;

    if (!userInfoFromStorage) {
      navigate('/login');
      return;
    }

    if (userInfoFromStorage.role !== 'shopOwner') {
      navigate('/dashboard');
      return;
    }

    // Check if shop owner already has a shop
    const checkExistingShop = async () => {
      try {
        const response = await fetch('/api/shops/my-shop', {
          headers: {
            Authorization: `Bearer ${userInfoFromStorage.token}`,
          },
        });

        if (response.ok) {
          const data = await response.json();
          if (data.shop) {
            navigate('/shop-owner/dashboard');
          }
        }
      } catch (error) {
        setError('You already have a shop registered. Redirecting to dashboard...');
        setTimeout(() => {
          navigate('/shop-owner/dashboard');
        }, 2000);
      }
    };

    checkExistingShop();
  }, [navigate]);

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    
    if (name.includes('.')) {
      const [parent, child] = name.split('.');
      setFormData(prev => {
        const newData = {
          ...prev,
          [parent]: {
            ...prev[parent],
            [child]: type === 'checkbox' ? checked : value
          }
        };
        return newData;
      });
    } else {
      setFormData(prev => {
        const newData = {
          ...prev,
          [name]: type === 'checkbox' ? checked : value
        };
        return newData;
      });
    }
  };

  const handleNestedInputChange = (parent, child, value) => {
    setFormData(prev => ({
      ...prev,
      [parent]: {
        ...prev[parent],
        [child]: value
      }
    }));
  };

  const handleOperatingHoursChange = (day, field, value) => {
    setFormData(prev => ({
      ...prev,
      operatingHours: {
        ...prev.operatingHours,
        [day]: {
          ...prev.operatingHours[day],
          [field]: value
        }
      }
    }));
  };

  const handleFileChange = (e) => {
    const { name, files: selectedFiles } = e.target;
    
    if (name === 'shopImages') {
      // Validate image files
      const validFiles = Array.from(selectedFiles).filter(file => {
        const isValidType = file.type.startsWith('image/');
        const isValidSize = file.size <= 5 * 1024 * 1024; // 5MB limit
        
        if (!isValidType) {
          setError(`${file.name} is not a valid image file. Please upload PNG, JPG, or JPEG files only.`);
          return false;
        }
        if (!isValidSize) {
          setError(`${file.name} is too large. Please upload files smaller than 5MB.`);
          return false;
        }
        return true;
      });
      
      if (validFiles.length > 5) {
        setError('You can upload maximum 5 images only.');
        return;
      }
      
      setFiles(prev => ({
        ...prev,
        shopImages: validFiles
      }));
      setError(''); // Clear any previous errors
    } else if (name === 'shopLogo') {
      const file = selectedFiles[0];
      if (file) {
        // Validate PNG files only for logo
        if (!file.type.includes('png')) {
          setError('Shop logo must be a PNG file only.');
          return;
        }
        if (file.size > 2 * 1024 * 1024) { // 2MB limit for logo
          setError('Logo file is too large. Please upload files smaller than 2MB.');
          return;
        }
      }
      setFiles(prev => ({
        ...prev,
        [name]: file
      }));
      setError(''); // Clear any previous errors
    } else if (name === 'businessLicense') {
      const file = selectedFiles[0];
      if (file) {
        // Validate PDF files only for business license
        if (!file.type.includes('pdf')) {
          setError('Business license must be a PDF file only.');
          return;
        }
        if (file.size > 10 * 1024 * 1024) { // 10MB limit for PDF
          setError('Business license file is too large. Please upload files smaller than 10MB.');
          return;
        }
      }
      setFiles(prev => ({
        ...prev,
        [name]: file
      }));
      setError(''); // Clear any previous errors
    }
  };

  // Step validation functions
  const validateStep1 = () => {
    const errors = [];
    if (!formData.name.trim()) errors.push('Shop name is required');
    if (!formData.description.trim()) errors.push('Shop description is required');
    if (!formData.phone.trim()) errors.push('Phone number is required');
    
    // Validate phone number format (Pakistani mobile numbers)
    const phonePattern = /^(\+92|0)?3\d{9}$/;
    if (formData.phone && !phonePattern.test(formData.phone.replace(/[\s-]/g, ''))) {
      errors.push('Please provide a valid Pakistani mobile number (e.g., 03XX-XXXXXXX)');
    }
    
    if (!formData.cuisine) errors.push('Cuisine type is required');
    if (!formData.address.street.trim()) errors.push('Street address is required');
    if (!formData.address.area) errors.push('Area selection is required');
    
    if (errors.length > 0) {
      setError('Please fix the following errors:\n• ' + errors.join('\n• '));
      return false;
    }
    return true;
  };

  const validateStep2 = () => {
    const errors = [];
    if (!formData.businessInfo.businessName.trim()) errors.push('Business name is required');
    if (!formData.businessInfo.ownerName.trim()) errors.push('Owner name is required');
    if (!formData.businessInfo.ownerCNIC.trim()) errors.push('Owner CNIC is required');
    
    // CNIC format validation (13 digits)
    const cnicPattern = /^\d{5}-\d{7}-\d{1}$/;
    if (formData.businessInfo.ownerCNIC && !cnicPattern.test(formData.businessInfo.ownerCNIC)) {
      errors.push('CNIC format should be: 12345-1234567-1');
    }
    
    if (errors.length > 0) {
      setError('Please fix the following errors:\n• ' + errors.join('\n• '));
      return false;
    }
    return true;
  };

  const validateStep3 = () => {
    // Operating hours validation - at least one day should be open
    const hasOpenDay = Object.values(formData.operatingHours).some(day => !day.isClosed);
    if (!hasOpenDay) {
      setError('Your shop must be open at least one day of the week.');
      return false;
    }
    return true;
  };

  const validateStep4 = () => {
    const errors = [];
    if (formData.deliveryInfo.deliveryFee < 0) errors.push('Delivery fee cannot be negative');
    if (formData.deliveryInfo.freeDeliveryThreshold < 0) errors.push('Free delivery threshold cannot be negative');
    if (formData.deliveryInfo.estimatedDeliveryTime.min >= formData.deliveryInfo.estimatedDeliveryTime.max) {
      errors.push('Minimum delivery time must be less than maximum delivery time');
    }
    
    if (errors.length > 0) {
      setError('Please fix the following errors:\n• ' + errors.join('\n• '));
      return false;
    }
    return true;
  };

  const validateStep5 = () => {
    const errors = [];
    if (files.shopImages.length === 0) errors.push('At least one shop image is required');
    
    if (errors.length > 0) {
      setError('Please fix the following errors:\n• ' + errors.join('\n• '));
      return false;
    }
    return true;
  };

  const nextStep = () => {
    setError(''); // Clear previous errors
    
    // Validate current step before proceeding
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
      case 5:
        isValid = validateStep5();
        break;
      default:
        isValid = true;
    }
    
    if (isValid) {
      // Show confirmation dialog before proceeding
      const confirmMessage = getStepConfirmationMessage(currentStep);
      if (window.confirm(confirmMessage)) {
        setCurrentStep(prev => prev + 1);
        setSuccess('Step completed successfully! Moving to next section...');
        setTimeout(() => setSuccess(''), 2000);
      }
    }
  };

  const getStepConfirmationMessage = (step) => {
    switch (step) {
      case 1:
        return `Please confirm your basic information:\n\nShop Name: ${formData.name}\nDescription: ${formData.description}\nPhone: ${formData.phone}\nCuisine: ${formData.cuisine}\n\nIs this information correct?`;
      case 2:
        return `Please confirm your business details:\n\nBusiness Name: ${formData.businessInfo.businessName}\nBusiness Type: ${formData.businessInfo.businessType}\nOwner Name: ${formData.businessInfo.ownerName}\nCNIC: ${formData.businessInfo.ownerCNIC}\n\nIs this information correct?`;
      case 3:
        return `Please confirm your operating hours:\n\nAt least one day is open for business.\n\nIs this information correct?`;
      case 4:
        return `Please confirm your delivery settings:\n\nDelivery Fee: Rs. ${formData.deliveryInfo.deliveryFee}\nFree Delivery Threshold: Rs. ${formData.deliveryInfo.freeDeliveryThreshold}\n\nIs this information correct?`;
      case 5:
        return `Please confirm your uploaded files:\n\nShop Images: ${files.shopImages?.length || 0} files\nShop Logo: ${files.shopLogo ? 'Uploaded' : 'Not uploaded'}\nBusiness License: ${files.businessLicense ? 'Uploaded' : 'Not uploaded (Optional)'}\n\nProceed with registration?`;
      default:
        return 'Are you sure you want to proceed?';
    }
  };

  const prevStep = () => {
    setError(''); // Clear errors when going back
    setCurrentStep(prev => prev - 1);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');

    try {
      // Validate required fields
      if (!formData.name || !formData.description || !formData.phone || !formData.cuisine) {
        throw new Error('Please fill in all required fields: name, description, phone, and cuisine');
      }

      // Validate address fields
      if (!formData.address.street || !formData.address.area) {
        throw new Error('Please fill in all required address fields: street and area');
      }

      if (!formData.businessInfo.businessName || !formData.businessInfo.ownerName) {
        throw new Error('Please fill in all business information fields');
      }

      if (files.shopImages.length === 0) {
        throw new Error('Please upload at least one shop image');
      }

      const userInfo = localStorage.getItem('userInfo');
      if (!userInfo) {
        throw new Error('Please login to continue');
      }

      const token = JSON.parse(userInfo).token;
      if (!token) {
        throw new Error('Authentication token not found. Please login again.');
      }
      
      const formDataToSend = new FormData();

      // Add text data
      formDataToSend.append('name', formData.name);
      formDataToSend.append('description', formData.description);
      formDataToSend.append('phone', formData.phone);
      formDataToSend.append('cuisine', formData.cuisine);
      formDataToSend.append('category', formData.category);
      formDataToSend.append('address', JSON.stringify(formData.address));
      formDataToSend.append('businessInfo', JSON.stringify(formData.businessInfo));
      formDataToSend.append('operatingHours', JSON.stringify(formData.operatingHours));
      formDataToSend.append('deliveryInfo', JSON.stringify(formData.deliveryInfo));
      formDataToSend.append('features', JSON.stringify(formData.features));
      formDataToSend.append('socialMedia', JSON.stringify(formData.socialMedia));

      // Add files
      if (files.shopImages.length > 0) {
        files.shopImages.forEach(file => {
          formDataToSend.append('shopImage', file);
        });
      }
      
      if (files.shopLogo) {
        formDataToSend.append('shopLogo', files.shopLogo);
      }
      
      if (files.businessLicense) {
        formDataToSend.append('businessLicense', files.businessLicense);
      }

      const response = await fetch('/api/shops/register', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: formDataToSend
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: 'Network error occurred' }));
        throw new Error(errorData.message || `Server error: ${response.status}`);
      }

      await response.json();

      setSuccess('Shop registration submitted successfully! Please wait for admin approval.');
      setTimeout(() => {
        navigate('/shop-owner/dashboard');
      }, 2000);
    } catch (error) {
      if (error.name === 'TypeError' && error.message.includes('fetch')) {
        setError('Network error: Unable to connect to server. Please check your internet connection and try again.');
      } else {
        setError(error.message || 'Registration failed. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  const renderStepIndicator = () => (
    <div className="step-indicator">
      {[1, 2, 3, 4, 5].map(step => (
        <div 
          key={step} 
          className={`step ${currentStep >= step ? 'active' : ''}`}
        >
          <div className="step-number">{step}</div>
          <div className="step-label">
            {step === 1 && 'Basic Info'}
            {step === 2 && 'Business Details'}
            {step === 3 && 'Operating Hours'}
            {step === 4 && 'Delivery & Features'}
            {step === 5 && 'Images & Documents'}
          </div>
        </div>
      ))}
    </div>
  );

  const renderStep1 = () => (
    <div className="form-step">
      <h3>Basic Information</h3>
      
      <div className="form-group">
        <label>Shop Name *</label>
        <input
          type="text"
          name="name"
          value={formData.name}
          onChange={handleInputChange}
          required
          placeholder="Enter your shop name"
        />
      </div>

      <div className="form-group">
        <label>Description *</label>
        <textarea
          name="description"
          value={formData.description}
          onChange={handleInputChange}
          required
          placeholder="Describe your shop and what you offer"
          rows="4"
        />
      </div>

      <div className="form-row">
        <div className="form-group">
          <label>Phone Number *</label>
          <input
            type="tel"
            name="phone"
            value={formData.phone}
            onChange={handleInputChange}
            required
            placeholder="03XX-XXXXXXX"
          />
        </div>

        <div className="form-group">
          <label>Category *</label>
          <select
            name="category"
            value={formData.category}
            onChange={handleInputChange}
            required
          >
            {categoryOptions.map(option => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="form-group">
        <label>Cuisine Type *</label>
        <select
          name="cuisine"
          value={formData.cuisine}
          onChange={handleInputChange}
          required
        >
          <option value="">Select cuisine type</option>
          {cuisineOptions.map(cuisine => (
            <option key={cuisine} value={cuisine}>{cuisine}</option>
          ))}
        </select>
      </div>

      <h4>Address Information</h4>
      
      <div className="form-group">
        <label>Street Address *</label>
        <input
          type="text"
          name="address.street"
          value={formData.address.street}
          onChange={handleInputChange}
          required
          placeholder="House/Shop number and street name"
        />
      </div>

      <div className="form-row">
        <div className="form-group">
          <label>Area *</label>
          <select
            name="address.area"
            value={formData.address.area}
            onChange={handleInputChange}
            required
          >
            <option value="">Select area</option>
            {gojraAreas.map(area => (
              <option key={area} value={area}>{area}</option>
            ))}
          </select>
        </div>

        <div className="form-group">
          <label>Postal Code</label>
          <input
            type="text"
            name="address.postalCode"
            value={formData.address.postalCode}
            onChange={handleInputChange}
            placeholder="35290"
          />
        </div>
      </div>
    </div>
  );

  const renderStep2 = () => (
    <div className="form-step">
      <h3>Business Details</h3>
      
      <div className="form-group">
        <label>Business Name *</label>
        <input
          type="text"
          name="businessInfo.businessName"
          value={formData.businessInfo.businessName}
          onChange={handleInputChange}
          required
          placeholder="Official business name"
        />
      </div>

      <div className="form-group">
        <label>Business Type *</label>
        <select
          name="businessInfo.businessType"
          value={formData.businessInfo.businessType}
          onChange={handleInputChange}
          required
        >
          {businessTypeOptions.map(option => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </div>

      <div className="form-row">
        <div className="form-group">
          <label>Owner Name *</label>
          <input
            type="text"
            name="businessInfo.ownerName"
            value={formData.businessInfo.ownerName}
            onChange={handleInputChange}
            required
            placeholder="Full name of owner"
          />
        </div>

        <div className="form-group">
          <label>Owner CNIC *</label>
          <input
            type="text"
            name="businessInfo.ownerCNIC"
            value={formData.businessInfo.ownerCNIC}
            onChange={handleInputChange}
            required
            placeholder="XXXXX-XXXXXXX-X"
          />
        </div>
      </div>

      <div className="form-group">
        <label>Tax Number (Optional)</label>
        <input
          type="text"
          name="businessInfo.taxNumber"
          value={formData.businessInfo.taxNumber}
          onChange={handleInputChange}
          placeholder="Business tax registration number"
        />
      </div>
    </div>
  );

  const renderStep3 = () => (
    <div className="form-step">
      <h3>Operating Hours</h3>
      
      <div className="operating-hours">
        {Object.keys(formData.operatingHours).map(day => (
          <div key={day} className="day-hours">
            <div className="day-name">
              {day.charAt(0).toUpperCase() + day.slice(1)}
            </div>
            
            <div className="hours-controls">
              <label>
                <input
                  type="checkbox"
                  checked={formData.operatingHours[day].isClosed}
                  onChange={(e) => handleOperatingHoursChange(day, 'isClosed', e.target.checked)}
                />
                Closed
              </label>
              
              {!formData.operatingHours[day].isClosed && (
                <>
                  <input
                    type="time"
                    value={formData.operatingHours[day].open}
                    onChange={(e) => handleOperatingHoursChange(day, 'open', e.target.value)}
                  />
                  <span>to</span>
                  <input
                    type="time"
                    value={formData.operatingHours[day].close}
                    onChange={(e) => handleOperatingHoursChange(day, 'close', e.target.value)}
                  />
                </>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  const renderStep4 = () => (
    <div className="form-step">
      <h3>Delivery Information & Features</h3>
      
      <div className="form-row">
        <div className="form-group">
          <label>Delivery Fee (PKR) *</label>
          <input
            type="number"
            value={formData.deliveryInfo.deliveryFee}
            onChange={(e) => handleNestedInputChange('deliveryInfo', 'deliveryFee', parseInt(e.target.value))}
            required
            min="0"
          />
        </div>

        <div className="form-group">
          <label>Free Delivery Threshold (PKR) *</label>
          <input
            type="number"
            value={formData.deliveryInfo.freeDeliveryThreshold}
            onChange={(e) => handleNestedInputChange('deliveryInfo', 'freeDeliveryThreshold', parseInt(e.target.value))}
            required
            min="0"
          />
        </div>
      </div>

      <div className="form-row">
        <div className="form-group">
          <label>Min Delivery Time (minutes)</label>
          <input
            type="number"
            value={formData.deliveryInfo.estimatedDeliveryTime.min}
            onChange={(e) => handleNestedInputChange('deliveryInfo', 'estimatedDeliveryTime', {
              ...formData.deliveryInfo.estimatedDeliveryTime,
              min: parseInt(e.target.value)
            })}
            min="15"
          />
        </div>

        <div className="form-group">
          <label>Max Delivery Time (minutes)</label>
          <input
            type="number"
            value={formData.deliveryInfo.estimatedDeliveryTime.max}
            onChange={(e) => handleNestedInputChange('deliveryInfo', 'estimatedDeliveryTime', {
              ...formData.deliveryInfo.estimatedDeliveryTime,
              max: parseInt(e.target.value)
            })}
            min="30"
          />
        </div>
      </div>

      <h4>Payment Methods</h4>
      <div className="checkbox-group">
        <label>
          <input
            type="checkbox"
            checked={formData.deliveryInfo.acceptsCashOnDelivery}
            onChange={(e) => handleNestedInputChange('deliveryInfo', 'acceptsCashOnDelivery', e.target.checked)}
          />
          Cash on Delivery
        </label>
        
        <label>
          <input
            type="checkbox"
            checked={formData.deliveryInfo.acceptsOnlinePayment}
            onChange={(e) => handleNestedInputChange('deliveryInfo', 'acceptsOnlinePayment', e.target.checked)}
          />
          Online Payment
        </label>
      </div>

      <h4>Features</h4>
      <div className="checkbox-group">
        <label>
          <input
            type="checkbox"
            checked={formData.features.hasDelivery}
            onChange={(e) => handleNestedInputChange('features', 'hasDelivery', e.target.checked)}
          />
          Home Delivery
        </label>
        
        <label>
          <input
            type="checkbox"
            checked={formData.features.hasPickup}
            onChange={(e) => handleNestedInputChange('features', 'hasPickup', e.target.checked)}
          />
          Pickup Available
        </label>
        
        <label>
          <input
            type="checkbox"
            checked={formData.features.hasTableBooking}
            onChange={(e) => handleNestedInputChange('features', 'hasTableBooking', e.target.checked)}
          />
          Table Booking
        </label>
        
        <label>
          <input
            type="checkbox"
            checked={formData.features.acceptsPreOrders}
            onChange={(e) => handleNestedInputChange('features', 'acceptsPreOrders', e.target.checked)}
          />
          Pre-Orders
        </label>
      </div>

      <h4>Social Media (Optional)</h4>
      <div className="form-group">
        <label>Facebook Page</label>
        <input
          type="url"
          value={formData.socialMedia.facebook}
          onChange={(e) => handleNestedInputChange('socialMedia', 'facebook', e.target.value)}
          placeholder="https://facebook.com/yourpage"
        />
      </div>

      <div className="form-group">
        <label>Instagram</label>
        <input
          type="url"
          value={formData.socialMedia.instagram}
          onChange={(e) => handleNestedInputChange('socialMedia', 'instagram', e.target.value)}
          placeholder="https://instagram.com/youraccount"
        />
      </div>

      <div className="form-group">
        <label>WhatsApp Number</label>
        <input
          type="tel"
          value={formData.socialMedia.whatsapp}
          onChange={(e) => handleNestedInputChange('socialMedia', 'whatsapp', e.target.value)}
          placeholder="03XX-XXXXXXX"
        />
      </div>
    </div>
  );

  const renderStep5 = () => (
    <div className="form-step">
      <h3>Images & Documents</h3>
      
      <div className="form-group">
        <label>Shop Images (PNG only) *</label>
        <input
          type="file"
          name="shopImages"
          onChange={handleFileChange}
          accept=".png"
          multiple
          required
        />
        <small>Upload high-quality images of your shop, food, and interior in PNG format only (max 5 images, 5MB each)</small>
      </div>

      <div className="form-group">
        <label>Shop Logo (PNG only)</label>
        <input
          type="file"
          name="shopLogo"
          onChange={handleFileChange}
          accept=".png"
        />
        <small>Upload your shop logo in PNG format only (recommended: square format, max 2MB)</small>
      </div>

      <div className="form-group">
        <label>Business License (PDF only - Optional)</label>
        <input
          type="file"
          name="businessLicense"
          onChange={handleFileChange}
          accept=".pdf"
        />
        <small>Upload your business license or registration document in PDF format only (max 10MB)</small>
      </div>

      {files.shopImages.length > 0 && (
        <div className="file-preview">
          <h4>Selected Images:</h4>
          <ul>
            {files.shopImages.map((file, index) => (
              <li key={index}>{file.name}</li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );

  return (
    <div className="shop-registration-screen">
      <div className="registration-container">
        <div className="registration-header">
          <h1>Register Your Shop</h1>
          <p>Join Foojra and start serving customers in Gojra</p>
        </div>

        {renderStepIndicator()}

        {error && (
          <div className="error-message">
            <p>{error}</p>
          </div>
        )}

        {success && (
          <div className="success-message">
            <p>{success}</p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="registration-form">
          {currentStep === 1 && renderStep1()}
          {currentStep === 2 && renderStep2()}
          {currentStep === 3 && renderStep3()}
          {currentStep === 4 && renderStep4()}
          {currentStep === 5 && renderStep5()}

          <div className="form-navigation">
            {currentStep > 1 && (
              <button type="button" onClick={prevStep} className="btn-secondary">
                Previous
              </button>
            )}
            
            {currentStep < 5 ? (
              <button type="button" onClick={nextStep} className="btn-primary">
                Next
              </button>
            ) : (
              <button type="submit" disabled={loading} className="btn-primary">
                {loading ? 'Submitting...' : 'Submit Registration'}
              </button>
            )}
          </div>
        </form>
      </div>
    </div>
  );
};

export default ShopRegistrationScreen;