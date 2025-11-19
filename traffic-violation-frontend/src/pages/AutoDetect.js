import React, { useState } from 'react';
import './AutoDetect.css'; 

const AutoDetect = () => {
    const [file, setFile] = useState(null);
    const [preview, setPreview] = useState(null);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState(null);
    const [success, setSuccess] = useState(null);

    const handleFileChange = (e) => {
        const selectedFile = e.target.files[0];
        setFile(selectedFile);
        setError(null);
        setSuccess(null);

        if (selectedFile) {
            const reader = new FileReader();
            reader.onloadend = () => {
                setPreview(reader.result);
            };
            reader.readAsDataURL(selectedFile);
        } else {
            setPreview(null);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!file) {
            setError("Please select an image file first.");
            return;
        }

        setIsLoading(true);
        setError(null);
        setSuccess(null);

        const formData = new FormData();
        formData.append('image_file', file);

        try {
            const token = localStorage.getItem('token');
            const response = await fetch('http://localhost:5000/autodetect', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                },
                body: formData,
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || data.message || 'Detection failed');
            }
            
            setSuccess(data.message);

        } catch (err) {
            setError(err.message);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="autodetect-container">
            <h2 className="autodetect-title">Auto-Detect Violation</h2>
            <p className="autodetect-subtitle">Upload an image to detect 'No Helmet' violations.</p>

            <form onSubmit={handleSubmit} className="autodetect-form">
                <div className="form-group">
                    <label htmlFor="imageUpload" className="upload-label">
                        {preview ? "Change Image" : "Select Image"}
                    </label>
                    <input
                        id="imageUpload"
                        type="file"
                        accept="image/*"
                        onChange={handleFileChange}
                        className="upload-input"
                    />
                </div>

                {preview && (
                    <div className="image-preview-container">
                        <img src={preview} alt="Selected" className="image-preview" />
                    </div>
                )}

                <button
                    type="submit"
                    className={`autodetect-button ${isLoading ? 'disabled' : ''}`}
                    disabled={isLoading || !file}
                >
                    {isLoading ? "Analyzing..." : "Analyze Image"}
                </button>
            </form>

            {success && <div className="success-message">{success}</div>}
            {error && <div className="error-message">{error}</div>}
        </div>
    );
};

export default AutoDetect;