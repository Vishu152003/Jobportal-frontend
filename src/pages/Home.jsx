import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import Loader from '../components/Loader';
import { analyticsAPI } from '../services/api';

const Home = () => {
  const [stats, setStats] = useState({ jobs: 0, companies: 0, candidates: 0, ideas: 0 });
  const [featuredJobs, setFeaturedJobs] = useState([]);
  const [companies, setCompanies] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchHomeData = async () => {
      try {
        const [statsRes, jobsRes, companiesRes] = await Promise.all([
          analyticsAPI.homeStats(),
          analyticsAPI.featuredJobs(),
          analyticsAPI.featuredCompanies()
        ]);
        setStats(statsRes.data);
        setFeaturedJobs(jobsRes.data);
        setCompanies(companiesRes.data);
      } catch (error) {
        console.error('Error fetching home data:', error);
        // Use fallback data on error
        setStats({ jobs: 10000, companies: 500, candidates: 25000, ideas: 2000 });
      } finally {
        setLoading(false);
      }
    };

    fetchHomeData();
  }, []);

  const testimonials = [
    {
      id: 1,
      name: 'Sarah Johnson',
      role: 'Software Engineer',
      company: 'Google',
      avatar: 'https://randomuser.me/api/portraits/women/44.jpg',
      message: 'JobPortal helped me find my dream job within weeks. The application process was smooth and I loved the personalized recommendations!'
    },
    {
      id: 2,
      name: 'Michael Chen',
      role: 'Product Manager',
      company: 'Amazon',
      avatar: 'https://randomuser.me/api/portraits/men/32.jpg',
      message: 'As a recruiter, JobPortal has been amazing for finding qualified candidates. The AI matching feature saves us so much time.'
    },
    {
      id: 3,
      name: 'Emily Davis',
      role: 'UX Designer',
      company: 'Netflix',
      avatar: 'https://randomuser.me/api/portraits/women/68.jpg',
      message: 'The startup ideas section is fantastic! I connected with amazing co-founders and we are building something incredible together.'
    }
  ];

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Hero Section */}
      <div className="relative overflow-hidden bg-gradient-to-br from-violet-600 via-purple-600 to-fuchsia-500">
        {/* Animated background shapes */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute -top-40 -right-40 w-80 h-80 bg-white/10 rounded-full blur-3xl"></div>
          <div className="absolute top-40 -left-40 w-96 h-96 bg-pink-500/20 rounded-full blur-3xl"></div>
          <div className="absolute -bottom-40 left-1/2 transform -translate-x-1/2 w-96 h-96 bg-purple-500/20 rounded-full blur-3xl"></div>
        </div>
        
        <div className="relative max-w-7xl mx-auto px-4 py-32 sm:px-6 lg:px-8">
          <div className="text-center">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
            >
              <span className="inline-block px-4 py-1.5 mb-6 text-sm font-medium bg-white/20 backdrop-blur-sm rounded-full text-white">
                🚀 Your Career Journey Starts Here
              </span>
            </motion.div>
            
            <motion.h1 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.1 }}
              className="text-5xl md:text-7xl font-bold text-white mb-6 tracking-tight"
            >
              Find Your Dream Job{' '}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-yellow-300 to-pink-300">
                Today
              </span>
            </motion.h1>
            
            <motion.p 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="text-xl md:text-2xl text-purple-100 mb-10 max-w-2xl mx-auto"
            >
              Connect with top companies, discover innovative startup ideas, and take your career to the next level.
            </motion.p>
            
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.3 }}
              className="flex flex-col sm:flex-row justify-center gap-4"
            >
              <Link
                to="/jobs"
                className="px-8 py-4 bg-white text-purple-600 rounded-xl font-bold text-lg hover:bg-gray-100 transition-all transform hover:scale-105 shadow-lg"
              >
                Browse Jobs 🔍
              </Link>
              <Link
                to="/register"
                className="px-8 py-4 bg-white/20 backdrop-blur-sm text-white rounded-xl font-bold text-lg hover:bg-white/30 transition-all transform hover:scale-105 border border-white/30"
              >
                Get Started ✨
              </Link>
            </motion.div>
          </div>
        </div>
        
        {/* Wave divider */}
        <div className="absolute bottom-0 left-0 right-0">
          <svg viewBox="0 0 1440 120" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M0 120L60 105C120 90 240 60 360 45C480 30 600 30 720 37.5C840 45 960 60 1080 67.5C1200 75 1320 75 1380 75L1440 75V120H1380C1320 120 1200 120 1080 120C960 120 840 120 720 120C600 120 480 120 360 120C240 120 120 120 60 120H0Z" fill="currentColor" className="text-gray-50 dark:bg-gray-900"/>
          </svg>
        </div>
      </div>

      {/* Stats Section - Dynamic */}
      <div className="py-20 bg-white dark:bg-gray-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {loading ? (
              <Loader type="stats" />
            ) : (
              [
                {number: stats.jobs.toLocaleString() + '+', label: 'Jobs Posted', icon: '💼' },
                {number: stats.companies.toLocaleString() + '+', label: 'Companies', icon: '🏢' },
                {number: stats.candidates.toLocaleString() + '+', label: 'Candidates', icon: '👥' },
                {number: stats.ideas.toLocaleString() + '+', label: 'Startup Ideas', icon: '💡' },
              ].map((stat, index) => (
                <motion.div 
                  key={index}
                  initial={{ opacity: 0, scale: 0.9 }}
                  whileInView={{ opacity: 1, scale: 1 }}
                  viewport={{ once: true }}
                  transition={{ delay: index * 0.1 }}
                  className="text-center p-6"
                >
                  <div className="text-5xl mb-3">{stat.icon}</div>
                  <div className="text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-600 to-pink-600">
                    {stat.number}
                  </div>
                  <div className="text-gray-600 dark:text-gray-400 font-medium">{stat.label}</div>
                </motion.div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Company Logos Section - Marquee */}
      {companies.length > 0 && (
        <div className="py-12 bg-gray-50 dark:bg-gray-900 overflow-hidden">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mb-8">
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="text-center"
            >
              <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
                Trusted by Top Companies
              </h2>
              <p className="text-gray-600 dark:text-gray-400">
                Join thousands of companies hiring on our platform
              </p>
            </motion.div>
          </div>
          
          <div className="relative">
            <div className="flex animate-marquee whitespace-nowrap">
              {[...companies, ...companies].map((company, index) => (
                <div key={`${company.id}-${index}`} className="mx-8 flex items-center space-x-2">
                  {company.logo ? (
                    <img 
                      src={company.logo} 
                      alt={company.name}
                      className="h-12 w-12 object-contain rounded-lg"
                    />
                  ) : (
                    <div className="h-12 w-12 bg-purple-100 dark:bg-purple-900 rounded-lg flex items-center justify-center text-2xl">
                      🏢
                    </div>
                  )}
                  <span className="text-lg font-semibold text-gray-700 dark:text-gray-300">
                    {company.name}
                  </span>
                  {company.is_verified && (
                    <span className="text-blue-500 text-sm">✓</span>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Featured Jobs Section */}
      <div className="py-24 bg-white dark:bg-gray-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">
              Featured <span className="text-purple-600">Job Opportunities</span>
            </h2>
            <p className="text-xl text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
              Explore the latest job openings from top companies
            </p>
          </motion.div>
          
          {featuredJobs.length > 0 ? (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {featuredJobs.slice(0, 6).map((job, index) => (
                <motion.div 
                  key={job.id}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: index * 0.1 }}
                  className="bg-gray-50 dark:bg-gray-700 rounded-2xl p-6 hover:shadow-xl transition-shadow"
                >
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-1">
                        {job.title}
                      </h3>
                      <p className="text-purple-600 font-medium">{job.company_name}</p>
                    </div>
                    {job.is_remote && (
                      <span className="px-3 py-1 bg-green-100 text-green-700 text-xs font-semibold rounded-full">
                        Remote
                      </span>
                    )}
                  </div>
                  
                  <div className="flex items-center text-sm text-gray-500 dark:text-gray-400 mb-4">
                    <span className="mr-4">📍 {job.location}</span>
                    <span>💰 {job.salary_min ? `$${job.salary_min}-$${job.salary_max}` : 'Competitive'}</span>
                  </div>
                  
                  <div className="flex flex-wrap gap-2 mb-4">
                    {job.skills?.slice(0, 3).map((skill, i) => (
                      <span key={i} className="px-3 py-1 bg-purple-100 dark:bg-purple-900 text-purple-700 dark:text-purple-300 text-xs rounded-full">
                        {skill}
                      </span>
                    ))}
                  </div>
                  
                  <Link
                    to={`/jobs/${job.id}`}
                    className="block w-full text-center py-3 bg-purple-600 text-white rounded-xl font-semibold hover:bg-purple-700 transition-colors"
                  >
                    View Details
                  </Link>
                </motion.div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <p className="text-gray-500 text-lg">No featured jobs available at the moment.</p>
              <Link to="/jobs" className="text-purple-600 font-semibold hover:underline mt-2 inline-block">
                Browse all jobs →
              </Link>
            </div>
          )}
          
          <div className="text-center mt-12">
            <Link
              to="/jobs"
              className="inline-block px-8 py-4 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-xl font-bold text-lg hover:opacity-90 transition-opacity"
            >
              View All Jobs →
            </Link>
          </div>
        </div>
      </div>

      {/* Features Section */}
      <div className="py-24 bg-gray-50 dark:bg-gray-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">
              Why Choose <span className="text-purple-600">JobPortal</span>?
            </h2>
            <p className="text-xl text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
              We provide everything you need to advance your career or find the perfect candidate.
            </p>
          </motion.div>
          
          <div className="grid md:grid-cols-3 gap-8">
            {/* Feature 1 */}
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.1 }}
              className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-8 hover:shadow-2xl transition-shadow"
            >
              <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-2xl flex items-center justify-center text-3xl mb-6">
                👔
              </div>
              <h3 className="text-2xl font-bold mb-3 text-gray-900 dark:text-white">
                For Job Seekers
              </h3>
              <p className="text-gray-600 dark:text-gray-400 mb-6">
                Browse thousands of jobs, apply with your resume, and track your applications all in one place. Get AI-powered job recommendations.
              </p>
              <Link to="/register" className="text-purple-600 font-semibold hover:text-purple-700 flex items-center gap-2">
                Sign Up Now →
              </Link>
            </motion.div>

            {/* Feature 2 */}
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.2 }}
              className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-8 hover:shadow-2xl transition-shadow"
            >
              <div className="w-16 h-16 bg-gradient-to-br from-green-500 to-emerald-500 rounded-2xl flex items-center justify-center text-3xl mb-6">
                🏢
              </div>
              <h3 className="text-2xl font-bold mb-3 text-gray-900 dark:text-white">
                For Employers
              </h3>
              <p className="text-gray-600 dark:text-gray-400 mb-6">
                Post jobs, find qualified candidates with AI-powered matching, and manage applications with our easy-to-use dashboard.
              </p>
              <Link to="/register" className="text-purple-600 font-semibold hover:text-purple-700 flex items-center gap-2">
                Post a Job →
              </Link>
            </motion.div>

            {/* Feature 3 */}
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.3 }}
              className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-8 hover:shadow-2xl transition-shadow"
            >
              <div className="w-16 h-16 bg-gradient-to-br from-orange-500 to-red-500 rounded-2xl flex items-center justify-center text-3xl mb-6">
                🚀
              </div>
              <h3 className="text-2xl font-bold mb-3 text-gray-900 dark:text-white">
                Startup Ideas
              </h3>
              <p className="text-gray-600 dark:text-gray-400 mb-6">
                Share your startup ideas, get community feedback, vote on ideas you love, and find co-founders for your next big thing.
              </p>
              <Link to="/ideas" className="text-purple-600 font-semibold hover:text-purple-700 flex items-center gap-2">
                Explore Ideas →
              </Link>
            </motion.div>
          </div>
        </div>
      </div>

      {/* Testimonials Section */}
      <div className="py-24 bg-white dark:bg-gray-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">
              What Our <span className="text-purple-600">Users Say</span>
            </h2>
            <p className="text-xl text-gray-600 dark:text-gray-400">
              Join thousands of satisfied users who found their dream job
            </p>
          </motion.div>
          
          <div className="grid md:grid-cols-3 gap-8">
            {testimonials.map((testimonial, index) => (
              <motion.div 
                key={testimonial.id}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.2 }}
                className="bg-gray-50 dark:bg-gray-700 rounded-2xl p-8"
              >
                <div className="flex items-center mb-6">
                  <img
                    src={testimonial.avatar}
                    alt={testimonial.name}
                    className="w-16 h-16 rounded-full object-cover"
                  />
                  <div className="ml-4">
                    <h4 className="text-xl font-bold text-gray-900 dark:text-white">
                      {testimonial.name}
                    </h4>
                    <p className="text-gray-600 dark:text-gray-400">
                      {testimonial.role} at {testimonial.company}
                    </p>
                  </div>
                </div>
                <p className="text-gray-600 dark:text-gray-300 italic">
                  "{testimonial.message}"
                </p>
              </motion.div>
            ))}
          </div>
        </div>
      </div>

      {/* How It Works Section */}
      <div className="py-24 bg-gray-50 dark:bg-gray-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">
              How It Works
            </h2>
            <p className="text-xl text-gray-600 dark:text-gray-400">
              Get started in three simple steps
            </p>
          </motion.div>
          
          <div className="grid md:grid-cols-3 gap-8">
            {[
              { step: '01', title: 'Create Account', description: 'Sign up for free and choose your role - Job Seeker or Employer', icon: '📝' },
              { step: '02', title: 'Build Profile', description: 'Upload your resume or create your company profile', icon: '📋' },
              { step: '03', title: 'Get Hired/Hire', description: 'Apply to jobs or post openings and connect with talent', icon: '🎯' },
            ].map((item, index) => (
              <motion.div 
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.2 }}
                className="relative"
              >
                <div className="bg-white dark:bg-gray-800 rounded-2xl p-8 shadow-lg h-full">
                  <div className="text-5xl mb-4">{item.icon}</div>
                  <div className="text-purple-600 font-bold text-lg mb-2">Step {item.step}</div>
                  <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-3">{item.title}</h3>
                  <p className="text-gray-600 dark:text-gray-400">{item.description}</p>
                </div>
                {index < 2 && (
                  <div className="hidden md:block absolute top-1/2 -right-4 transform -translate-y-1/2 text-purple-300 text-4xl">
                    →
                  </div>
                )}
              </motion.div>
            ))}
          </div>
        </div>
      </div>

      {/* CTA Section */}
      <div className="py-24 bg-gradient-to-r from-violet-600 via-purple-600 to-fuchsia-500">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
          >
            <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">
              Ready to Transform Your Career?
            </h2>
            <p className="text-xl text-purple-100 mb-10">
              Join thousands of job seekers and employers who have already discovered their potential.
            </p>
            <Link
              to="/register"
              className="inline-block px-10 py-5 bg-white text-purple-600 rounded-2xl font-bold text-xl hover:bg-gray-100 transition-all transform hover:scale-105 shadow-2xl"
            >
              Create Free Account Now 🎉
            </Link>
          </motion.div>
        </div>
      </div>

      {/* Footer */}
      <footer className="bg-gray-900 text-gray-400 py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-4 gap-8 mb-8">
            <div>
              <h3 className="text-2xl font-bold text-white mb-4">JobPortal</h3>
              <p className="text-gray-400">
                Your trusted platform for finding jobs and discovering startup ideas.
              </p>
            </div>
            <div>
              <h4 className="text-white font-semibold mb-4">For Job Seekers</h4>
              <ul className="space-y-2">
                <li><Link to="/jobs" className="hover:text-purple-400">Browse Jobs</Link></li>
                <li><Link to="/ideas" className="hover:text-purple-400">Startup Ideas</Link></li>
                <li><Link to="/register" className="hover:text-purple-400">Create Account</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="text-white font-semibold mb-4">For Employers</h4>
              <ul className="space-y-2">
                <li><Link to="/register" className="hover:text-purple-400">Post a Job</Link></li>
                <li><Link to="/register" className="hover:text-purple-400">Create Company</Link></li>
                <li><Link to="/dashboard" className="hover:text-purple-400">Dashboard</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="text-white font-semibold mb-4">Company</h4>
              <ul className="space-y-2">
                <li><Link to="#" className="hover:text-purple-400">About Us</Link></li>
                <li><Link to="#" className="hover:text-purple-400">Contact</Link></li>
                <li><Link to="#" className="hover:text-purple-400">Privacy Policy</Link></li>
              </ul>
            </div>
          </div>
          <div className="border-t border-gray-800 pt-8 text-center">
            <p>© 2024 JobPortal. All rights reserved. Made with ❤️</p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Home;
