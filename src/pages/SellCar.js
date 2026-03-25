import React, { useState } from 'react';
import './SellCar.css';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { db, storage } from '../firebase/config';
import { getAuth } from 'firebase/auth';

function SellCar() {
  const [formData, setFormData] = useState({
    brand: '',
    model: '',
    year: '',
    price: '',
    mileage: '',
    type: '',
    description: '',
    sellerName: '',
    sellerEmail: '',
    sellerPhone: ''
  });

  const [imageFiles, setImageFiles] = useState([]);
const [imagePreviews, setImagePreviews] = useState([]);
  const [submitted, setSubmitted] = useState(false);
  const [uploading, setUploading] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleImageChange = (e) => {
  const files = Array.from(e.target.files); // Get all selected files
  
  // Check maximum 5 images
  if (files.length > 5) {
    alert('Maximum 5 images allowed');
    return;
  }

  // Validate each file
  const validFiles = files.filter(file => {
    // Check file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      alert(`${file.name} is too large (max 5MB)`);
      return false;
    }
    // Check file type
    if (!file.type.startsWith('image/')) {
      alert(`${file.name} is not an image`);
      return false;
    }
    return true;
  });

  // Save valid files
  setImageFiles(validFiles);

  // Create previews for all valid files
  const previews = validFiles.map(file => {
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result);
      reader.readAsDataURL(file);
    });
  });

  Promise.all(previews).then(setImagePreviews);
};

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (imageFiles.length === 0) {
  alert("Please select at least one image");
  return;
}

    try {
      setUploading(true);

      const uploadPromises = imageFiles.map(async (file, index) => {
        const imageRef = ref(storage, `cars/${Date.now()}_${index}_${file.name}`);
        await uploadBytes(imageRef, file);
        return await getDownloadURL(imageRef);
      });

      const imageUrls = await Promise.all(uploadPromises);

      const carData = {
        brand: formData.brand,
        model: formData.model,
        year: parseInt(formData.year),
        price: parseInt(formData.price),
        mileage: parseInt(formData.mileage),
        type: formData.type,
        description: formData.description,
        sellerName: formData.sellerName,
        sellerEmail: formData.sellerEmail,
        sellerPhone: formData.sellerPhone,
        imageUrl: imageUrls[0],
        images: imageUrls,
        status: 'available',
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      };

      const docRef = await addDoc(collection(db, 'cars'), carData);

      // Log Activity
      const auth = getAuth();
      await addDoc(collection(db, 'activity_logs'), {
        type: 'listing', action: 'create_sale_simple', severity: 'normal',
        userId: auth.currentUser?.uid || 'anonymous', userEmail: auth.currentUser?.email || formData.sellerEmail, timestamp: serverTimestamp(),
        details: { brand: formData.brand, model: formData.model, id: docRef.id }
      });

      // Show success message
      setSubmitted(true);

      // Reset after 3 seconds
      setTimeout(() => {
        setFormData({
  brand: '',
  model: '',
  year: '',
  price: '',
  mileage: '',
  type: '',
  description: '',
  sellerName: '',
  sellerEmail: '',
  sellerPhone: ''
});
setImageFiles([]);
setImagePreviews([]);
        setSubmitted(false);
      }, 3000);

    } catch (error) {
      console.error('❌ Upload failed:', error);
      console.error('Error code:', error.code);
      console.error('Error message:', error.message);
      
      if (error.code === 'storage/unauthorized') {
        alert('Upload failed: Please check Firebase Storage rules');
      } else {
        alert('Upload failed: ' + error.message);
      }
    } finally {
      setUploading(false);
    }
  };

  if (submitted) {
    return (
      <div className="sell-car">
        <div className="container">
          <div className="success-message">
            <div className="success-icon">✓</div>
            <h2>Listing Submitted Successfully!</h2>
            <p>Your car has been listed on RideMart. You can view it in the Buy Cars section.</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="sell-car">
      <div className="container">
        <div className="page-header">
          <h1>Sell Your Car</h1>
          <p>List your vehicle and reach thousands of potential buyers</p>
        </div>

        <form onSubmit={handleSubmit} className="sell-form">
          {/* Car Details Section */}
          <div className="form-section">
            <h2 className="section-title">Car Details</h2>
            
            <div className="form-row">
              <div className="form-group">
                <label htmlFor="brand">Brand *</label>
                <input
                  type="text"
                  id="brand"
                  name="brand"
                  value={formData.brand}
                  onChange={handleChange}
                  required
                  placeholder="e.g., Toyota"
                  disabled={uploading}
                />
              </div>

              <div className="form-group">
                <label htmlFor="model">Model *</label>
                <input
                  type="text"
                  id="model"
                  name="model"
                  value={formData.model}
                  onChange={handleChange}
                  required
                  placeholder="e.g., Camry"
                  disabled={uploading}
                />
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label htmlFor="year">Year *</label>
                <input
                  type="number"
                  id="year"
                  name="year"
                  value={formData.year}
                  onChange={handleChange}
                  required
                  min="1990"
                  max="2025"
                  placeholder="e.g., 2022"
                  disabled={uploading}
                />
              </div>

              <div className="form-group">
                <label htmlFor="type">Type *</label>
                <select
                  id="type"
                  name="type"
                  value={formData.type}
                  onChange={handleChange}
                  required
                  disabled={uploading}
                >
                  <option value="">Select Type</option>
                  <option value="Sedan">Sedan</option>
                  <option value="SUV">SUV</option>
                  <option value="Truck">Truck</option>
                  <option value="Coupe">Coupe</option>
                  <option value="Hatchback">Hatchback</option>
                  <option value="Van">Van</option>
                </select>
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label htmlFor="price">Price (Rs.) *</label>
                <input
                  type="number"
                  id="price"
                  name="price"
                  value={formData.price}
                  onChange={handleChange}
                  required
                  min="0"
                  placeholder="e.g., 25000"
                  disabled={uploading}
                />
              </div>

              <div className="form-group">
                <label htmlFor="mileage">Mileage (miles) *</label>
                <input
                  type="number"
                  id="mileage"
                  name="mileage"
                  value={formData.mileage}
                  onChange={handleChange}
                  required
                  min="0"
                  placeholder="e.g., 15000"
                  disabled={uploading}
                />
              </div>
            </div>

            <div className="form-group">
              <label htmlFor="description">Description *</label>
              <textarea
                id="description"
                name="description"
                value={formData.description}
                onChange={handleChange}
                required
                rows="4"
                placeholder="Describe your car's condition, features, and any additional information..."
                disabled={uploading}
              />
            </div>

            <div className="form-group">
              <label htmlFor="image">Car Image * (Max 5MB)</label>
              <input
  type="file"
  id="image"
  accept="image/*"
  onChange={handleImageChange}
  multiple
  required
  disabled={uploading}
/>
              {imagePreviews.length > 0 && (
  <div className="images-preview-grid">
    {imagePreviews.map((preview, index) => (
      <div key={index} className="preview-item">
        <img src={preview} alt={`Preview ${index + 1}`} />
        <span className="image-number">{index + 1}</span>
      </div>
    ))}
  </div>
)}
            </div>
          </div>

          {/* Seller Information Section */}
          <div className="form-section">
            <h2 className="section-title">Your Information</h2>
            
            <div className="form-group">
              <label htmlFor="sellerName">Full Name *</label>
              <input
                type="text"
                id="sellerName"
                name="sellerName"
                value={formData.sellerName}
                onChange={handleChange}
                required
                placeholder="John Doe"
                disabled={uploading}
              />
            </div>

            <div className="form-row">
              <div className="form-group">
                <label htmlFor="sellerEmail">Email *</label>
                <input
                  type="email"
                  id="sellerEmail"
                  name="sellerEmail"
                  value={formData.sellerEmail}
                  onChange={handleChange}
                  required
                  placeholder="john@example.com"
                  disabled={uploading}
                />
              </div>

              <div className="form-group">
                <label htmlFor="sellerPhone">Phone Number *</label>
                <input
                  type="tel"
                  id="sellerPhone"
                  name="sellerPhone"
                  value={formData.sellerPhone}
                  onChange={handleChange}
                  required
                  placeholder="+91 234 567 8900"
                  disabled={uploading}
                />
              </div>
            </div>
          </div>

          <button type="submit" className="submit-btn" disabled={uploading}>
            {uploading ? '⏳ Uploading...' : 'List My Car'}
          </button>
        </form>
      </div>
    </div>
  );
}

export default SellCar;