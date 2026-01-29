import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { Mail, Lock, User, UserCircle } from 'lucide-react';
import { motion } from 'framer-motion';
import api from '../api';
import GlassCard from '../components/glass/GlassCard';
import GlassButton from '../components/glass/GlassButton';
import GlassInput from '../components/glass/GlassInput';

const RegisterForm = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    first_name: '',
    last_name: '',
    preffered_name: '',
    email: '',
    password: '',
    role_id: '1' // Default to Developer/User
  });

  const handleChange = (e) =>
    setFormData({ ...formData, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const res = await api.post('/register', formData);

      if (res.status === 200) {
        toast.success('Account created successfully!', {
          position: 'top-right',
          autoClose: 3000,
        });

        // Reset form
        setFormData({
          first_name: '',
          last_name: '',
          preffered_name: '',
          email: '',
          password: '',
          role_id: '1'
        });

        // Redirect to login
        setTimeout(() => navigate('/'), 2000);
      }
    } catch (err) {
      if (err.response?.status === 409) {
        toast.error('Email already exists!');
      } else {
        toast.error('Registration failed. Please try again.');
        console.error(err);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md"
      >
        <GlassCard padding="xl" hoverable={false}>
          <div className="text-center mb-8">
            <div className="mx-auto w-16 h-16 rounded-full bg-gradient-to-tr from-emerald-500 to-teal-500 flex items-center justify-center mb-4 shadow-lg shadow-emerald-500/30">
              <UserCircle size={32} className="text-white" />
            </div>
            <h4 className="text-glass-text-secondary font-medium">Join TaskFlow</h4>
            <h2 className="text-2xl font-bold text-white mt-1">Create Account</h2>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <GlassInput
                icon={User}
                name="first_name"
                value={formData.first_name}
                onChange={handleChange}
                placeholder="First Name"
                required
              />
              <GlassInput
                icon={User}
                name="last_name"
                value={formData.last_name}
                onChange={handleChange}
                placeholder="Last Name"
                required
              />
            </div>

            <GlassInput
              icon={User}
              name="preffered_name"
              value={formData.preffered_name}
              onChange={handleChange}
              placeholder="Preferred Name (Optional)"
            />

            <GlassInput
              icon={Mail}
              name="email"
              type="email"
              value={formData.email}
              onChange={handleChange}
              placeholder="Email Address"
              required
            />

            <GlassInput
              icon={Lock}
              name="password"
              type="password"
              value={formData.password}
              onChange={handleChange}
              placeholder="Password"
              required
            />

            <GlassButton
              type="submit"
              variant="primary"
              fullWidth
              loading={loading}
              className="mt-6 bg-emerald-600 hover:bg-emerald-700 border-emerald-500"
            >
              Register
            </GlassButton>
          </form>

          <div className="text-center mt-6">
            <p className="text-glass-text-secondary text-sm">
              Already have an account?{' '}
              <Link to="/" className="text-glass-accent-primary hover:text-white transition-colors font-medium">
                Login
              </Link>
            </p>
          </div>
        </GlassCard>
      </motion.div>
    </div>
  );
};

export default RegisterForm;