import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { Mail, Lock, UserCircle } from 'lucide-react';
import { motion } from 'framer-motion';
import api from '../api';
import GlassCard from '../components/glass/GlassCard';
import GlassButton from '../components/glass/GlassButton';
import GlassInput from '../components/glass/GlassInput';

const LoginForm = ({ onLogin }) => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [loginData, setLoginData] = useState({
    email: '',
    password: '',
  });

  const handleChange = (e) =>
    setLoginData({ ...loginData, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    const { email, password } = loginData;

    try {
      const res = await api.post(
        "/api/auth/login",
        { email, password },
        { withCredentials: true }
      );

      if (res.status === 200) {
        localStorage.setItem("user", JSON.stringify(res.data));
        toast.success('Login Successful!');
        onLogin();
        setTimeout(() => navigate('/dashboard'), 1000);
      }

    } catch (err) {
      toast.error('Invalid credentials');
      console.error(err);
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
        className="w-full max-w-sm"
      >
        <GlassCard padding="xl" hoverable={false}>
          <div className="text-center mb-8">
            <div className="mx-auto w-16 h-16 rounded-full bg-gradient-to-tr from-indigo-500 to-purple-600 flex items-center justify-center mb-4 shadow-lg shadow-indigo-500/30">
              <UserCircle size={32} className="text-white" />
            </div>
            <h4 className="text-glass-text-secondary font-medium">Welcome Back</h4>
            <h2 className="text-2xl font-bold text-white mt-1">Login to TaskFlow</h2>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <GlassInput
              icon={Mail}
              name="email"
              type="email"
              value={loginData.email}
              onChange={handleChange}
              placeholder="Email Address"
              required
            />

            <GlassInput
              icon={Lock}
              name="password"
              type="password"
              value={loginData.password}
              onChange={handleChange}
              placeholder="Password"
              required
            />

            <GlassButton
              type="submit"
              variant="primary"
              fullWidth
              loading={loading}
              className="mt-6"
            >
              Sign In
            </GlassButton>
          </form>

          <div className="text-center mt-6">
            <p className="text-glass-text-secondary text-sm">
              Don't have an account?{' '}
              <Link to="/register" className="text-glass-accent-primary hover:text-white transition-colors font-medium">
                Register
              </Link>
            </p>
          </div>
        </GlassCard>
      </motion.div>
    </div>
  );
};

export default LoginForm;
