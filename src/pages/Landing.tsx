import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { ArrowRight, Shield, Users, TrendingUp } from 'lucide-react';

const Landing = () => {
  const navigate = useNavigate();
  const { user } = useAuth();

  const handleGetStarted = () => {
    if (user) {
      navigate('/dashboard');
    } else {
      navigate('/auth');
    }
  };

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="relative gradient-hero text-primary-foreground py-24 px-6 overflow-hidden">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-20 left-20 w-72 h-72 bg-accent rounded-full blur-3xl"></div>
          <div className="absolute bottom-20 right-20 w-96 h-96 bg-accent rounded-full blur-3xl"></div>
        </div>
        
        <div className="container mx-auto max-w-6xl relative z-10">
          <div className="text-center space-y-6">
            <h1 className="text-5xl md:text-6xl font-bold tracking-tight">
              Sistema de Gestión Integral
            </h1>
            <p className="text-xl md:text-2xl text-primary-foreground/80 max-w-2xl mx-auto">
              Plataforma profesional para la gestión eficiente de empresas, municipalidades y expertos
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center pt-8">
              <Button
                size="lg"
                variant="secondary"
                onClick={handleGetStarted}
                className="text-lg shadow-elegant hover:shadow-glow transition-smooth"
              >
                {user ? 'Ir al Dashboard' : 'Iniciar Sesión'}
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 px-6 bg-background">
        <div className="container mx-auto max-w-6xl">
          <h2 className="text-3xl md:text-4xl font-bold text-center mb-16">
            Características Principales
          </h2>
          
          <div className="grid md:grid-cols-3 gap-8">
            <div className="bg-card rounded-xl p-8 shadow-elegant hover:shadow-glow transition-smooth border border-border">
              <div className="h-14 w-14 rounded-lg bg-primary/10 flex items-center justify-center mb-6">
                <Shield className="h-7 w-7 text-primary" />
              </div>
              <h3 className="text-xl font-semibold mb-3">Sistema Seguro</h3>
              <p className="text-muted-foreground">
                Gestión de roles con autenticación robusta y control de acceso granular
              </p>
            </div>

            <div className="bg-card rounded-xl p-8 shadow-elegant hover:shadow-glow transition-smooth border border-border">
              <div className="h-14 w-14 rounded-lg bg-secondary/20 flex items-center justify-center mb-6">
                <Users className="h-7 w-7 text-secondary" />
              </div>
              <h3 className="text-xl font-semibold mb-3">Multi-Rol</h3>
              <p className="text-muted-foreground">
                Dashboards personalizados para administradores, empresas y expertos
              </p>
            </div>

            <div className="bg-card rounded-xl p-8 shadow-elegant hover:shadow-glow transition-smooth border border-border">
              <div className="h-14 w-14 rounded-lg bg-accent/20 flex items-center justify-center mb-6">
                <TrendingUp className="h-7 w-7 text-accent" />
              </div>
              <h3 className="text-xl font-semibold mb-3">Eficiencia</h3>
              <p className="text-muted-foreground">
                Optimiza procesos y mejora la productividad con herramientas intuitivas
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-6 gradient-subtle">
        <div className="container mx-auto max-w-4xl text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-6">
            ¿Listo para comenzar?
          </h2>
          <p className="text-xl text-muted-foreground mb-8">
            Únete a nuestra plataforma y lleva la gestión al siguiente nivel
          </p>
          <Button
            size="lg"
            onClick={handleGetStarted}
            className="text-lg shadow-elegant hover:shadow-glow transition-smooth"
          >
            {user ? 'Acceder al Sistema' : 'Crear Cuenta'}
            <ArrowRight className="ml-2 h-5 w-5" />
          </Button>
        </div>
      </section>
    </div>
  );
};

export default Landing;
