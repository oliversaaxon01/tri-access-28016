import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { realtimeEvents } from '@/lib/realtime-events';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ChatDialog } from '@/components/ChatDialog';
import { MessageSquare, Bell, User, Briefcase, Check, X, Users } from 'lucide-react';
import { Match, ExpertProfile, Challenge } from '@/lib/db';
import { Checkbox } from '@/components/ui/checkbox';
import { useToast } from '@/hooks/use-toast';

const CATEGORIES = [
  { id: 'tecnologia', label: 'Tecnología' },
  { id: 'infraestructura', label: 'Infraestructura' },
  { id: 'sostenibilidad', label: 'Sostenibilidad' },
  { id: 'innovacion', label: 'Innovación' },
  { id: 'consultoria', label: 'Consultoría' },
];
import { 
  getMatchesByExperto, 
  updateMatch, 
  getExpertProfile, 
  saveExpertProfile,
  getAllActiveChallenges,
  getChallengeById
} from '@/lib/db-operations';
import { db } from '@/lib/db';

const ExpertoDashboard = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [matches, setMatches] = useState<Match[]>([]);
  const [challenges, setChallenges] = useState<Challenge[]>([]);
  const [profile, setProfile] = useState<ExpertProfile>({
    userId: user!.id,
    expertise: [],
    categories: [],
    experience: '',
    availability: '',
    hourlyRate: '',
    bio: '',
    validated: false,
    updatedAt: Date.now(),
  });
  const [selectedChat, setSelectedChat] = useState<{ matchId: string; userName: string } | null>(null);
  const [expertiseInput, setExpertiseInput] = useState('');
  const [empresaNames, setEmpresaNames] = useState<Record<string, string>>({});

  useEffect(() => {
    loadData();

    // Escuchar eventos en tiempo real
    const unsubscribeMatch = realtimeEvents.on('match-created', () => {
      loadData();
    });

    const unsubscribeMatchUpdate = realtimeEvents.on('match-updated', () => {
      loadData();
    });

    const unsubscribeMessage = realtimeEvents.on('message-created', () => {
      loadData();
    });

    const unsubscribeChallenge = realtimeEvents.on('challenge-created', () => {
      loadData();
    });

    // Limpiar listeners al desmontar
    return () => {
      unsubscribeMatch();
      unsubscribeMatchUpdate();
      unsubscribeMessage();
      unsubscribeChallenge();
    };
  }, [user]);

  const loadData = async () => {
    if (!user) return;

    try {
      const userMatches = await getMatchesByExperto(user.id);
      setMatches(userMatches);

      const allChallenges = await getAllActiveChallenges();
      
      // Filter challenges by matching categories
      const existingProfile = await getExpertProfile(user.id);
      if (existingProfile && existingProfile.categories?.length > 0) {
        const filteredChallenges = allChallenges.filter(challenge => 
          challenge.categories?.some(cat => existingProfile.categories.includes(cat))
        );
        setChallenges(filteredChallenges);
      } else {
        setChallenges(allChallenges);
      }

      const savedProfile = await getExpertProfile(user.id);
      if (savedProfile) {
        setProfile(savedProfile);
      }

      // Load empresa names
      const names: Record<string, string> = {};
      const empresaIds = [...new Set(userMatches.map(m => m.empresaId))];
      for (const empresaId of empresaIds) {
        const empresaUser = await db.getUserById(empresaId);
        if (empresaUser) {
          names[empresaId] = empresaUser.name;
        }
      }
      setEmpresaNames(names);
    } catch (error) {
      console.error('Error loading data:', error);
    }
  };

  const handleAcceptMatch = async (matchId: string) => {
    try {
      await updateMatch(matchId, {
        expertoInterested: true,
        status: 'matched',
      });
      await loadData();
    } catch (error) {
      console.error('Error accepting match:', error);
    }
  };

  const handleRejectMatch = async (matchId: string) => {
    try {
      await updateMatch(matchId, {
        expertoInterested: false,
        status: 'rejected',
      });
      await loadData();
    } catch (error) {
      console.error('Error rejecting match:', error);
    }
  };

  const handleSaveProfile = async () => {
    try {
      await saveExpertProfile(profile);
      toast({
        title: 'Perfil guardado',
        description: 'Tu perfil ha sido actualizado exitosamente',
      });
      await loadData(); // Reload data to reflect changes
    } catch (error) {
      console.error('Error saving profile:', error);
      toast({
        title: 'Error',
        description: 'No se pudo guardar el perfil',
        variant: 'destructive',
      });
    }
  };

  const addExpertise = () => {
    if (expertiseInput.trim() && !profile.expertise.includes(expertiseInput.trim())) {
      setProfile({
        ...profile,
        expertise: [...profile.expertise, expertiseInput.trim()],
      });
      setExpertiseInput('');
    }
  };

  const removeExpertise = (item: string) => {
    setProfile({
      ...profile,
      expertise: profile.expertise.filter((e) => e !== item),
    });
  };

  const toggleCategory = (categoryId: string) => {
    setProfile(prev => ({
      ...prev,
      categories: prev.categories.includes(categoryId)
        ? prev.categories.filter(c => c !== categoryId)
        : [...prev.categories, categoryId]
    }));
  };

  const potentialMatches = matches.filter(m => m.status === 'potential');
  const pendingRequests = matches.filter(m => m.status === 'pending' && m.empresaInterested && !m.expertoInterested);
  const confirmedMatches = matches.filter(m => m.status === 'matched');

  const stats = [
    { label: 'Solicitudes Pendientes', value: pendingRequests.length.toString(), icon: Bell },
    { label: 'Proyectos Activos', value: confirmedMatches.length.toString(), icon: Briefcase },
    { label: 'Retos Disponibles', value: challenges.length.toString(), icon: MessageSquare },
  ];

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold mb-2">Panel de Experto</h1>
        <p className="text-muted-foreground">Gestiona tu perfil y oportunidades profesionales</p>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        {stats.map((stat, index) => (
          <Card key={index} className="shadow-elegant hover:shadow-glow transition-smooth">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{stat.label}</CardTitle>
              <stat.icon className="h-4 w-4 text-primary" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stat.value}</div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Tabs defaultValue="matches" className="space-y-6">
        <TabsList>
          <TabsTrigger value="matches">Matches Potenciales</TabsTrigger>
          <TabsTrigger value="solicitudes">Solicitudes</TabsTrigger>
          <TabsTrigger value="chats">Chats</TabsTrigger>
          <TabsTrigger value="perfil">Perfil</TabsTrigger>
        </TabsList>

        <TabsContent value="matches" className="space-y-4">
          <div className="mb-4 p-4 bg-muted/50 rounded-lg">
            <p className="text-sm text-muted-foreground">
              💡 El admin ha encontrado estos retos que coinciden con tus categorías de experiencia. 
              Revisa los detalles y envía solicitudes a los que más te interesen.
            </p>
          </div>
          {potentialMatches.length === 0 ? (
            <Card className="shadow-elegant">
              <CardContent className="py-12 text-center">
                <Users className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                <p className="text-muted-foreground">No hay matches potenciales</p>
                <p className="text-sm text-muted-foreground mt-2">El admin debe ejecutar el matching primero</p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4">
              {potentialMatches.map((match) => {
                const challenge = challenges.find(c => c.id === match.challengeId);
                const empresaName = empresaNames[match.empresaId] || 'Empresa';
                return (
                  <Card key={match.id} className="shadow-elegant hover:shadow-glow transition-smooth">
                    <CardHeader>
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <CardTitle className="text-lg flex items-center gap-2">
                            <span>🔄</span>
                            {empresaName}
                          </CardTitle>
                          <CardDescription className="mt-1">
                            Reto: {challenge?.title || 'Cargando...'} • Compatibilidad: {match.matchScore?.toFixed(0)}%
                          </CardDescription>
                        </div>
                        <Badge variant="default" className="ml-2">Match</Badge>
                      </div>
                    </CardHeader>
                    <CardContent>
                      {challenge ? (
                        <div className="space-y-4">
                          <p className="text-sm text-muted-foreground">{challenge.description}</p>
                          
                          <div className="space-y-2">
                            <p className="text-sm font-medium">Categorías del reto:</p>
                            <div className="flex flex-wrap gap-2">
                              {challenge.categories?.map(cat => (
                                <Badge key={cat} variant="secondary">{cat}</Badge>
                              ))}
                            </div>
                          </div>

                          <div className="flex items-center gap-4 text-sm text-muted-foreground">
                            <span>💰 {challenge.budget}</span>
                            <span>📅 {new Date(challenge.deadline).toLocaleDateString()}</span>
                          </div>
                        </div>
                      ) : (
                        <p className="text-sm text-muted-foreground">Cargando información del reto...</p>
                      )}
                      <Button
                        onClick={async () => {
                          await updateMatch(match.id, {
                            expertoInterested: true,
                            status: 'pending',
                          });
                          await loadData();
                        }}
                        className="w-full mt-4"
                      >
                        <Users className="mr-2 h-4 w-4" />
                        Enviar Solicitud de Match
                      </Button>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </TabsContent>

        <TabsContent value="solicitudes" className="space-y-4">
          <div className="mb-4 p-4 bg-muted/50 rounded-lg">
            <p className="text-sm text-muted-foreground">
              🔔 Estas son las solicitudes de empresas interesadas en trabajar contigo. 
              Acepta para habilitar el chat y comenzar la colaboración.
            </p>
          </div>
          {pendingRequests.length === 0 ? (
            <Card className="shadow-elegant">
              <CardContent className="py-12 text-center">
                <Bell className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                <p className="text-muted-foreground">No tienes solicitudes pendientes</p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4">
              {pendingRequests.map((match) => {
                const challenge = challenges.find(c => c.id === match.challengeId);
                const empresaName = empresaNames[match.empresaId] || 'Empresa';
                return (
                  <Card key={match.id} className="shadow-elegant hover:shadow-glow transition-smooth">
                    <CardHeader>
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <CardTitle className="text-lg flex items-center gap-2">
                            <span>🔄</span>
                            {empresaName}
                          </CardTitle>
                          <CardDescription className="mt-1">
                            Reto: {challenge?.title || 'Cargando...'}
                          </CardDescription>
                        </div>
                        <Badge variant="secondary">Pendiente</Badge>
                      </div>
                    </CardHeader>
                    <CardContent>
                      {challenge && (
                        <div className="space-y-4 mb-4">
                          <p className="text-sm text-muted-foreground">{challenge.description}</p>
                          <div>
                            <p className="text-sm font-medium mb-1">Categorías:</p>
                            <div className="flex flex-wrap gap-2">
                              {challenge.categories?.map(cat => (
                                <Badge key={cat} variant="secondary">{cat}</Badge>
                              ))}
                            </div>
                          </div>
                          <div className="flex items-center gap-4 text-sm text-muted-foreground">
                            <span>💰 {challenge.budget}</span>
                            <span>📅 {new Date(challenge.deadline).toLocaleDateString()}</span>
                          </div>
                        </div>
                      )}
                      <div className="flex gap-3">
                        <Button
                          variant="outline"
                          className="flex-1 border-destructive text-destructive hover:bg-destructive hover:text-destructive-foreground"
                          onClick={() => handleRejectMatch(match.id)}
                        >
                          <X className="mr-2 h-4 w-4" />
                          Rechazar
                        </Button>
                        <Button
                          className="flex-1"
                          onClick={() => handleAcceptMatch(match.id)}
                        >
                          <Check className="mr-2 h-4 w-4" />
                          Aceptar y Habilitar Chat
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </TabsContent>

        <TabsContent value="chats" className="space-y-4">
          {confirmedMatches.length === 0 ? (
            <Card className="shadow-elegant">
              <CardContent className="py-12 text-center">
                <MessageSquare className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                <p className="text-muted-foreground">No tienes chats activos</p>
                <p className="text-sm text-muted-foreground mt-2">Acepta solicitudes para iniciar conversaciones</p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4 md:grid-cols-2">
              {confirmedMatches.map((match) => {
                const empresaName = empresaNames[match.empresaId] || 'Empresa';
                return (
                  <Card key={match.id} className="shadow-elegant hover:shadow-glow transition-smooth">
                    <CardHeader>
                      <CardTitle className="text-lg flex items-center gap-2">
                        <span>🔄</span>
                        {empresaName}
                      </CardTitle>
                      <CardDescription>Chat activo</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <Button
                        onClick={() => setSelectedChat({ matchId: match.id, userName: empresaName })}
                        className="w-full"
                      >
                        <MessageSquare className="mr-2 h-4 w-4" />
                        Abrir Chat
                      </Button>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </TabsContent>

        <TabsContent value="perfil">
          <Card className="shadow-elegant">
            <CardHeader>
              <CardTitle>Editor de Perfil Profesional</CardTitle>
              <CardDescription>Completa tu perfil para atraer mejores oportunidades</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="bio">Biografía</Label>
                <Textarea
                  id="bio"
                  value={profile.bio}
                  onChange={(e) => setProfile({ ...profile, bio: e.target.value })}
                  placeholder="Describe tu experiencia y especialización..."
                  rows={4}
                />
              </div>

              <div className="space-y-2">
                <Label>Categorías de Especialización</Label>
                <div className="grid grid-cols-2 gap-3 p-4 border rounded-lg">
                  {CATEGORIES.map((cat) => (
                    <div key={cat.id} className="flex items-center space-x-2">
                      <Checkbox
                        id={`expert-${cat.id}`}
                        checked={profile.categories.includes(cat.id)}
                        onCheckedChange={() => toggleCategory(cat.id)}
                      />
                      <Label htmlFor={`expert-${cat.id}`} className="cursor-pointer font-normal">
                        {cat.label}
                      </Label>
                    </div>
                  ))}
                </div>
              </div>

              <div className="space-y-2">
                <Label>Áreas de Expertise Específicas</Label>
                <div className="flex gap-2">
                  <Input
                    value={expertiseInput}
                    onChange={(e) => setExpertiseInput(e.target.value)}
                    placeholder="Ej: Energía Renovable"
                    onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addExpertise())}
                  />
                  <Button type="button" onClick={addExpertise}>Agregar</Button>
                </div>
                <div className="flex flex-wrap gap-2 mt-2">
                  {profile.expertise.map((item) => (
                    <Badge key={item} variant="secondary" className="cursor-pointer" onClick={() => removeExpertise(item)}>
                      {item} ✕
                    </Badge>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="experience">Años de Experiencia</Label>
                  <Input
                    id="experience"
                    value={profile.experience}
                    onChange={(e) => setProfile({ ...profile, experience: e.target.value })}
                    placeholder="Ej: 5+"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="hourlyRate">Tarifa por Hora</Label>
                  <Input
                    id="hourlyRate"
                    value={profile.hourlyRate}
                    onChange={(e) => setProfile({ ...profile, hourlyRate: e.target.value })}
                    placeholder="Ej: $50/hora"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="availability">Disponibilidad</Label>
                <Input
                  id="availability"
                  value={profile.availability}
                  onChange={(e) => setProfile({ ...profile, availability: e.target.value })}
                  placeholder="Ej: Tiempo completo, Part-time"
                />
              </div>

              <Button onClick={handleSaveProfile} className="w-full">
                <User className="mr-2 h-4 w-4" />
                Guardar Perfil
              </Button>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {selectedChat && (
        <ChatDialog
          matchId={selectedChat.matchId}
          otherUserName={selectedChat.userName}
          open={!!selectedChat}
          onOpenChange={(open) => !open && setSelectedChat(null)}
        />
      )}
    </div>
  );
};

export default ExpertoDashboard;
