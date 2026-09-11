import React from "react";
import Image from "next/image";
import Link from "next/link";
import { Package, DollarSign, AlertTriangle, BarChart3, Users, Bell, Shield, Zap, Clock, CheckCircle, ArrowRight, Star, TrendingUp } from "lucide-react";
import "./landing.css";

export default function AdminDashboard() {
  return (
    <div id="yahadeen-page" className="relative flex min-h-screen flex-col items-center overflow-hidden bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 font-sans text-slate-100">
      {/* Animated Background Orbs */}
      <div className="fixed top-0 left-1/4 h-[600px] w-[600px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-[#0036B6] opacity-30 blur-[150px] animate-pulse"></div>
      <div className="fixed bottom-0 right-1/4 h-[700px] w-[700px] translate-x-1/3 translate-y-1/3 rounded-full bg-[#10BF41] opacity-20 blur-[180px] animate-pulse" style={{ animationDelay: '1s' }}></div>
      <div className="fixed top-1/2 left-1/2 h-[400px] w-[400px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-purple-600 opacity-10 blur-[120px]"></div>

      <main 
        className="relative z-10 flex w-full max-w-7xl flex-col gap-24 mx-auto"
        style={{ paddingLeft: '2rem', paddingRight: '2rem', paddingTop: '4rem', paddingBottom: '4rem' }}
      >
        {/* Header */}
        <header className="flex items-center justify-between px-4 py-4">
          <div className="flex items-center gap-4">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-[#0036B6] to-[#10BF41] p-3 shadow-2xl">
              <Image src="/logo.png" width={32} height={32} alt="Yahadeen Logo" className="object-contain" />
            </div>
            <div>
              <h1 className="text-2xl font-bold tracking-wider text-white">Yahadeen</h1>
              <p className="text-sm text-slate-400">Pharmacy Management System</p>
            </div>
          </div>
          <div className="flex gap-3">
            <Link 
              href="/login"
              className="rounded-full bg-white/10 px-6 py-2.5 font-medium text-white backdrop-blur-md transition-all hover:bg-white/20 hover:scale-105"
            >
              Sign In
            </Link>
            <Link 
              href="/signup"
              className="rounded-full bg-gradient-to-r from-[#0036B6] to-[#10BF41] px-6 py-2.5 font-semibold text-white shadow-lg transition-all hover:scale-105"
            >
              Get Started
            </Link>
          </div>
        </header>

        {/* Hero Section */}
        <section className="flex flex-col items-center text-center" style={{ paddingTop: '3rem', paddingBottom: '3rem' }}>
          <div className="inline-flex items-center gap-2 rounded-full bg-white/5 px-4 py-2 text-sm text-slate-300 backdrop-blur-sm border border-white/10 mb-8">
            <span className="h-2 w-2 rounded-full bg-[#10BF41] animate-pulse"></span>
            Trusted by 500+ Pharmacies Across Nigeria
          </div>
          <h2 className="mb-6 max-w-4xl text-5xl font-black leading-tight tracking-tight text-white sm:text-6xl lg:text-7xl">
            Transform Your Pharmacy{' '}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#10BF41] via-emerald-400 to-[#0036B6]">
              Operations Today
            </span>
          </h2>
          <p className="max-w-2xl text-lg text-slate-400 leading-relaxed mb-8">
            Streamline inventory management, automate order processing, and deliver exceptional customer service with our all-in-one pharmacy management platform.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 mb-12">
            <Link 
              href="/signup" 
              className="group rounded-full bg-gradient-to-r from-[#0036B6] to-[#10BF41] px-8 py-4 font-semibold text-white shadow-lg shadow-blue-500/30 transition-all hover:scale-105 hover:shadow-blue-500/50 flex items-center gap-2"
            >
              Get Started
              <ArrowRight className="h-5 w-5 group-hover:translate-x-1 transition-transform" />
            </Link>
            <Link 
              href="#features" 
              className="rounded-full bg-white/10 px-8 py-4 font-semibold text-white backdrop-blur-md border border-white/20 transition-all hover:bg-white/20 hover:scale-105"
            >
              Learn More
            </Link>
          </div>
          
          {/* Stats */}
          <div className="flex flex-wrap justify-center gap-8 sm:gap-16">
            <StatItem value="500+" label="Pharmacies" />
            <StatItem value="1M+" label="Orders Processed" />
            <StatItem value="99.9%" label="Uptime" />
            <StatItem value="24/7" label="Support" />
          </div>
        </section>

        {/* Features Section */}
        <section id="features" style={{ paddingTop: '3rem', paddingBottom: '3rem' }}>
          <div className="text-center mb-12">
            <h3 className="text-3xl font-bold text-white mb-4">Everything You Need to Succeed</h3>
            <p className="text-slate-400 max-w-2xl mx-auto">Powerful features designed to help you manage your pharmacy efficiently and grow your business.</p>
          </div>
          <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
            <FeatureCard 
              icon={<BarChart3 className="h-8 w-8" />}
              title="Real-time Analytics"
              description="Track sales, inventory, and performance with live dashboards and detailed reports."
              color="blue"
            />
            <FeatureCard 
              icon={<Package className="h-8 w-8" />}
              title="Smart Inventory"
              description="Automated stock tracking, low-stock alerts, and predictive ordering to never run out."
              color="green"
            />
            <FeatureCard 
              icon={<Users className="h-8 w-8" />}
              title="Staff Management"
              description="Schedule shifts, track performance, and manage permissions for your team."
              color="purple"
            />
            <FeatureCard 
              icon={<Zap className="h-8 w-8" />}
              title="Lightning Fast"
              description="Optimized performance ensures your operations run smoothly even during peak hours."
              color="yellow"
            />
            <FeatureCard 
              icon={<Shield className="h-8 w-8" />}
              title="Bank-Grade Security"
              description="End-to-end encryption and role-based access protect your sensitive data."
              color="red"
            />
            <FeatureCard 
              icon={<Clock className="h-8 w-8" />}
              title="24/7 Availability"
              description="Cloud-based platform accessible anytime, anywhere on any device."
              color="cyan"
            />
          </div>
        </section>

        {/* Benefits Section */}
        <section className="bg-white/5 rounded-3xl p-10 backdrop-blur-sm border border-white/10">
          <div className="grid sm:grid-cols-2 gap-12 items-center">
            <div>
              <h3 className="text-3xl font-bold text-white mb-6">Why Choose Yahadeen?</h3>
              <div className="space-y-4">
                <BenefitItem 
                  icon={<CheckCircle className="h-5 w-5 text-[#10BF41]" />}
                  title="Increase Revenue by 30%"
                  description="Optimize pricing and inventory to maximize your profit margins."
                />
                <BenefitItem 
                  icon={<CheckCircle className="h-5 w-5 text-[#10BF41]" />}
                  title="Reduce Errors by 90%"
                  description="Automated processes minimize human error in prescription handling."
                />
                <BenefitItem 
                  icon={<CheckCircle className="h-5 w-5 text-[#10BF41]" />}
                  title="Save 20 Hours Weekly"
                  description="Streamlined workflows free up your time for patient care."
                />
                <BenefitItem 
                  icon={<CheckCircle className="h-5 w-5 text-[#10BF41]" />}
                  title="Improve Customer Satisfaction"
                  description="Faster service and accurate orders build customer loyalty."
                />
              </div>
            </div>
            <div className="relative">
              <div className="absolute inset-0 bg-gradient-to-r from-[#0036B6] to-[#10BF41] rounded-2xl blur-2xl opacity-30"></div>
              <div className="relative bg-slate-800 rounded-2xl p-8 border border-white/10">
                <div className="flex items-center gap-3 mb-6">
                  <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[#10BF41]/20">
                    <TrendingUp className="h-6 w-6 text-[#10BF41]" />
                  </div>
                  <div>
                    <p className="text-sm text-slate-400">Average Growth</p>
                    <p className="text-2xl font-bold text-white">+45%</p>
                  </div>
                </div>
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-slate-400">Revenue</span>
                    <span className="text-green-400 font-semibold">+32%</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-slate-400">Orders</span>
                    <span className="text-green-400 font-semibold">+28%</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-slate-400">Customers</span>
                    <span className="text-green-400 font-semibold">+41%</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Testimonials */}
        <section style={{ paddingTop: '3rem', paddingBottom: '3rem' }}>
          <div className="text-center mb-12">
            <h3 className="text-3xl font-bold text-white mb-4">Loved by Pharmacy Owners</h3>
            <p className="text-slate-400">See what our customers have to say about Yahadeen.</p>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-8">
            <TestimonialCard 
              name="Dr. Adeola Johnson"
              role="Owner, HealthPlus Pharmacy"
              content="Yahadeen transformed how we manage our inventory. We've reduced stockouts by 80% and increased our revenue significantly."
              rating={5}
            />
            <TestimonialCard 
              name="Chukwuemeka Okafor"
              role="Manager, MedCare Pharmacy"
              content="The staff management features are incredible. Scheduling and tracking performance has never been easier."
              rating={5}
            />
            <TestimonialCard 
              name="Fatima Ibrahim"
              role="Director, Wellness Pharmacy"
              content="Customer satisfaction has improved dramatically since we started using Yahadeen. The order processing is seamless."
              rating={5}
            />
          </div>
        </section>

        {/* CTA Section */}
        <section className="text-center" style={{ paddingTop: '3rem', paddingBottom: '3rem' }}>
          <div className="max-w-3xl mx-auto">
            <h3 className="text-3xl font-bold text-white mb-4">Ready to Transform Your Pharmacy?</h3>
            <p className="text-slate-400 mb-8">Join hundreds of pharmacies already using Yahadeen to grow their business.</p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link 
                href="/signup" 
                className="group rounded-full bg-gradient-to-r from-[#0036B6] to-[#10BF41] px-8 py-4 font-semibold text-white shadow-lg shadow-blue-500/30 transition-all hover:scale-105 hover:shadow-blue-500/50 flex items-center justify-center gap-2"
              >
                Get Started
                <ArrowRight className="h-5 w-5 group-hover:translate-x-1 transition-transform" />
              </Link>
              <Link 
                href="/login" 
                className="rounded-full bg-white/10 px-8 py-4 font-semibold text-white backdrop-blur-md border border-white/20 transition-all hover:bg-white/20 hover:scale-105"
              >
                Sign In
              </Link>
            </div>
          </div>
        </section>

        {/* Footer */}
        <footer className="py-8 text-center text-sm text-slate-500 border-t border-white/10">
          <p>&copy; {new Date().getFullYear()} Yahadeen. All rights reserved.</p>
          <div className="flex justify-center gap-6 mt-4">
            <Link href="#" className="hover:text-white transition-colors">Privacy Policy</Link>
            <Link href="#" className="hover:text-white transition-colors">Terms of Service</Link>
            <Link href="#" className="hover:text-white transition-colors">Contact</Link>
          </div>
        </footer>
      </main>
    </div>
  );
}

function StatItem({ value, label }: { value: string; label: string }) {
  return (
    <div className="text-center">
      <div className="text-3xl font-bold text-white">{value}</div>
      <div className="text-sm text-slate-400">{label}</div>
    </div>
  );
}

function FeatureCard({ icon, title, description, color }: { 
  icon: React.ReactNode; 
  title: string; 
  description: string;
  color: 'blue' | 'green' | 'purple' | 'yellow' | 'red' | 'cyan';
}) {
  const colorClasses = {
    blue: 'border-blue-500/30 shadow-blue-500/10 hover:shadow-blue-500/20',
    green: 'border-green-500/30 shadow-green-500/10 hover:shadow-green-500/20',
    purple: 'border-purple-500/30 shadow-purple-500/10 hover:shadow-purple-500/20',
    yellow: 'border-yellow-500/30 shadow-yellow-500/10 hover:shadow-yellow-500/20',
    red: 'border-red-500/30 shadow-red-500/10 hover:shadow-red-500/20',
    cyan: 'border-cyan-500/30 shadow-cyan-500/10 hover:shadow-cyan-500/20'
  };

  const iconColor = {
    blue: 'text-blue-400',
    green: 'text-green-400',
    purple: 'text-purple-400',
    yellow: 'text-yellow-400',
    red: 'text-red-400',
    cyan: 'text-cyan-400'
  };

  return (
    <div className={`flex flex-col gap-4 rounded-2xl border border-white/10 bg-white/5 p-6 shadow-xl backdrop-blur-xl transition-all hover:bg-white/10 hover:scale-105 ${colorClasses[color]}`}>
      <div className={`p-3 rounded-xl bg-white/5 ${iconColor[color]}`}>
        {icon}
      </div>
      <div>
        <h3 className="text-lg font-semibold text-white mb-2">{title}</h3>
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
      <div className="flex-shrink-0 mt-1">{icon}</div>
      <div>
        <h4 className="font-semibold text-white mb-1">{title}</h4>
        <p className="text-sm text-slate-400">{description}</p>
      </div>
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
    <div className="flex flex-col gap-4 rounded-2xl border border-white/10 bg-white/5 p-6 shadow-xl backdrop-blur-xl">
      <div className="flex gap-1">
        {[...Array(rating)].map((_, i) => (
          <Star key={i} className="h-4 w-4 fill-yellow-400 text-yellow-400" />
        ))}
      </div>
      <p className="text-slate-300 leading-relaxed">{content}</p>
      <div>
        <p className="font-semibold text-white">{name}</p>
        <p className="text-sm text-slate-400">{role}</p>
      </div>
    </div>
  );
}