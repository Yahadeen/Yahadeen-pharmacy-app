import React from "react";
import Image from "next/image";
import Link from "next/link";
import { 
  Package, 
  DollarSign, 
  AlertTriangle, 
  BarChart3, 
  Users, 
  Bell, 
  Shield, 
  Zap, 
  Clock, 
  CheckCircle, 
  ArrowRight, 
  Star, 
  TrendingUp,
  Pill,
  ShoppingCart,
  Truck,
  FileText,
  HeartPulse,
  Stethoscope,
  Calendar,
  MessageSquare,
  CreditCard,
  Smartphone,
  Database,
  Globe,
  Lock,
  Award,
  Target,
  Building2,
  Play,
  UserPlus
} from "lucide-react";

export default function AdminDashboard() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-white font-sans">
      {/* Background Effects */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-green-500/10 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }} />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-purple-500/10 rounded-full blur-3xl" />
      </div>

      <div className="relative z-10">
        {/* Header */}
        <header className="border-b border-white/10 backdrop-blur-sm bg-slate-900/50 sticky top-0 z-50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between h-16">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-600 to-green-500 flex items-center justify-center shadow-lg">
                  <Image src="/logo.png" width={24} height={24} alt="Yahadeen Logo" className="object-contain" />
                </div>
                <div>
                  <h1 className="text-xl font-bold text-white">Yahadeen</h1>
                  <p className="text-xs text-slate-400">Pharmacy Management</p>
                </div>
              </div>
              <nav className="hidden md:flex items-center gap-8">
                <Link href="#features" className="text-sm text-slate-300 hover:text-white transition-colors">Features</Link>
                <Link href="#benefits" className="text-sm text-slate-300 hover:text-white transition-colors">Benefits</Link>
                <Link href="#testimonials" className="text-sm text-slate-300 hover:text-white transition-colors">Testimonials</Link>
              </nav>
              <div className="flex items-center gap-3">
                <Link 
                  href="/login"
                  className="px-4 py-2 text-sm font-medium text-slate-300 hover:text-white transition-colors"
                >
                  Sign In
                </Link>
                <Link 
                  href="/signup"
                  className="px-4 py-2 text-sm font-medium bg-gradient-to-r from-blue-600 to-green-500 rounded-lg hover:opacity-90 transition-opacity"
                >
                  Get Started
                </Link>
              </div>
            </div>
          </div>
        </header>

        {/* Hero Section */}
        <section className="py-16 lg:py-24">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">
              <div className="space-y-6">
                <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-blue-500/10 border border-blue-500/20">
                  <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                  <span className="text-sm text-blue-300">Trusted by 500+ Pharmacies</span>
                </div>
                
                <h2 className="text-4xl sm:text-5xl lg:text-6xl font-bold leading-tight">
                  Modern Pharmacy{' '}
                  <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-green-400">
                    Management System
                  </span>
                </h2>
                
                <p className="text-lg text-slate-400 leading-relaxed max-w-xl">
                  Streamline your pharmacy operations with intelligent inventory management, seamless order processing, and comprehensive customer service tools.
                </p>
                
                <div className="flex flex-col sm:flex-row gap-4">
                  <Link 
                    href="/signup"
                    className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-600 to-green-500 rounded-lg font-semibold hover:opacity-90 transition-opacity"
                  >
                    Start Free Trial
                    <ArrowRight className="w-4 h-4" />
                  </Link>
                  <Link 
                    href="#features"
                    className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-white/10 border border-white/20 rounded-lg font-semibold hover:bg-white/20 transition-colors"
                  >
                    <Play className="w-4 h-4" />
                    Watch Demo
                  </Link>
                </div>

                <div className="grid grid-cols-3 gap-6 pt-6 border-t border-white/10">
                  <div>
                    <div className="text-2xl font-bold text-white">500+</div>
                    <div className="text-sm text-slate-400">Pharmacies</div>
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-white">1M+</div>
                    <div className="text-sm text-slate-400">Orders</div>
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-white">99.9%</div>
                    <div className="text-sm text-slate-400">Uptime</div>
                  </div>
                </div>
              </div>

              <div className="relative order-first lg:order-last">
                <div className="absolute inset-0 bg-gradient-to-r from-blue-500/20 to-green-500/20 rounded-2xl blur-2xl" />
                <div className="relative bg-slate-800/50 backdrop-blur-sm rounded-2xl border border-white/10 p-6 space-y-4">
                  <div className="flex items-center gap-4 p-4 bg-slate-700/50 rounded-xl">
                    <div className="w-12 h-12 rounded-lg bg-blue-500/20 flex items-center justify-center flex-shrink-0">
                      <Package className="w-6 h-6 text-blue-400" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium text-white truncate">Inventory Status</div>
                      <div className="text-xs text-slate-400">1,234 items in stock</div>
                    </div>
                    <div className="text-green-400 text-sm font-medium flex-shrink-0">+12%</div>
                  </div>
                  
                  <div className="flex items-center gap-4 p-4 bg-slate-700/50 rounded-xl">
                    <div className="w-12 h-12 rounded-lg bg-green-500/20 flex items-center justify-center flex-shrink-0">
                      <ShoppingCart className="w-6 h-6 text-green-400" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium text-white truncate">Today's Orders</div>
                      <div className="text-xs text-slate-400">48 orders processed</div>
                    </div>
                    <div className="text-green-400 text-sm font-medium flex-shrink-0">+8%</div>
                  </div>
                  
                  <div className="flex items-center gap-4 p-4 bg-slate-700/50 rounded-xl">
                    <div className="w-12 h-12 rounded-lg bg-purple-500/20 flex items-center justify-center flex-shrink-0">
                      <Users className="w-6 h-6 text-purple-400" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium text-white truncate">Active Customers</div>
                      <div className="text-xs text-slate-400">2,847 customers</div>
                    </div>
                    <div className="text-green-400 text-sm font-medium flex-shrink-0">+15%</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section id="features" className="py-16 lg:py-20 bg-slate-800/30">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-12">
              <h3 className="text-3xl font-bold text-white mb-4">Powerful Features</h3>
              <p className="text-slate-400 max-w-2xl mx-auto">Everything you need to manage your pharmacy efficiently</p>
            </div>
            
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              <FeatureCard 
                icon={<Pill className="w-6 h-6" />}
                title="Smart Inventory"
                description="AI-powered stock management with automated reordering and low-stock alerts"
                color="blue"
              />
              <FeatureCard 
                icon={<ShoppingCart className="w-6 h-6" />}
                title="Order Management"
                description="Seamless order processing from prescription to delivery"
                color="green"
              />
              <FeatureCard 
                icon={<Users className="w-6 h-6" />}
                title="Customer Portal"
                description="Mobile app for customers to order and track prescriptions"
                color="purple"
              />
              <FeatureCard 
                icon={<Stethoscope className="w-6 h-6" />}
                title="Prescription Handling"
                description="Secure prescription upload and verification workflow"
                color="cyan"
              />
              <FeatureCard 
                icon={<BarChart3 className="w-6 h-6" />}
                title="Analytics Dashboard"
                description="Real-time insights on sales, inventory, and performance"
                color="yellow"
              />
              <FeatureCard 
                icon={<Shield className="w-6 h-6" />}
                title="Compliance Ready"
                description="Built-in regulatory compliance and audit trails"
                color="red"
              />
            </div>
          </div>
        </section>

        {/* How It Works */}
        <section className="py-16 lg:py-20">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-12">
              <h3 className="text-3xl font-bold text-white mb-4">How It Works</h3>
              <p className="text-slate-400 max-w-2xl mx-auto">Get started in minutes with our simple setup process</p>
            </div>
            
            <div className="grid md:grid-cols-3 gap-8">
              <StepCard 
                number="1"
                title="Sign Up"
                description="Create your account and configure your pharmacy profile"
                icon={<UserPlus className="w-8 h-8" />}
              />
              <StepCard 
                number="2"
                title="Add Products"
                description="Import your inventory or add products manually"
                icon={<Package className="w-8 h-8" />}
              />
              <StepCard 
                number="3"
                title="Start Selling"
                description="Begin accepting orders and managing customers"
                icon={<Zap className="w-8 h-8" />}
              />
            </div>
          </div>
        </section>

        {/* Benefits Section */}
        <section id="benefits" className="py-16 lg:py-20 bg-slate-800/30">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid lg:grid-cols-2 gap-12 items-center">
              <div>
                <h3 className="text-3xl font-bold text-white mb-6">Why Choose Yahadeen?</h3>
                <div className="space-y-6">
                  <BenefitItem 
                    icon={<TrendingUp className="w-5 h-5 text-green-500" />}
                    title="Increase Revenue by 30%"
                    description="Optimize pricing and inventory to maximize profit margins"
                  />
                  <BenefitItem 
                    icon={<Shield className="w-5 h-5 text-blue-500" />}
                    title="Reduce Errors by 90%"
                    description="Automated processes minimize human error in prescriptions"
                  />
                  <BenefitItem 
                    icon={<Clock className="w-5 h-5 text-purple-500" />}
                    title="Save 20 Hours Weekly"
                    description="Streamlined workflows free up time for patient care"
                  />
                  <BenefitItem 
                    icon={<HeartPulse className="w-5 h-5 text-red-500" />}
                    title="Improve Patient Care"
                    description="Focus on what matters most - your patients' health"
                  />
                </div>
              </div>
              
              <div className="relative">
                <div className="absolute inset-0 bg-gradient-to-r from-blue-500/20 to-green-500/20 rounded-2xl blur-2xl" />
                <div className="relative bg-slate-800/50 backdrop-blur-sm rounded-2xl border border-white/10 p-8">
                  <div className="flex items-center gap-4 mb-8">
                    <div className="w-16 h-16 rounded-xl bg-gradient-to-br from-blue-500 to-green-500 flex items-center justify-center flex-shrink-0">
                      <Award className="w-8 h-8 text-white" />
                    </div>
                    <div className="flex-1">
                      <div className="text-sm text-slate-400">Average Growth</div>
                      <div className="text-3xl font-bold text-white">+45%</div>
                    </div>
                  </div>
                  
                  <div className="space-y-4">
                    <GrowthMetric label="Revenue" value="+32%" color="blue" />
                    <GrowthMetric label="Orders" value="+28%" color="green" />
                    <GrowthMetric label="Customers" value="+41%" color="purple" />
                    <GrowthMetric label="Efficiency" value="+35%" color="cyan" />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Testimonials */}
        <section id="testimonials" className="py-16 lg:py-20">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-12">
              <h3 className="text-3xl font-bold text-white mb-4">Trusted by Pharmacy Owners</h3>
              <p className="text-slate-400 max-w-2xl mx-auto">See what our customers have to say about Yahadeen</p>
            </div>
            
            <div className="grid md:grid-cols-3 gap-6">
              <TestimonialCard 
                name="Dr. Adeola Johnson"
                role="Owner, HealthPlus Pharmacy"
                content="Yahadeen transformed our operations. We've reduced stockouts by 80% and increased revenue significantly."
                rating={5}
              />
              <TestimonialCard 
                name="Chukwuemeka Okafor"
                role="Manager, MedCare Pharmacy"
                content="The staff management features are incredible. Scheduling and performance tracking has never been easier."
                rating={5}
              />
              <TestimonialCard 
                name="Fatima Ibrahim"
                role="Director, Wellness Pharmacy"
                content="Customer satisfaction improved dramatically. The order processing is seamless and efficient."
                rating={5}
              />
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-20 bg-gradient-to-r from-blue-600/20 to-green-600/20">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <h3 className="text-3xl font-bold text-white mb-4">Ready to Transform Your Pharmacy?</h3>
            <p className="text-slate-300 mb-8 max-w-2xl mx-auto">
              Join hundreds of pharmacies already using Yahadeen to streamline operations and grow their business.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link 
                href="/signup"
                className="inline-flex items-center justify-center gap-2 px-8 py-4 bg-gradient-to-r from-blue-600 to-green-500 rounded-lg font-semibold hover:opacity-90 transition-opacity"
              >
                Start Free Trial
                <ArrowRight className="w-5 h-5" />
              </Link>
              <Link 
                href="/login"
                className="inline-flex items-center justify-center px-8 py-4 bg-white/10 border border-white/20 rounded-lg font-semibold hover:bg-white/20 transition-colors"
              >
                Sign In
              </Link>
            </div>
          </div>
        </section>

        {/* Footer */}
        <footer className="py-12 border-t border-white/10">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid md:grid-cols-4 gap-8 mb-8">
              <div>
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-600 to-green-500 flex items-center justify-center">
                    <Image src="/logo.png" width={20} height={20} alt="Yahadeen Logo" className="object-contain" />
                  </div>
                  <span className="font-bold text-white">Yahadeen</span>
                </div>
                <p className="text-sm text-slate-400">Modern pharmacy management for the digital age.</p>
              </div>
              
              <div>
                <h4 className="font-semibold text-white mb-4">Product</h4>
                <ul className="space-y-2 text-sm text-slate-400">
                  <li><Link href="#features" className="hover:text-white transition-colors">Features</Link></li>
                  <li><Link href="#benefits" className="hover:text-white transition-colors">Benefits</Link></li>
                  <li><Link href="#testimonials" className="hover:text-white transition-colors">Testimonials</Link></li>
                  <li><Link href="#" className="hover:text-white transition-colors">Pricing</Link></li>
                </ul>
              </div>
              
              <div>
                <h4 className="font-semibold text-white mb-4">Company</h4>
                <ul className="space-y-2 text-sm text-slate-400">
                  <li><Link href="#" className="hover:text-white transition-colors">About</Link></li>
                  <li><Link href="#" className="hover:text-white transition-colors">Blog</Link></li>
                  <li><Link href="#" className="hover:text-white transition-colors">Careers</Link></li>
                  <li><Link href="#" className="hover:text-white transition-colors">Contact</Link></li>
                </ul>
              </div>
              
              <div>
                <h4 className="font-semibold text-white mb-4">Legal</h4>
                <ul className="space-y-2 text-sm text-slate-400">
                  <li><Link href="#" className="hover:text-white transition-colors">Privacy Policy</Link></li>
                  <li><Link href="#" className="hover:text-white transition-colors">Terms of Service</Link></li>
                  <li><Link href="#" className="hover:text-white transition-colors">Cookie Policy</Link></li>
                </ul>
              </div>
            </div>
            
            <div className="pt-8 border-t border-white/10 text-center text-sm text-slate-400">
              <p>&copy; {new Date().getFullYear()} Yahadeen. All rights reserved.</p>
            </div>
          </div>
        </footer>
      </div>
    </div>
  );
}

function FeatureCard({ icon, title, description, color }: { 
  icon: React.ReactNode; 
  title: string; 
  description: string;
  color: 'blue' | 'green' | 'purple' | 'cyan' | 'yellow' | 'red';
}) {
  const colorClasses = {
    blue: 'bg-blue-500/10 border-blue-500/20 hover:border-blue-500/40',
    green: 'bg-green-500/10 border-green-500/20 hover:border-green-500/40',
    purple: 'bg-purple-500/10 border-purple-500/20 hover:border-purple-500/40',
    cyan: 'bg-cyan-500/10 border-cyan-500/20 hover:border-cyan-500/40',
    yellow: 'bg-yellow-500/10 border-yellow-500/20 hover:border-yellow-500/40',
    red: 'bg-red-500/10 border-red-500/20 hover:border-red-500/40'
  };

  const iconColor = {
    blue: 'text-blue-400',
    green: 'text-green-400',
    purple: 'text-purple-400',
    cyan: 'text-cyan-400',
    yellow: 'text-yellow-400',
    red: 'text-red-400'
  };

  return (
    <div className={`p-6 rounded-xl border ${colorClasses[color]} hover:bg-slate-700/50 transition-all group`}>
      <div className={`w-12 h-12 rounded-lg ${iconColor[color]} bg-slate-800 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform`}>
        {icon}
      </div>
      <h4 className="text-lg font-semibold text-white mb-2">{title}</h4>
      <p className="text-sm text-slate-400 leading-relaxed">{description}</p>
    </div>
  );
}

function StepCard({ number, title, description, icon }: { 
  number: string;
  title: string; 
  description: string;
  icon: React.ReactNode;
}) {
  return (
    <div className="relative">
      <div className="absolute -top-4 -left-4 w-8 h-8 rounded-full bg-gradient-to-br from-blue-600 to-green-500 flex items-center justify-center text-sm font-bold text-white z-10">
        {number}
      </div>
      <div className="bg-slate-800/50 backdrop-blur-sm rounded-xl border border-white/10 p-6 pt-8">
        <div className="w-12 h-12 rounded-lg bg-slate-700 flex items-center justify-center mb-4 text-slate-300">
          {icon}
        </div>
        <h4 className="text-lg font-semibold text-white mb-2">{title}</h4>
        <p className="text-sm text-slate-400 leading-relaxed">{description}</p>
      </div>
    </div>
  );
}

function BenefitItem({ icon, title, description }: { 
  icon: React.ReactNode; 
  title: string; 
  description: string;
}) {
  return (
    <div className="flex gap-4">
      <div className="flex-shrink-0 w-10 h-10 rounded-lg bg-slate-800 flex items-center justify-center">
        {icon}
      </div>
      <div className="flex-1">
        <h4 className="font-semibold text-white mb-1">{title}</h4>
        <p className="text-sm text-slate-400 leading-relaxed">{description}</p>
      </div>
    </div>
  );
}

function GrowthMetric({ label, value, color }: { 
  label: string; 
  value: string;
  color: 'blue' | 'green' | 'purple' | 'cyan';
}) {
  const colorClasses = {
    blue: 'text-blue-400',
    green: 'text-green-400',
    purple: 'text-purple-400',
    cyan: 'text-cyan-400'
  };

  return (
    <div className="flex items-center justify-between p-3 bg-slate-700/50 rounded-lg">
      <span className="text-sm text-slate-300">{label}</span>
      <span className={`text-sm font-semibold ${colorClasses[color]}`}>{value}</span>
    </div>
  );
}

function TestimonialCard({ name, role, content, rating }: { 
  name: string; 
  role: string; 
  content: string;
  rating: number;
}) {
  return (
    <div className="bg-slate-800/50 backdrop-blur-sm rounded-xl border border-white/10 p-6">
      <div className="flex gap-1 mb-4">
        {[...Array(rating)].map((_, i) => (
          <Star key={i} className="w-4 h-4 fill-yellow-400 text-yellow-400" />
        ))}
      </div>
      <p className="text-slate-300 leading-relaxed mb-4">{content}</p>
      <div>
        <p className="font-semibold text-white">{name}</p>
        <p className="text-sm text-slate-400">{role}</p>
      </div>
    </div>
  );
}

