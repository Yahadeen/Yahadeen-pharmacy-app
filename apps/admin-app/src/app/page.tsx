import React from "react";
import Image from "next/image";
import Link from "next/link";
import { ArrowRight, Package, ShoppingCart, Users, Shield, BarChart3, Lock, Truck, FileText, Bell, Zap } from "lucide-react";

export default function AdminDashboard() {
  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', background: 'var(--app-bg)' }}>
      {/* Header */}
      <header style={{ borderBottom: '1px solid var(--border)', background: 'var(--surface)', padding: '16px 24px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', maxWidth: '1200px', margin: '0 auto' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{ width: 40, height: 40, borderRadius: 8, background: 'var(--brand)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Image src="/logo.png" width={24} height={24} alt="Yahadeen Logo" />
            </div>
            <div>
              <h1 style={{ fontSize: 20, fontWeight: 800, margin: 0, color: 'var(--text)' }}>Yahadeen</h1>
              <p style={{ fontSize: 12, color: 'var(--text-muted)', margin: 0 }}>Pharmacy Management</p>
            </div>
          </div>
          <div style={{ display: 'flex', gap: 12 }}>
            <Link 
              href="/login"
              style={{ padding: '8px 16px', borderRadius: 8, border: '1px solid var(--border)', background: 'var(--surface-2)', color: 'var(--text)', fontSize: 14, fontWeight: 600, textDecoration: 'none' }}
            >
              Sign In
            </Link>
            <Link 
              href="/signup"
              style={{ padding: '8px 16px', borderRadius: 8, border: 'none', background: 'var(--brand)', color: 'white', fontSize: 14, fontWeight: 600, textDecoration: 'none' }}
            >
              Get Started
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section style={{ padding: '80px 24px', background: 'var(--surface)' }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 48, alignItems: 'center' }}>
          <div>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '8px 16px', borderRadius: 20, background: 'var(--brand-soft)', border: '1px solid var(--brand)', marginBottom: 24 }}>
              <div style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--accent)' }} />
              <span style={{ fontSize: 14, color: 'var(--brand)', fontWeight: 600 }}>Trusted by 500+ Pharmacies</span>
            </div>
            
            <h2 style={{ fontSize: 48, fontWeight: 800, margin: '0 0 16px', color: 'var(--text)', lineHeight: 1.2 }}>
              Modern Pharmacy{' '}
              <span style={{ color: 'var(--brand)' }}>Management System</span>
            </h2>
            
            <p style={{ fontSize: 18, color: 'var(--text-muted)', marginBottom: 32, lineHeight: 1.6, maxWidth: 500 }}>
              Streamline your pharmacy operations with intelligent inventory management, seamless order processing, and comprehensive customer service tools.
            </p>
            
            <div style={{ display: 'flex', gap: 12 }}>
              <Link 
                href="/signup"
                style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '12px 24px', borderRadius: 8, border: 'none', background: 'var(--brand)', color: 'white', fontSize: 16, fontWeight: 600, textDecoration: 'none' }}
              >
                Start Free Trial
                <ArrowRight style={{ width: 16, height: 16 }} />
              </Link>
              <Link 
                href="#features"
                style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '12px 24px', borderRadius: 8, border: '1px solid var(--border)', background: 'var(--surface-2)', color: 'var(--text)', fontSize: 16, fontWeight: 600, textDecoration: 'none' }}
              >
                Learn More
              </Link>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 24, marginTop: 32, paddingTop: 32, borderTop: '1px solid var(--border)' }}>
              <div>
                <div style={{ fontSize: 32, fontWeight: 800, color: 'var(--text)', marginBottom: 4 }}>500+</div>
                <div style={{ fontSize: 14, color: 'var(--text-muted)' }}>Pharmacies</div>
              </div>
              <div>
                <div style={{ fontSize: 32, fontWeight: 800, color: 'var(--text)', marginBottom: 4 }}>1M+</div>
                <div style={{ fontSize: 14, color: 'var(--text-muted)' }}>Orders</div>
              </div>
              <div>
                <div style={{ fontSize: 32, fontWeight: 800, color: 'var(--text)', marginBottom: 4 }}>99.9%</div>
                <div style={{ fontSize: 14, color: 'var(--text-muted)' }}>Uptime</div>
              </div>
            </div>
          </div>

          <div style={{ position: 'relative' }}>
            <div style={{ position: 'absolute', inset: 0, background: 'var(--brand)', borderRadius: 16, opacity: 0.1, filter: 'blur(20px)' }} />
            <div style={{ position: 'relative', background: 'var(--surface-2)', borderRadius: 16, border: '1px solid var(--border)', padding: 24, display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 16, padding: 16, background: 'var(--surface)', borderRadius: 12 }}>
                <div style={{ width: 48, height: 48, borderRadius: 12, background: 'var(--brand-soft)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Package style={{ width: 24, height: 24, color: 'var(--brand)' }} />
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 16, fontWeight: 600, color: 'var(--text)', marginBottom: 4 }}>Inventory Status</div>
                  <div style={{ fontSize: 14, color: 'var(--text-muted)' }}>1,234 items in stock</div>
                </div>
                <div style={{ fontSize: 16, fontWeight: 600, color: 'var(--accent)' }}>+12%</div>
              </div>
              
              <div style={{ display: 'flex', alignItems: 'center', gap: 16, padding: 16, background: 'var(--surface)', borderRadius: 12 }}>
                <div style={{ width: 48, height: 48, borderRadius: 12, background: 'var(--accent-soft)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <ShoppingCart style={{ width: 24, height: 24, color: 'var(--accent)' }} />
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 16, fontWeight: 600, color: 'var(--text)', marginBottom: 4 }}>Today's Orders</div>
                  <div style={{ fontSize: 14, color: 'var(--text-muted)' }}>48 orders processed</div>
                </div>
                <div style={{ fontSize: 16, fontWeight: 600, color: 'var(--accent)' }}>+8%</div>
              </div>
              
              <div style={{ display: 'flex', alignItems: 'center', gap: 16, padding: 16, background: 'var(--surface)', borderRadius: 12 }}>
                <div style={{ width: 48, height: 48, borderRadius: 12, background: 'var(--surface-3)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Users style={{ width: 24, height: 24, color: 'var(--text-muted)' }} />
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 16, fontWeight: 600, color: 'var(--text)', marginBottom: 4 }}>Active Customers</div>
                  <div style={{ fontSize: 14, color: 'var(--text-muted)' }}>2,847 customers</div>
                </div>
                <div style={{ fontSize: 16, fontWeight: 600, color: 'var(--accent)' }}>+15%</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" style={{ padding: '80px 24px', background: 'var(--app-bg)' }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: 48 }}>
            <h3 style={{ fontSize: 32, fontWeight: 800, margin: '0 0 12px', color: 'var(--text)' }}>Powerful Features</h3>
            <p style={{ fontSize: 16, color: 'var(--text-muted)', maxWidth: 600, margin: '0 auto' }}>Everything you need to manage your pharmacy efficiently</p>
          </div>
          
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 24 }}>
            <FeatureCard 
              icon={<Package style={{ width: 24, height: 24 }} />}
              title="Smart Inventory"
              description="AI-powered stock management with automated reordering and low-stock alerts"
            />
            <FeatureCard 
              icon={<ShoppingCart style={{ width: 24, height: 24 }} />}
              title="Order Management"
              description="Seamless order processing from prescription to delivery"
            />
            <FeatureCard 
              icon={<Users style={{ width: 24, height: 24 }} />}
              title="Customer Portal"
              description="Mobile app for customers to order and track prescriptions"
            />
            <FeatureCard 
              icon={<Shield style={{ width: 24, height: 24 }} />}
              title="Prescription Handling"
              description="Secure prescription upload and verification workflow"
            />
            <FeatureCard 
              icon={<BarChart3 style={{ width: 24, height: 24 }} />}
              title="Analytics Dashboard"
              description="Real-time insights on sales, inventory, and performance"
            />
            <FeatureCard 
              icon={<Lock style={{ width: 24, height: 24 }} />}
              title="Compliance Ready"
              description="Built-in regulatory compliance and audit trails"
            />
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section style={{ padding: '80px 24px', background: 'var(--surface)' }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: 48 }}>
            <h3 style={{ fontSize: 32, fontWeight: 800, margin: '0 0 12px', color: 'var(--text)' }}>How It Works</h3>
            <p style={{ fontSize: 16, color: 'var(--text-muted)', maxWidth: 600, margin: '0 auto' }}>Get started in minutes with our simple setup process</p>
          </div>
          
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 32 }}>
            <StepCard 
              number="1"
              title="Sign Up"
              description="Create your account and configure your pharmacy profile"
              icon={<Zap style={{ width: 32, height: 32 }} />}
            />
            <StepCard 
              number="2"
              title="Add Products"
              description="Import your inventory or add products manually"
              icon={<Package style={{ width: 32, height: 32 }} />}
            />
            <StepCard 
              number="3"
              title="Start Selling"
              description="Begin accepting orders and managing customers"
              icon={<Users style={{ width: 32, height: 32 }} />}
            />
          </div>
        </div>
      </section>

      {/* Benefits Section */}
      <section id="benefits" style={{ padding: '80px 24px', background: 'var(--app-bg)' }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 48, alignItems: 'center' }}>
          <div>
            <h3 style={{ fontSize: 32, fontWeight: 800, margin: '0 0 24px', color: 'var(--text)' }}>Why Choose Yahadeen?</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
              <BenefitItem 
                icon={<ArrowRight style={{ width: 20, height: 20, color: 'var(--accent)' }} />}
                title="Increase Revenue by 30%"
                description="Optimize pricing and inventory to maximize profit margins"
              />
              <BenefitItem 
                icon={<Shield style={{ width: 20, height: 20, color: 'var(--brand)' }} />}
                title="Reduce Errors by 90%"
                description="Automated processes minimize human error in prescriptions"
              />
              <BenefitItem 
                icon={<Bell style={{ width: 20, height: 20, color: 'var(--surface-3)' }} />}
                title="Save 20 Hours Weekly"
                description="Streamlined workflows free up time for patient care"
              />
              <BenefitItem 
                icon={<Lock style={{ width: 20, height: 20, color: 'var(--surface-3)' }} />}
                title="Improve Patient Care"
                description="Focus on what matters most - your patients' health"
              />
            </div>
          </div>
          
          <div style={{ background: 'var(--surface)', borderRadius: 16, border: '1px solid var(--border)', padding: 32 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 32 }}>
              <div style={{ width: 64, height: 64, borderRadius: 12, background: 'var(--brand)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Zap style={{ width: 32, height: 32, color: 'white' }} />
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 14, color: 'var(--text-muted)', marginBottom: 4 }}>Average Growth</div>
                <div style={{ fontSize: 48, fontWeight: 800, color: 'var(--text)' }}>+45%</div>
              </div>
            </div>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <GrowthMetric label="Revenue" value="+32%" />
              <GrowthMetric label="Orders" value="+28%" />
              <GrowthMetric label="Customers" value="+41%" />
              <GrowthMetric label="Efficiency" value="+35%" />
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section style={{ padding: '80px 24px', background: 'var(--brand)', textAlign: 'center' }}>
        <div style={{ maxWidth: 800, margin: '0 auto' }}>
          <h3 style={{ fontSize: 32, fontWeight: 800, margin: '0 0 16px', color: 'white' }}>Ready to Transform Your Pharmacy?</h3>
          <p style={{ fontSize: 18, color: 'rgba(255,255,255,0.8)', marginBottom: 32, maxWidth: 600, margin: '0 auto 32px' }}>
            Join hundreds of pharmacies already using Yahadeen to streamline operations and grow their business.
          </p>
          <div style={{ display: 'flex', gap: 12, justifyContent: 'center' }}>
            <Link 
              href="/signup"
              style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '16px 32px', borderRadius: 8, border: 'none', background: 'white', color: 'var(--brand)', fontSize: 16, fontWeight: 600, textDecoration: 'none' }}
            >
              Start Free Trial
              <ArrowRight style={{ width: 20, height: 20 }} />
            </Link>
            <Link 
              href="/login"
              style={{ padding: '16px 32px', borderRadius: 8, border: '1px solid rgba(255,255,255,0.3)', background: 'transparent', color: 'white', fontSize: 16, fontWeight: 600, textDecoration: 'none' }}
            >
              Sign In
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer style={{ padding: '48px 24px', borderTop: '1px solid var(--border)', background: 'var(--surface)' }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto', display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 32, marginBottom: 32 }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
              <div style={{ width: 32, height: 32, borderRadius: 8, background: 'var(--brand)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Image src="/logo.png" width={20} height={20} alt="Yahadeen Logo" />
              </div>
              <span style={{ fontWeight: 700, color: 'var(--text)' }}>Yahadeen</span>
            </div>
            <p style={{ fontSize: 14, color: 'var(--text-muted)' }}>Modern pharmacy management for the digital age.</p>
          </div>
          
          <div>
            <h4 style={{ fontSize: 16, fontWeight: 700, color: 'var(--text)', marginBottom: 16 }}>Product</h4>
            <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: 8 }}>
              <li><Link href="#features" style={{ fontSize: 14, color: 'var(--text-muted)', textDecoration: 'none' }}>Features</Link></li>
              <li><Link href="#benefits" style={{ fontSize: 14, color: 'var(--text-muted)', textDecoration: 'none' }}>Benefits</Link></li>
              <li><Link href="#" style={{ fontSize: 14, color: 'var(--text-muted)', textDecoration: 'none' }}>Pricing</Link></li>
            </ul>
          </div>
          
          <div>
            <h4 style={{ fontSize: 16, fontWeight: 700, color: 'var(--text)', marginBottom: 16 }}>Company</h4>
            <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: 8 }}>
              <li><Link href="#" style={{ fontSize: 14, color: 'var(--text-muted)', textDecoration: 'none' }}>About</Link></li>
              <li><Link href="#" style={{ fontSize: 14, color: 'var(--text-muted)', textDecoration: 'none' }}>Contact</Link></li>
            </ul>
          </div>
          
          <div>
            <h4 style={{ fontSize: 16, fontWeight: 700, color: 'var(--text)', marginBottom: 16 }}>Legal</h4>
            <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: 8 }}>
              <li><Link href="#" style={{ fontSize: 14, color: 'var(--text-muted)', textDecoration: 'none' }}>Privacy Policy</Link></li>
              <li><Link href="#" style={{ fontSize: 14, color: 'var(--text-muted)', textDecoration: 'none' }}>Terms of Service</Link></li>
            </ul>
          </div>
        </div>
        
        <div style={{ maxWidth: '1200px', margin: '0 auto', paddingTop: 32, borderTop: '1px solid var(--border)', textAlign: 'center' }}>
          <p style={{ fontSize: 14, color: 'var(--text-muted)', margin: 0 }}>© 2026 Yahadeen. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}

function FeatureCard({ icon, title, description }: { icon: React.ReactNode, title: string, description: string }) {
  return (
    <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 16, padding: 24, display: 'flex', flexDirection: 'column', gap: 16 }}>
      <div style={{ width: 48, height: 48, borderRadius: 12, background: 'var(--brand-soft)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ color: 'var(--brand)' }}>{icon}</div>
      </div>
      <div>
        <h4 style={{ fontSize: 18, fontWeight: 700, color: 'var(--text)', marginBottom: 8 }}>{title}</h4>
        <p style={{ fontSize: 14, color: 'var(--text-muted)', lineHeight: 1.5 }}>{description}</p>
      </div>
    </div>
  );
}

function StepCard({ number, title, description, icon }: { number: string, title: string, description: string, icon: React.ReactNode }) {
  return (
    <div style={{ textAlign: 'center' }}>
      <div style={{ width: 64, height: 64, borderRadius: 16, background: 'var(--brand)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
        <span style={{ fontSize: 32, fontWeight: 800, color: 'white' }}>{number}</span>
      </div>
      <div style={{ width: 48, height: 48, borderRadius: 12, background: 'var(--surface-2)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
        <div style={{ color: 'var(--text-muted)' }}>{icon}</div>
      </div>
      <h4 style={{ fontSize: 20, fontWeight: 700, color: 'var(--text)', marginBottom: 8 }}>{title}</h4>
      <p style={{ fontSize: 14, color: 'var(--text-muted)', lineHeight: 1.5 }}>{description}</p>
    </div>
  );
}

function BenefitItem({ icon, title, description }: { icon: React.ReactNode, title: string, description: string }) {
  return (
    <div style={{ display: 'flex', gap: 16, alignItems: 'flex-start' }}>
      <div style={{ width: 40, height: 40, borderRadius: 8, background: 'var(--surface-2)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
        {icon}
      </div>
      <div>
        <h4 style={{ fontSize: 18, fontWeight: 700, color: 'var(--text)', marginBottom: 4 }}>{title}</h4>
        <p style={{ fontSize: 14, color: 'var(--text-muted)', lineHeight: 1.5 }}>{description}</p>
      </div>
    </div>
  );
}

function GrowthMetric({ label, value }: { label: string, value: string }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px', background: 'var(--surface-2)', borderRadius: 8 }}>
      <span style={{ fontSize: 14, color: 'var(--text)' }}>{label}</span>
      <span style={{ fontSize: 16, fontWeight: 700, color: 'var(--accent)' }}>{value}</span>
    </div>
  );
}
