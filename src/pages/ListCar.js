import React, { useState, useEffect } from 'react';
import './ListCar.css';
import { collection, addDoc, serverTimestamp, doc, setDoc } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { db, storage } from '../firebase/config';
import { getAuth, onAuthStateChanged } from 'firebase/auth';
import { FaUpload, FaCheckCircle, FaTrashAlt, FaCamera, FaCar, FaMoneyBillWave, FaInfoCircle, FaKey, FaBullseye, FaFileAlt } from 'react-icons/fa';

function ListCar() {
  const [currentUser, setCurrentUser] = useState(null);

  useEffect(() => {
    const auth = getAuth();
    const unsubscribe = onAuthStateChanged(auth, (user) => setCurrentUser(user));
    return () => unsubscribe();
  }, []);

  const [step, setStep] = useState(1);
  const [listingPurpose, setListingPurpose] = useState('sell'); 
  const [formData, setFormData] = useState({
    brand: '',
    model: '',
    year: '',
    type: '',
    mileage: '',
    description: '',
    color: '',
    transmission: 'Automatic',
    fuelType: 'Petrol',
    salePrice: '',
    dailyRate: '',
    seats: '5',
    features: [],
    city: '',
    area: '',
    state: '',
    sellerName: '',
    sellerEmail: '',
    sellerPhone: ''
  });

  const [imageFiles, setImageFiles] = useState([]);
  const [imagePreviews, setImagePreviews] = useState([]);
  const [submitted, setSubmitted] = useState(false);
  const [uploading, setUploading] = useState(false);

  // State for new document files
  const [adminDocs, setAdminDocs] = useState({ aadhar: null, pan: null, license: null });
  const [publicDocs, setPublicDocs] = useState({ rc: null, insurance: null, puc: null });

  const availableFeatures = ['GPS Navigation', 'Bluetooth', 'Backup Camera', 'Apple CarPlay', 'Android Auto', 'Heated Seats', 'Sunroof', 'Leather Seats'];

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleImageChange = (e) => {
    const files = Array.from(e.target.files);
    if (files.length + imageFiles.length > 5) {
      alert('Maximum 5 images allowed');
      return;
    }

    const validFiles = files.filter(file => file.size <= 5 * 1024 * 1024);
    const newFiles = [...imageFiles, ...validFiles];
    setImageFiles(newFiles);

    const newPreviews = validFiles.map(file => URL.createObjectURL(file));
    setImagePreviews([...imagePreviews, ...newPreviews]);
  };

  const removeImage = (id) => {
    const newFiles = [...imageFiles];
    newFiles.splice(id, 1);
    setImageFiles(newFiles);
    
    const newPreviews = [...imagePreviews];
    newPreviews.splice(id, 1);
    setImagePreviews(newPreviews);
  };

  const handleFeatureChange = (e) => {
    const { value, checked } = e.target;
    setFormData(prev => {
        const newFeatures = checked
            ? [...prev.features, value]
            : prev.features.filter(feature => feature !== value);
        return { ...prev, features: newFeatures };
    });
  };

  const handleAdminDocChange = (e) => {
    const { name, files } = e.target;
    if (files[0]) {
      setAdminDocs(prev => ({ ...prev, [name]: files[0] }));
    }
  };

  const handlePublicDocChange = (e) => {
    const { name, files } = e.target;
    if (files[0]) {
      setPublicDocs(prev => ({ ...prev, [name]: files[0] }));
    }
  };

  // Helper function to upload a file and get its URL
  const uploadFile = async (file, path) => {
    if (!file) return null;
    const fileRef = ref(storage, path);
    await uploadBytes(fileRef, file);
    return await getDownloadURL(fileRef);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!currentUser) return alert('Please login first');
    if (imageFiles.length === 0) return alert('Please upload images');
    if (!adminDocs.aadhar || !adminDocs.pan || !adminDocs.license) {
      alert("Please upload Aadhaar Card, PAN Card, and Driving License for verification.");
      return;
    }

    try {
      setUploading(true);

      // 1. Create a new car document reference to get a stable ID
      const carDocRef = doc(collection(db, 'cars'));
      const carId = carDocRef.id;

      // 2. Upload all files
      const imageUrls = await Promise.all(
        imageFiles.map(async (file, idx) => {
          const imageRef = ref(storage, `cars/${carId}/image_${idx}_${file.name}`);
          await uploadBytes(imageRef, file);
          return getDownloadURL(imageRef);
        })
      );

      const rcUrl = await uploadFile(publicDocs.rc, `cars/${carId}/rc.pdf`);
      const insuranceUrl = await uploadFile(publicDocs.insurance, `cars/${carId}/insurance.pdf`);
      const pucUrl = await uploadFile(publicDocs.puc, `cars/${carId}/puc.pdf`);

      const aadharUrl = await uploadFile(adminDocs.aadhar, `user-verification/${currentUser.uid}/aadhar.pdf`);
      const panUrl = await uploadFile(adminDocs.pan, `user-verification/${currentUser.uid}/pan.pdf`);
      const licenseUrl = await uploadFile(adminDocs.license, `user-verification/${currentUser.uid}/license.pdf`);

      // 3. Prepare data for Firestore
      const carData = {
        ...formData,
        listingPurpose,
        year: parseInt(formData.year),
        mileage: parseInt(formData.mileage),
        images: imageUrls,
        publicDocs: {
          ...(rcUrl && { rc: rcUrl }),
          ...(insuranceUrl && { insurance: insuranceUrl }),
          ...(pucUrl && { puc: pucUrl }),
        },
        sellerName: formData.sellerName || currentUser.displayName,
        sellerEmail: formData.sellerEmail || currentUser.email,
        userId: currentUser.uid,
        createdAt: serverTimestamp(),
        status: 'pending_verification' // Admin needs to verify docs
      };

      if (listingPurpose === 'sell' || listingPurpose === 'both') {
        carData.salePrice = parseInt(formData.salePrice);
      }
      if (listingPurpose === 'rent' || listingPurpose === 'both') {
        carData.dailyRate = parseInt(formData.dailyRate);
      }

      // 4. Save car listing and user verification docs
      await setDoc(carDocRef, carData);

      const userDocRef = doc(db, 'users', currentUser.uid);
      await setDoc(userDocRef, {
        verificationDocs: { aadharUrl, panUrl, licenseUrl, status: 'pending', submittedAt: serverTimestamp() }
      }, { merge: true });

      // Log activity
      await addDoc(collection(db, 'activity_logs'), {
        type: 'listing', action: `create_${listingPurpose}`, severity: 'normal',
        userId: currentUser.uid, userEmail: currentUser.email, timestamp: serverTimestamp(),
        details: { brand: formData.brand, model: formData.model, id: carId }
      });

      setSubmitted(true);
    } catch (err) {
      alert('Error: ' + err.message);
    } finally {
      setUploading(false);
    }
  };

  if (submitted) return (
    <div className="list-car animate-fade-in">
      <div className="container">
        <div className="success-message">
          <div className="success-icon"><FaCheckCircle /></div>
          <h2>Great Success!</h2>
          <p>Your {formData.brand} {formData.model} is now live on RideMart.</p>
          <button className="btn btn-primary" onClick={() => window.location.reload()} style={{marginTop: 'var(--space-lg)'}}>List Another Car</button>
        </div>
      </div>
    </div>
  );

  return (
    <div className="list-car animate-fade-in">
      <div className="container">
        <header className="page-header">
          <h1>Grow With <span className="highlight">RideMart</span></h1>
          <p>List your vehicle and connect with thousands of premium customers daily</p>
        </header>

        <form onSubmit={handleSubmit} className="list-form">
          {/* Progress Indicator */}
          <div className="flex-between" style={{marginBottom: 'var(--space-xl)', padding: '0 var(--space-lg)'}}>
            <div className={`tab ${step >= 1 ? 'active' : ''}`} style={{flex: 1, textAlign: 'center'}}>1. Purpose</div>
            <div className={`tab ${step >= 2 ? 'active' : ''}`} style={{flex: 1, textAlign: 'center'}}>2. Details</div>
            <div className={`tab ${step >= 3 ? 'active' : ''}`} style={{flex: 1, textAlign: 'center'}}>3. Pricing</div>
            <div className={`tab ${step >= 4 ? 'active' : ''}`} style={{flex: 1, textAlign: 'center'}}>4. Documents</div>
          </div>

          {step === 1 && (
            <div className="form-section">
              <h2 className="section-title"><FaCar /> Choose Listing Type</h2>
              <div className="purpose-options">
                <label className={`purpose-card ${listingPurpose === 'sell' ? 'selected' : ''}`}>
                  <input type="radio" value="sell" checked={listingPurpose === 'sell'} onChange={(e) => setListingPurpose(e.target.value)} />
                  <span className="purpose-icon"><FaMoneyBillWave /></span>
                  <h3>Direct Sale</h3>
                  <p>Transfer ownership for a fixed price</p>
                </label>
                <label className={`purpose-card ${listingPurpose === 'rent' ? 'selected' : ''}`}>
                  <input type="radio" value="rent" checked={listingPurpose === 'rent'} onChange={(e) => setListingPurpose(e.target.value)} />
                  <span className="purpose-icon"><FaKey /></span>
                  <h3>Rental Fleet</h3>
                  <p>Earn steady income through daily rentals</p>
                </label>
                <label className={`purpose-card ${listingPurpose === 'both' ? 'selected' : ''}`}>
                  <input type="radio" value="both" checked={listingPurpose === 'both'} onChange={(e) => setListingPurpose(e.target.value)} />
                  <span className="purpose-icon"><FaBullseye /></span>
                  <h3>Hybrid</h3>
                  <p>Maximize reach - sell and rent simultaneously</p>
                </label>
              </div>
              <button type="button" className="btn btn-primary" style={{width: '100%', marginTop: 'var(--space-xl)'}} onClick={() => setStep(2)}>Continue to Details</button>
            </div>
          )}

          {step === 2 && (
            <div className="form-section">
              <h2 className="section-title"><FaInfoCircle /> Vehicle Information</h2>
              <div className="form-row">
                <div className="form-group"><label>Brand</label><input name="brand" value={formData.brand} onChange={handleChange} required placeholder="e.g. BMW" /></div>
                <div className="form-group"><label>Model</label><input name="model" value={formData.model} onChange={handleChange} required placeholder="e.g. M4" /></div>
              </div>
              <div className="form-row">
                <div className="form-group"><label>Year</label><input type="number" name="year" value={formData.year} onChange={handleChange} required /></div>
                <div className="form-group"><label>Body Type</label>
                  <select name="type" value={formData.type} onChange={handleChange} required>
                    <option value="">Select</option><option value="Sedan">Sedan</option><option value="SUV">SUV</option><option value="Coupe">Coupe</option>
                  </select>
                </div>
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label>City *</label>
                  <input name="city" value={formData.city} onChange={handleChange} required placeholder="e.g. Mumbai" />
                </div>
                <div className="form-group">
                  <label>Area *</label>
                  <input name="area" value={formData.area} onChange={handleChange} required placeholder="e.g. Bandra" />
                </div>
                <div className="form-group">
                  <label>State *</label>
                  <input name="state" value={formData.state} onChange={handleChange} required placeholder="e.g. Maharashtra" />
                </div>
              </div>
              <div className="form-group">
                <label>Features</label>
                <div className="features-grid">
                  {availableFeatures.map(feature => (
                    <label key={feature} className="feature-checkbox">
                      <input
                        type="checkbox"
                        value={feature}
                        checked={formData.features.includes(feature)}
                        onChange={handleFeatureChange}
                      />
                      {feature}
                    </label>
                  ))}
                </div>
              </div>
              <div className="form-group">
                <label><FaCamera /> Vehicle Images (Max 5)</label>
                <div className="images-preview-grid">
                  {imagePreviews.map((p, i) => (
                    <div key={i} className="preview-item">
                      <img src={p} alt="" />
                      <button type="button" onClick={() => removeImage(i)} className="table-action-btn delete" style={{position: 'absolute', top: 5, right: 5}}><FaTrashAlt /></button>
                    </div>
                  ))}
                  {imageFiles.length < 5 && (
                    <label className="preview-item" style={{borderStyle: 'dashed', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center'}}>
                      <input type="file" multiple onChange={handleImageChange} style={{display: 'none'}} />
                      <FaUpload style={{fontSize: '1.5rem', color: 'var(--primary)'}} />
                    </label>
                  )}
                </div>
              </div>
              <div className="flex" style={{gap: 'var(--space-md)'}}>
                <button type="button" className="btn btn-secondary" style={{flex: 1}} onClick={() => setStep(1)}>Back</button>
                <button type="button" className="btn btn-primary" style={{flex: 2}} onClick={() => setStep(3)}>Next: Pricing</button>
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="form-section">
              <h2 className="section-title"><FaMoneyBillWave /> Pricing & Terms</h2>
              {(listingPurpose === 'sell' || listingPurpose === 'both') && (
                <div className="form-group"><label>Total Sale Price (₹)</label><input type="number" name="salePrice" value={formData.salePrice} onChange={handleChange} required /></div>
              )}
              {(listingPurpose === 'rent' || listingPurpose === 'both') && (
                <div className="form-group"><label>Daily Rental Rate (₹/day)</label><input type="number" name="dailyRate" value={formData.dailyRate} onChange={handleChange} required /></div>
              )}
              <div className="form-row">
                <div className="form-group"><label>Your Phone Number</label><input type="tel" name="sellerPhone" value={formData.sellerPhone} onChange={handleChange} required /></div>
                <div className="form-group"><label>Transmission</label>
                  <select name="transmission" value={formData.transmission} onChange={handleChange}><option value="Automatic">Automatic</option><option value="Manual">Manual</option></select>
                </div>
              </div>
              <div className="flex" style={{gap: 'var(--space-md)', marginTop: 'var(--space-xl)'}}>
                <button type="button" className="btn btn-secondary" style={{flex: 1}} onClick={() => setStep(2)}>Back</button>
                <button type="button" className="btn btn-primary" style={{flex: 2}} onClick={() => setStep(4)}>Next: Documents</button>
              </div>
            </div>
          )}

          {step === 4 && (
            <div className="form-section">
              <h2 className="section-title"><FaFileAlt /> Upload Documents</h2>

              <div className="document-subsection">
                <h3 className="subsection-title">For Admin Verification (Private)</h3>
                <p className="subsection-description">These documents are for our team to verify your identity and will NOT be shared publicly.</p>
                <div className="form-row">
                  <div className="form-group">
                    <label htmlFor="aadhar">Aadhaar Card*</label>
                    <input type="file" id="aadhar" name="aadhar" onChange={handleAdminDocChange} accept="image/*,.pdf" required />
                    {adminDocs.aadhar && <span className="file-name-preview">{adminDocs.aadhar.name}</span>}
                  </div>
                  <div className="form-group">
                    <label htmlFor="pan">PAN Card*</label>
                    <input type="file" id="pan" name="pan" onChange={handleAdminDocChange} accept="image/*,.pdf" required />
                    {adminDocs.pan && <span className="file-name-preview">{adminDocs.pan.name}</span>}
                  </div>
                  <div className="form-group">
                    <label htmlFor="license">Driving License*</label>
                    <input type="file" id="license" name="license" onChange={handleAdminDocChange} accept="image/*,.pdf" required />
                    {adminDocs.license && <span className="file-name-preview">{adminDocs.license.name}</span>}
                  </div>
                </div>
              </div>
    
              <div className="document-subsection">
                <h3 className="subsection-title">For Buyers & Renters (Public)</h3>
                <p className="subsection-description">These documents will be visible on your car's listing page to build trust.</p>
                <div className="form-row">
                  <div className="form-group">
                    <label htmlFor="rc">Registration Certificate (RC)</label>
                    <input type="file" id="rc" name="rc" onChange={handlePublicDocChange} accept="image/*,.pdf" />
                    {publicDocs.rc && <span className="file-name-preview">{publicDocs.rc.name}</span>}
                  </div>
                  <div className="form-group">
                    <label htmlFor="insurance">Insurance Paper</label>
                    <input type="file" id="insurance" name="insurance" onChange={handlePublicDocChange} accept="image/*,.pdf" />
                    {publicDocs.insurance && <span className="file-name-preview">{publicDocs.insurance.name}</span>}
                  </div>
                </div>
                <div className="form-group">
                  <label htmlFor="puc">Pollution Under Control (PUC)</label>
                  <input type="file" id="puc" name="puc" onChange={handlePublicDocChange} accept="image/*,.pdf" />
                  {publicDocs.puc && <span className="file-name-preview">{publicDocs.puc.name}</span>}
                </div>
              </div>

              <div className="flex" style={{gap: 'var(--space-md)', marginTop: 'var(--space-xl)'}}>
                <button type="button" className="btn btn-secondary" style={{flex: 1}} onClick={() => setStep(3)}>Back</button>
                <button type="submit" className="submit-btn" style={{flex: 2, margin: 0}} disabled={uploading}>{uploading ? 'Submitting...' : 'Complete Listing'}</button>
              </div>
            </div>
          )}
        </form>
      </div>
    </div>
  );
}

export default ListCar;