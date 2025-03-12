import React, { useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

const NewForm = () => {
    const [formData, setFormData] = useState({
        form_name: '',
        user_name: '',
        department: '',
        details: ''
    });

    const navigate = useNavigate();

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            await axios.post('http://localhost:5000/api/forms', formData);
            alert('✅ บันทึกฟอร์มสำเร็จ!');
            navigate('/'); // กลับไปหน้า Home
        } catch (error) {
            console.error('❌ Error submitting form:', error);
        }
    };

    return (
        <div>
            <h1>📝 เพิ่มฟอร์มใหม่</h1>
            <form onSubmit={handleSubmit}>
                <label>Form Name:</label>
                <input type="text" name="form_name" value={formData.form_name} onChange={handleChange} required />

                <label>User Name:</label>
                <input type="text" name="user_name" value={formData.user_name} onChange={handleChange} required />

                <label>Department:</label>
                <input type="text" name="department" value={formData.department} onChange={handleChange} />

                <label>Details:</label>
                <textarea name="details" value={formData.details} onChange={handleChange}></textarea>

                <button type="submit">📩 บันทึกฟอร์ม</button>
            </form>
        </div>
    );
};

export default NewForm;
